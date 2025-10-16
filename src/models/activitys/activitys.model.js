import { pool } from '../../lib/db.js'
import { validateActivity, validateInputsArray } from '../../middlewares/index.js'
import { normalizeInputCost } from '../../helpers/index.js'

async function createActivityWithInputs (userId, cropId, activityData, inputs) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN') // Iniciar transacción

    // Validar datos de entrada
    await validateActivity(activityData)
    await validateInputsArray(inputs)

    // Validar que el cultivo existe y pertenece al usuario
    const existingCrop = await getCropById(client, userId, cropId)
    if (!existingCrop) {
      throw new Error('The crop does not belong to the user or is not active')
    }

    // Validación de duplicados más flexible
    const duplicate = await checkDuplicateActivity(client, userId, cropId, activityData)
    if (duplicate) {
      throw new Error('Duplicate activity detected. Please wait before creating another identical activity.')
    }

    // Insertar actividad
    const activityInsertQuery = {
      text: `
        INSERT INTO activity (crop_id, user_id, activity_type, date, description, cost_total)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING activity_id, crop_id, user_id, activity_type, date, description, cost_total, created_at
      `,
      values: [
        cropId,
        userId,
        activityData.activity_type,
        activityData.date || new Date(),
        activityData.description,
        0
      ]
    }

    const activityResult = await client.query(activityInsertQuery)
    const activity = activityResult.rows[0]

    // Insertar insumos
    const insertedInputsArray = []
    let activityTotal = 0

    for (const input of inputs) {
      const normalizedInput = await normalizeInputCost(input)

      const inputInsertQuery = {
        text: `
          INSERT INTO input_used (activity_id, input_name, unit, quantity, unit_cost, cost_unit, base_unit, conversion_factor)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING input_id, input_name, unit, quantity, unit_cost, cost_unit, base_unit, conversion_factor, cost_total, created_at
        `,
        values: [
          activity.activity_id,
          normalizedInput.input_name,
          normalizedInput.unit,
          normalizedInput.quantity,
          normalizedInput.unit_cost,
          normalizedInput.cost_unit,
          normalizedInput.base_unit,
          normalizedInput.conversion_factor
        ]
      }

      const inputResult = await client.query(inputInsertQuery)
      const insertedInput = inputResult.rows[0]
      insertedInputsArray.push(insertedInput)
      activityTotal += parseFloat(insertedInput.cost_total || 0)
    }

    // Actualizar totales
    await updateActivityTotal(client, activity.activity_id, activityTotal)

    // Calcular y actualizar total del cultivo
    const cropTotal = await calculateCropTotal(client, cropId)
    await updateCropTotal(client, cropId, cropTotal)

    await client.query('COMMIT') // Confirmar transacción

    return {
      activity: { ...activity, cost_total: parseFloat(activityTotal) },
      inputs: insertedInputsArray,
      crop_cost_total: parseFloat(cropTotal)
    }
  } catch (error) {
    await client.query('ROLLBACK') // Revertir en caso de error
    console.error('Error creating activity: ', error)
    throw error
  } finally {
    client.release()
  }
}

async function checkDuplicateActivity (client, userId, cropId, activityData) {
  const query = {
    text: `
       SELECT activity_id FROM activity 
      WHERE user_id = $1 
        AND crop_id = $2 
        AND activity_type = $3 
        AND date = $4 
        AND description = $5
        AND created_at > NOW() - INTERVAL '10 minutes'
      LIMIT 1
    `,
    values: [
      userId,
      cropId,
      activityData.activity_type,
      activityData.date,
      activityData.description
    ]
  }

  const result = await client.query(query)
  return result.rows[0]
}

async function getCropById (client, userId, cropId) {
  const query = {
    text: `
      SELECT crop_id, crop_type, is_active 
      FROM crop 
      WHERE user_id = $1 AND crop_id = $2 AND is_active = true 
      LIMIT 1
    `,
    values: [userId, cropId]
  }

  const result = await client.query(query)
  return result.rows[0]
}

async function calculateActivityTotal (client, activityId) {
  const query = {
    text: 'SELECT COALESCE(SUM(cost_total), 0) AS total FROM input_used WHERE activity_id = $1',
    values: [activityId]
  }

  const result = await client.query(query)
  return parseFloat(result.rows[0].total)
}

async function calculateCropTotal (client, cropId) {
  const query = {
    text: 'SELECT COALESCE(SUM(cost_total), 0) AS total FROM activity WHERE crop_id = $1',
    values: [cropId]
  }

  const result = await client.query(query)
  return parseFloat(result.rows[0].total)
}

