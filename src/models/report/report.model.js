import { pool } from '../../lib/db.js'

// Datos basicos del cultivo
async function getCropId (cropId) {
  try {
    const query = {
      text: `SELECT crop_id, user_id, plot_id, crop_type, crop_variety, planting_date, harvest_date, cost_total
             FROM crop WHERE crop_id = $1 AND is_active = true`,
      values: [cropId]
    }
    const result = await pool.query(query)
    return result.rows[0]
  } catch (error) {
    console.log(error)
    throw error
  }
}

// Actividades del cultivo con su costo total
async function getActivitiesByCropId (cropId) {
  try {
    const query = {
      text: `SELECT a.activity_id, a.activity_type, a.date, a.description, COALESCE(a.cost_total,0) as cost_total
             FROM activity a
             WHERE a.crop_id = $1
             ORDER BY a.date ASC`,
      values: [cropId]
    }
    const result = await pool.query(query)
    return result.rows
  } catch (error) {
    console.log(error)
    throw error
  }
}

// Insumos por actividad
async function getInputsByCropId (cropId) {
  try {
    const query = {
      text: `SELECT i.input_id, i.activity_id, i.input_name, i.unit, i.quantity, i.unit_cost, i.cost_total
             FROM input_used i
             JOIN activity a ON i.activity_id = a.activity_id
             WHERE a.crop_id = $1
             ORDER BY a.date, i.input_name`,
      values: [cropId]
    }
    const result = await pool.query(query)
    return result.rows
  } catch (error) {
    console.log(error)
    throw error
  }
}

// Costos por el tipo de actividad
async function getCostByActivityType (cropId) {
  try {
    const query = {
      text: `SELECT a.activity_type, SUM(i.cost_total) as total_cost
             FROM activity a
             LEFT JOIN input_used i ON a.activity_id = i.activity_id
             WHERE a.crop_id = $1
             GROUP BY a.activity_type ORDER BY total_cost DESC`,
      values: [cropId]
    }
    const result = await pool.query(query)
    return result.rows
  } catch (error) {
    console.log(error)
    throw error
  }
}

// Costos por el tipo de insumo
async function getCostByInput (cropId) {
  try {
    const query = {
      text: `SELECT i.input_name, SUM(i.cost_total) as total_cost
             FROM input_used i
             JOIN activity a ON i.activity_id = a.activity_id
             WHERE a.crop_id = $1
             GROUP BY i.input_name ORDER BY total_cost DESC`,
      values: [cropId]
    }
    const result = await pool.query(query)
    return result.rows
  } catch (error) {
    console.log(error)
    throw error
  }
}

// Evolución de costos mensuales
async function getCostEvolution (cropId) {
  try {
    const query = {
      text: `SELECT DATE_TRUNC('month', a.date)::date as month,
             SUM(i.cost_total) as total_cost
      FROM activity a
      LEFT JOIN input_used i ON a.activity_id = i.activity_id
      WHERE a.crop_id = $1
      GROUP BY month
      ORDER BY month`,
      values: [cropId]
    }
    const result = await pool.query(query)
    return result.rows
  } catch (error) {
    console.log(error)
    throw error
  }
}

export const Report = {
  getCropId,
  getActivitiesByCropId,
  getInputsByCropId,
  getCostByActivityType,
  getCostByInput,
  getCostEvolution
}
