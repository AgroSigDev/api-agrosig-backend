import { pool } from '../../lib/db.js'
import { validateActivity, validateInputsArray } from '../../middlewares/index.js'
import { normalizeInputCost } from '../../helpers/index.js'
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  InternalServerError,
  BadRequestError
} from '../../lib/api.errors.js'
import { logger } from '../../utils/logger.utils.js'

/**
 * Creates a new activity with associated inputs for a specific crop and user.
 * Performs validation, checks for duplicates, inserts the activity and inputs in a transaction,
 * and updates totals for the activity and crop.
 * @param {number} userId - The ID of the user creating the activity.
 * @param {number} cropId - The ID of the crop the activity belongs to.
 * @param {object} activityData - The data for the activity.
 * @param {string} activityData.activity_type - The type of activity.
 * @param {Date} [activityData.date] - The date of the activity, defaults to current date if not provided.
 * @param {string} activityData.description - Description of the activity.
 * @param {Array} inputs - Array of input objects to associate with the activity.
 * @returns {Promise<object>} An object containing the created activity, inputs, and updated crop cost total.
 * @throws {ValidationError} If activityData or inputs fail validation.
 * @throws {NotFoundError} If the crop does not exist or is not active.
 * @throws {ConflictError} If a duplicate activity is detected within 10 minutes.
 * @throws {BadRequestError} If there's an error processing an input.
 * @throws {InternalServerError} For other database or unexpected errors.
 */
async function createActivityWithInputs (userId, cropId, activityData, inputs) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    logger.info('Iniciando creación de actividad', { userId, cropId, activityType: activityData.activity_type })

    // Validar datos de entrada
    try {
      await validateActivity(activityData)
      await validateInputsArray(inputs)
    } catch (validationError) {
      logger.warn('Error de validación en actividad', {
        userId,
        cropId,
        error: validationError.message
      })
      throw new ValidationError(validationError.message, { activityData, inputs })
    }

    // Validar que el cultivo existe y pertenece al usuario
    const existingCrop = await getCropById(client, userId, cropId)
    if (!existingCrop) {
      logger.warn('Intento de crear actividad en cultivo no existente o inactivo', {
        userId,
        cropId
      })
      throw new NotFoundError('El cultivo no pertenece al usuario o no está activo', { cropId })
    }

    // Validación de duplicados
    const duplicate = await checkDuplicateActivity(client, userId, cropId, activityData)
    if (duplicate) {
      logger.warn('Intento de crear actividad duplicada', {
        userId,
        cropId,
        activityType: activityData.activity_type
      })
      throw new ConflictError('Actividad duplicada detectada. Por favor espere antes de crear otra actividad idéntica.', {
        existingActivityId: duplicate.activity_id,
        timeWindow: '10 minutes'
      })
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

    logger.debug('Actividad creada exitosamente', {
      activityId: activity.activity_id,
      activityType: activity.activity_type
    })

    // Insertar insumos
    const insertedInputsArray = []
    let activityTotal = 0

    for (const input of inputs) {
      try {
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

        logger.debug('Insumo agregado a actividad', {
          activityId: activity.activity_id,
          inputName: insertedInput.input_name,
          costTotal: insertedInput.cost_total
        })
      } catch (inputError) {
        logger.error('Error al insertar insumo', {
          activityId: activity.activity_id,
          input,
          error: inputError.message
        })
        throw new BadRequestError(`Error processing input: ${inputError.message}`, { input })
      }
    }

    // Actualizar totales
    await updateActivityTotal(client, activity.activity_id, activityTotal)
    const cropTotal = await calculateCropTotal(client, cropId)
    await updateCropTotal(client, cropId, cropTotal)

    await client.query('COMMIT')

    logger.info('Actividad creada exitosamente con todos los insumos', {
      activityId: activity.activity_id,
      totalInputs: insertedInputsArray.length,
      activityTotal,
      cropTotal
    })

    return {
      activity: { ...activity, cost_total: parseFloat(activityTotal) },
      inputs: insertedInputsArray,
      crop_cost_total: parseFloat(cropTotal)
    }
  } catch (error) {
    await client.query('ROLLBACK')

    logger.error('Error en transacción de creación de actividad', {
      userId,
      cropId,
      error: error.message,
      stack: error.stack
    })

    // Si ya es un ApiError, lo relanzamos
    if (error.name && error.statusCode) {
      throw error
    }

    // Para errores genéricos de base de datos
    if (error.code && error.code.startsWith('23')) { // Códigos de error de PostgreSQL para constraints
      throw new ConflictError('Database constraint violation', {
        originalError: error.message,
        code: error.code
      })
    }

    throw new InternalServerError('Error creando actividad', {
      originalError: error.message
    })
  } finally {
    client.release()
  }
}

