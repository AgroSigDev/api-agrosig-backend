import { pool } from '../../lib/db.js'
import { validateActivity, validateInputsArray } from '../../middlewares/index.js'

async function createActivityWithnputs (userId, cropId, activityData, inputs) {
  try {
    await validateActivity(activityData)

    await validateInputsArray(inputs)

    // Validate crop
    const existingCrop = await getCropById(userId, cropId)
    if (!existingCrop) {
      throw new Error('The crop does not belong to the user or is not active')
    }

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
        0 // Initial cost total, will be updated
      ]
    }

    const activityResult = await pool.query(activityInsertQuery)
    const activity = activityResult.rows[0]

    // Insertar insumos (cost_total en columna generada)
    const insertedInputs = []
    for (const input of inputs) {
      const inputInsertQuery = {
        text: `
        INSERT INTO input_used (activity_id, input_name, unit, quantity, unit_cost)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING input_id, input_name, unit, quantity, unit_cost, cost_total, created_at
      `,
        values: [
          activity.activity_id,
          input.input_name,
          input.unit,
          input.quantity,
          input.unit_cost
        ]
      }
      const inputResult = await pool.query(inputInsertQuery)
      insertedInputs.push(inputResult.rows[0])
    }

    // Calculate and update activity total
    const activityTotal = await calculateActivityTotal(activity.activity_id)
    await updateActivityTotal(activity.activity_id, activityTotal)

    // Calculate and update crop total
    const cropTotal = await calculateCropTotal(cropId)
    await updateCropTotal(cropId, cropTotal)

    return {
      activity: { ...activity, cost_total: parseFloat(activityTotal) },
      inputs: insertedInputs,
      crop_cost_total: parseFloat(cropTotal)
    }
  } catch (error) {
    console.log('Error creating activity: ', error)
    throw error
  }
}

async function getActivitysWithInputs (activityId) {
  try {
    const query = {
      text: 'SELECT a*, CO',
      values: [activityId]
    }
    const result = await pool.query(query)
    return result.rows[0]
  } catch (error) {

  }
}

async function getCropById (userId, cropId) {
  try {
    const query = {
      text: 'SELECT crop_id FROM crop WHERE user_id = $1 AND crop_id = $2 AND is_active = true LIMIT 1',
      values: [userId, cropId]
    }
    const result = await pool.query(query)
    return result.rows[0]
  } catch (error) {
    console.log('Error getting crop: ', error)
    throw error
  }
}

async function calculateActivityTotal (activityId) {
  try {
    const query = {
      text: 'SELECT COALESCE(SUM(cost_total), 0) AS total FROM input_used WHERE activity_id = $1',
      values: [activityId]
    }
    const result = await pool.query(query)
    return result.rows[0].total
  } catch (error) {
    console.log('Error calculating activity total: ', error)
    throw error
  }
}

async function calculateCropTotal (cropId) {
  try {
    const query = {
      text: 'SELECT COALESCE(SUM(cost_total), 0) AS total FROM activity WHERE crop_id = $1',
      values: [cropId]
    }
    const result = await pool.query(query)
    return result.rows[0].total
  } catch (error) {
    console.log('Error calculating crop total: ', error)
    throw error
  }
}

async function updateActivityTotal (activityId, total) {
  const query = {
    text: 'UPDATE activity SET cost_total = $1 WHERE activity_id = $2',
    values: [total, activityId]
  }
  await pool.query(query)
}

async function updateCropTotal (cropId, total) {
  const query = {
    text: 'UPDATE crop SET cost_total = $1, updated_at = NOW() WHERE crop_id = $2',
    values: [total, cropId]
  }
  await pool.query(query)
}

async function getCostTotal (activityId) {
  try {
    const query = {
      text: 'SELECT COALESCE(SUM(cost_total), 0) AS total FROM input_used WHERE activity_id = $1',
      values: [activityId]
    }
    const result = await pool.query(query)
    return result.rows[0].total
  } catch (error) {
    console.log('Error calculating total cost: ', error)
    throw error
  }
}

export const Activitys = {
  createActivityWithnputs,
  getActivitysWithInputs,
  getCropById,
  calculateActivityTotal,
  calculateCropTotal,
  updateActivityTotal,
  updateCropTotal,
  getCostTotal
}