async function updateActivityTotal (client, activityId, total) {
  const query = {
    text: 'UPDATE activity SET cost_total = $1, updated_at = NOW() WHERE activity_id = $2',
    values: [total, activityId]
  }

  await client.query(query)
}

async function updateCropTotal (client, cropId, total) {
  const query = {
    text: 'UPDATE crop SET cost_total = $1, updated_at = NOW() WHERE crop_id = $2',
    values: [total, cropId]
  }

  await client.query(query)
}

async function getActivitiesByCrop (userId, cropId) {
  try {
    const query = {
      text: `
        SELECT 
          a.activity_id,
          a.crop_id,
          a.user_id,
          a.activity_type,
          a.date,
          a.description,
          a.cost_total,
          a.created_at,
          a.updated_at,
          COALESCE(
            json_agg(
              json_build_object(
                'input_id', i.input_id,
                'input_name', i.input_name,
                'unit', i.unit,
                'quantity', i.quantity,
                'unit_cost', i.unit_cost,
                'cost_unit', i.cost_unit,
                'base_unit', i.base_unit,
                'conversion_factor', i.conversion_factor,
                'cost_total', i.cost_total,
                'created_at', i.created_at
              )
            ) FILTER (WHERE i.input_id IS NOT NULL), 
            '[]'
          ) as inputs
        FROM activity a
        LEFT JOIN input_used i ON a.activity_id = i.activity_id
        WHERE a.crop_id = $1 AND a.user_id = $2
        GROUP BY a.activity_id
        ORDER BY a.date DESC, a.created_at DESC
      `,
      values: [cropId, userId]
    }

    const result = await pool.query(query)
    return result.rows
  } catch (error) {
    console.error('Error getting activities: ', error)
    throw error
  }
}

async function getActivityById (userId, activityId) {
  try {
    const query = {
      text: `
        SELECT 
          a.activity_id,
          a.crop_id,
          a.user_id,
          a.activity_type,
          a.date,
          a.description,
          a.cost_total,
          a.created_at,
          a.updated_at,
          COALESCE(
            json_agg(
              json_build_object(
                'input_id', i.input_id,
                'input_name', i.input_name,
                'unit', i.unit,
                'quantity', i.quantity,
                'unit_cost', i.unit_cost,
                'cost_unit', i.cost_unit,
                'base_unit', i.base_unit,
                'conversion_factor', i.conversion_factor,
                'cost_total', i.cost_total,
                'created_at', i.created_at
              )
            ) FILTER (WHERE i.input_id IS NOT NULL), 
            '[]'
          ) as inputs
        FROM activity a
        LEFT JOIN input_used i ON a.activity_id = i.activity_id
        WHERE a.activity_id = $1 AND a.user_id = $2
        GROUP BY a.activity_id
      `,
      values: [activityId, userId]
    }

    const result = await pool.query(query)
    return result.rows[0] || null
  } catch (error) {
    console.error('Error getting activity: ', error)
    throw error
  }
}

async function deleteActivity (userId, activityId) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // Verificar que la actividad pertenece al usuario
    const activity = await getActivityById(userId, activityId)
    if (!activity) {
      throw new Error('Activity not found or does not belong to user')
    }

    // Eliminar insumos primero (por las foreign keys)
    const deleteInputsQuery = {
      text: 'DELETE FROM input_used WHERE activity_id = $1',
      values: [activityId]
    }
    await client.query(deleteInputsQuery)

    // Eliminar actividad
    const deleteActivityQuery = {
      text: 'DELETE FROM activity WHERE activity_id = $1 AND user_id = $2',
      values: [activityId, userId]
    }
    await client.query(deleteActivityQuery)

    // Recalcular total del cultivo
    const cropTotal = await calculateCropTotal(client, activity.crop_id)
    await updateCropTotal(client, activity.crop_id, cropTotal)

    await client.query('COMMIT')
    return true
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error deleting activity: ', error)
    throw error
  } finally {
    client.release()
  }
}

export const Activitys = {
  createActivityWithInputs,
  getActivitiesByCrop,
  getActivityById,
  deleteActivity,
  getCropById: (userId, cropId) => getCropById(pool, userId, cropId),
  calculateActivityTotal: (activityId) => calculateActivityTotal(pool, activityId),
  calculateCropTotal: (cropId) => calculateCropTotal(pool, cropId)
}