/**
 * Checks if a duplicate activity exists for the user, crop, and activity data within the last 10 minutes.
 * @param {object} client - The database client for the transaction.
 * @param {number} userId - The ID of the user.
 * @param {number} cropId - The ID of the crop.
 * @param {object} activityData - The activity data to check for duplicates.
 * @param {string} activityData.activity_type - The type of activity.
 * @param {Date} activityData.date - The date of the activity.
 * @param {string} activityData.description - Description of the activity.
 * @returns {Promise<object|null>} The duplicate activity row if found, otherwise null.
 */
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

/**
 * Retrieves a crop by ID for a specific user, ensuring it is active.
 * @param {object} client - The database client for the transaction.
 * @param {number} userId - The ID of the user.
 * @param {number} cropId - The ID of the crop.
 * @returns {Promise<object|null>} The crop row if found and active, otherwise null.
 */
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

/**
 * Calculates the total cost of all inputs for a specific activity.
 * @param {object} client - The database client for the transaction.
 * @param {number} activityId - The ID of the activity.
 * @returns {Promise<number>} The total cost of the activity's inputs.
 */
async function calculateActivityTotal (client, activityId) {
  const query = {
    text: 'SELECT COALESCE(SUM(cost_total), 0) AS total FROM input_used WHERE activity_id = $1',
    values: [activityId]
  }

  const result = await client.query(query)
  return parseFloat(result.rows[0].total)
}

/**
 * Calculates the total cost of all activities for a specific crop.
 * @param {object} client - The database client for the transaction.
 * @param {number} cropId - The ID of the crop.
 * @returns {Promise<number>} The total cost of the crop's activities.
 */
async function calculateCropTotal (client, cropId) {
  const query = {
    text: 'SELECT COALESCE(SUM(cost_total), 0) AS total FROM activity WHERE crop_id = $1',
    values: [cropId]
  }

  const result = await client.query(query)
  return parseFloat(result.rows[0].total)
}

/**
 * Updates the total cost of a specific activity.
 * @param {object} client - The database client for the transaction.
 * @param {number} activityId - The ID of the activity.
 * @param {number} total - The new total cost for the activity.
 * @returns {Promise<void>}
 */
async function updateActivityTotal (client, activityId, total) {
  const query = {
    text: 'UPDATE activity SET cost_total = $1, updated_at = NOW() WHERE activity_id = $2',
    values: [total, activityId]
  }

  await client.query(query)
}

/**
 * Updates the total cost of a specific crop.
 * @param {object} client - The database client for the transaction.
 * @param {number} cropId - The ID of the crop.
 * @param {number} total - The new total cost for the crop.
 * @returns {Promise<void>}
 */
async function updateCropTotal (client, cropId, total) {
  const query = {
    text: 'UPDATE crop SET cost_total = $1, updated_at = NOW() WHERE crop_id = $2',
    values: [total, cropId]
  }

  await client.query(query)
}

/**
 * Retrieves all activities for a specific crop and user, including associated inputs.
 * @param {number} userId - The ID of the user.
 * @param {number} cropId - The ID of the crop.
 * @returns {Promise<Array>} An array of activity objects with inputs aggregated as JSON.
 * @throws {InternalServerError} If there's an error querying the database.
 */
async function getActivitiesByCrop (userId, cropId) {
  try {
    logger.debug('Obteniendo actividades por cultivo', { userId, cropId })

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

    logger.debug('Actividades obtenidas exitosamente', {
      cropId,
      count: result.rows.length
    })

    return result.rows
  } catch (error) {
    logger.error('Error obteniendo actividades por cultivo', {
      userId,
      cropId,
      error: error.message
    })

    if (error.name && error.statusCode) {
      throw error
    }

    throw new InternalServerError('Error obteniendo actividades', {
      originalError: error.message
    })
  }
}

