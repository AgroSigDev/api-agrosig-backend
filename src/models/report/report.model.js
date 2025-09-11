import { pool } from '../../lib/db.js'

async function getCostTotalByCropId (cropId) {
  try {
    const query = {
      text: 'SELECT c.crop_id, c.crop_type, c.crop_variety, SUM(i.cost_total) AS total_cost FROM crop c JOIN activity a ON c.crop_id = a.crop_id JOIN input i ON a.activity_id = i.activity_id WHERE c.crop_id = $1 GROUP BY c.crop_id',
      values: [cropId]
    }
    const result = await pool.query(query)
    return result.rows[0]
  } catch (error) {
    console.log('Error getting cost total by crop ID:', error)
    throw error
  }
}

async function getCostByActivityType (cropId, activityType) {
  try {
    const query = {
      text: `SELECT a.activity_type, SUM(i.cost_total) AS total_cost
      FROM activity a
      JOIN input_used i ON a.activity_id = i.activity_id
      WHERE a.crop_id = $1
      GROUP BY a.activity_type`,
      values: [cropId, activityType]
    }
    const result = await pool.query(query)
    return result.rows[0]
  } catch (error) {
    console.log('Error getting cost by activity type:', error)
    throw error
  }
}

async function getCostByInputUsed (cropId, inputName) {
  try {
    const query = {
      text: `SELECT i.input_name, SUM(i.cost_total) AS total_cost
        FROM input_used i
        JOIN activity a ON i.activity_id = a.activity_id
        WHERE a.crop_id = $1
        GROUP BY i.input_name`,
      values: [cropId, inputName]
    }
    const result = await pool.query(query)
    return result.rows[0]
  } catch (error) {
    console.log('Error getting cost by activity type:', error)
    throw error
  }
}

export const Report = {
  getCostTotalByCropId,
  getCostByActivityType,
  getCostByInputUsed
}
