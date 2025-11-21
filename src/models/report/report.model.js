import { pool } from '../../lib/db.js'
import { logger } from '../../utils/logger.utils.js'

/**
 * Retrieves basic information about a specific crop by its ID, ensuring it is active.
 * @param {number} cropId - The ID of the crop to retrieve.
 * @returns {Promise<object|null>} The crop data object if found, otherwise null.
 * @throws {Error} If there's an error querying the database.
 */
async function getCropId (cropId) {
  try {
    logger.reports.info('Obteniendo datos básicos del cultivo', { cropId })

    const query = {
      text: `SELECT crop_id, user_id, plot_id, crop_type, crop_variety, planting_date, harvest_date, cost_total
             FROM crop WHERE crop_id = $1 AND is_active = true`,
      values: [cropId]
    }
    const result = await pool.query(query)

    if (result.rows[0]) {
      logger.reports.info('Datos básicos del cultivo obtenidos exitosamente', { cropId })
    } else {
      logger.reports.warn('Cultivo no encontrado', { cropId })
    }

    return result.rows[0]
  } catch (error) {
    logger.reports.error('Error obteniendo datos básicos del cultivo', {
      cropId,
      error: error.message
    })
    throw error
  }
}

/**
 * Retrieves all activities associated with a specific crop, including their total costs.
 * @param {number} cropId - The ID of the crop.
 * @returns {Promise<Array>} An array of activity objects with activity_id, activity_type, date, description, and cost_total.
 * @throws {Error} If there's an error querying the database.
 */
async function getActivitiesByCropId (cropId) {
  try {
    logger.reports.info('Obteniendo actividades del cultivo', { cropId })

    const query = {
      text: `SELECT a.activity_id, a.activity_type, a.date, a.description, COALESCE(a.cost_total,0) as cost_total
             FROM activity a
             WHERE a.crop_id = $1
             ORDER BY a.date ASC`,
      values: [cropId]
    }
    const result = await pool.query(query)

    logger.reports.info('Actividades del cultivo obtenidas exitosamente', {
      cropId,
      total: result.rows.length
    })

    return result.rows
  } catch (error) {
    logger.reports.error('Error obteniendo actividades del cultivo', {
      cropId,
      error: error.message
    })
    throw error
  }
}

/**
 * Retrieves all inputs used in activities for a specific crop.
 * @param {number} cropId - The ID of the crop.
 * @returns {Promise<Array>} An array of input objects with input_id, activity_id, input_name, unit, quantity, unit_cost, and cost_total.
 * @throws {Error} If there's an error querying the database.
 */
async function getInputsByCropId (cropId) {
  try {
    logger.reports.info('Obteniendo insumos del cultivo', { cropId })

    const query = {
      text: `SELECT i.input_id, i.activity_id, i.input_name, i.unit, i.quantity, i.unit_cost, i.cost_total
             FROM input_used i
             JOIN activity a ON i.activity_id = a.activity_id
             WHERE a.crop_id = $1
             ORDER BY a.date, i.input_name`,
      values: [cropId]
    }
    const result = await pool.query(query)

    logger.reports.info('Insumos del cultivo obtenidos exitosamente', {
      cropId,
      total: result.rows.length
    })

    return result.rows
  } catch (error) {
    logger.reports.error('Error obteniendo insumos del cultivo', {
      cropId,
      error: error.message
    })
    throw error
  }
}

/**
 * Retrieves the total costs grouped by activity type for a specific crop.
 * @param {number} cropId - The ID of the crop.
 * @returns {Promise<Array>} An array of objects with activity_type and total_cost, ordered by total_cost descending.
 * @throws {Error} If there's an error querying the database.
 */
async function getCostByActivityType (cropId) {
  try {
    logger.reports.info('Obteniendo costos por tipo de actividad', { cropId })

    const query = {
      text: `SELECT a.activity_type, SUM(i.cost_total) as total_cost
             FROM activity a
             LEFT JOIN input_used i ON a.activity_id = i.activity_id
             WHERE a.crop_id = $1
             GROUP BY a.activity_type ORDER BY total_cost DESC`,
      values: [cropId]
    }
    const result = await pool.query(query)

    logger.reports.info('Costos por tipo de actividad obtenidos exitosamente', {
      cropId,
      total: result.rows.length
    })

    return result.rows
  } catch (error) {
    logger.reports.error('Error obteniendo costos por tipo de actividad', {
      cropId,
      error: error.message
    })
    throw error
  }
}

/**
 * Retrieves the total costs grouped by input name for a specific crop.
 * @param {number} cropId - The ID of the crop.
 * @returns {Promise<Array>} An array of objects with input_name and total_cost, ordered by total_cost descending.
 * @throws {Error} If there's an error querying the database.
 */
async function getCostByInput (cropId) {
  try {
    logger.reports.info('Obteniendo costos por tipo de insumo', { cropId })

    const query = {
      text: `SELECT i.input_name, SUM(i.cost_total) as total_cost
             FROM input_used i
             JOIN activity a ON i.activity_id = a.activity_id
             WHERE a.crop_id = $1
             GROUP BY i.input_name ORDER BY total_cost DESC`,
      values: [cropId]
    }
    const result = await pool.query(query)

    logger.reports.info('Costos por tipo de insumo obtenidos exitosamente', {
      cropId,
      total: result.rows.length
    })

    return result.rows
  } catch (error) {
    logger.reports.error('Error obteniendo costos por tipo de insumo', {
      cropId,
      error: error.message
    })
    throw error
  }
}

/**
 * Retrieves the monthly cost evolution for a specific crop, showing total costs per month.
 * @param {number} cropId - The ID of the crop.
 * @returns {Promise<Array>} An array of objects with month (date) and total_cost, ordered by month.
 * @throws {Error} If there's an error querying the database.
 */
async function getCostEvolution (cropId) {
  try {
    logger.reports.info('Obteniendo evolución de costos mensuales', { cropId })

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

    logger.reports.info('Evolución de costos mensuales obtenida exitosamente', {
      cropId,
      total: result.rows.length
    })

    return result.rows
  } catch (error) {
    logger.reports.error('Error obteniendo evolución de costos mensuales', {
      cropId,
      error: error.message
    })
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