/**
 * Retrieves a specific activity by ID for a user, including associated inputs.
 * @param {number} userId - The ID of the user.
 * @param {number} activityId - The ID of the activity.
 * @returns {Promise<object>} The activity object with inputs aggregated as JSON.
 * @throws {NotFoundError} If the activity is not found or does not belong to the user.
 * @throws {InternalServerError} If there's an error querying the database.
 */
async function getActivityById (userId, activityId) {
  try {
    logger.debug('Obteniendo actividad por ID', { userId, activityId })

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
    const activity = result.rows[0] || null

    if (!activity) {
      logger.warn('Actividad no encontrada', { userId, activityId })
      throw new NotFoundError('Activity not found', { activityId })
    }

    logger.debug('Actividad obtenida exitosamente', { activityId })
    return activity
  } catch (error) {
    if (error.name && error.statusCode) {
      throw error
    }

    logger.error('Error obteniendo actividad por ID', {
      userId,
      activityId,
      error: error.message
    })

    throw new InternalServerError('Error getting activity', {
      originalError: error.message
    })
  }
}

/**
 * Retrieves all activities for a specific user across all crops, including associated inputs and crop type.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<Array>} An array of activity objects with inputs and crop type.
 * @throws {InternalServerError} If there's an error querying the database.
 */
async function getAllActivitiesByUser (userId) {
  try {
    logger.debug('Obteniendo todas las actividades del usuario', { userId })

    const query = {
      text: `
        SELECT 
          a.activity_id,
          a.crop_id,
          c.crop_type,
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
        LEFT JOIN crop c ON a.crop_id = c.crop_id
        WHERE a.user_id = $1
        GROUP BY a.activity_id, c.crop_type
        ORDER BY a.date DESC, a.created_at DESC
      `,
      values: [userId]
    }

    const result = await pool.query(query)

    logger.debug('Todas las actividades del usuario obtenidas', {
      userId,
      count: result.rows.length
    })

    return result.rows
  } catch (error) {
    logger.error('Error obteniendo todas las actividades del usuario', {
      userId,
      error: error.message
    })

    if (error.name && error.statusCode) {
      throw error
    }

    throw new InternalServerError('Error obteniendo todas las actividades del usuario', {
      originalError: error.message
    })
  }
}

/**
 * Deletes a specific activity and its associated inputs for a user, and recalculates the crop total.
 * @param {number} userId - The ID of the user.
 * @param {number} activityId - The ID of the activity.
 * @returns {Promise<boolean>} True if the deletion was successful.
 * @throws {NotFoundError} If the activity is not found or does not belong to the user.
 * @throws {InternalServerError} If there's an error during the transaction.
 */
async function deleteActivity (userId, activityId) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    logger.info('Iniciando eliminación de actividad', { userId, activityId })

    // Verificar que la actividad pertenece al usuario
    const activity = await getActivityById(userId, activityId)
    if (!activity) {
      logger.warn('Intento de eliminar actividad no existente', { userId, activityId })
      throw new NotFoundError('Activity not found or does not belong to user', { activityId })
    }

    // Eliminar insumos primero
    const deleteInputsQuery = {
      text: 'DELETE FROM input_used WHERE activity_id = $1',
      values: [activityId]
    }
    await client.query(deleteInputsQuery)
    logger.debug('Insumos de actividad eliminados', { activityId })

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

    logger.info('Actividad eliminada exitosamente', {
      activityId,
      cropId: activity.crop_id,
      newCropTotal: cropTotal
    })

    return true
  } catch (error) {
    await client.query('ROLLBACK')

    logger.error('Error eliminando actividad', {
      userId,
      activityId,
      error: error.message
    })

    if (error.name && error.statusCode) {
      throw error
    }

    throw new InternalServerError('Error deleting activity', {
      originalError: error.message
    })
  } finally {
    client.release()
  }
}

export const Activitys = {
  createActivityWithInputs,
  getActivitiesByCrop,
  getActivityById,
  getAllActivitiesByUser,
  deleteActivity,
  getCropById: (userId, cropId) => getCropById(pool, userId, cropId),
  calculateActivityTotal: (activityId) => calculateActivityTotal(pool, activityId),
  calculateCropTotal: (cropId) => calculateCropTotal(pool, cropId)
}
