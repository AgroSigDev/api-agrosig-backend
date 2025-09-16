// models/report.model.js
import { pool } from '../../lib/db.js'

async function getCropReportData (cropId) {
  try {
    // Obtener datos básicos del cultivo
    const cropQuery = {
      text: `SELECT c.crop_id, c.crop_type, c.crop_variety, c.planting_date, 
                    c.harvest_date, c.cost_total, u.name as user_name, p.name as plot_name
             FROM crop c
             JOIN users u ON c.user_id = u.user_id
             JOIN plots p ON c.plot_id = p.plot_id
             WHERE c.crop_id = $1`,
      values: [cropId]
    }

    // Obtener actividades con sus insumos
    const activitiesQuery = {
      text: `SELECT a.activity_id, a.activity_type, a.date, a.description, a.cost_total
             FROM activity a
             WHERE a.crop_id = $1
             ORDER BY a.date`,
      values: [cropId]
    }

    // Obtener costos por tipo de actividad
    const activityCostsQuery = {
      text: `SELECT a.activity_type, SUM(i.cost_total) as total_cost
             FROM activity a
             JOIN input_used i ON a.activity_id = i.activity_id
             WHERE a.crop_id = $1
             GROUP BY a.activity_type`,
      values: [cropId]
    }

    // Obtener costos por tipo de insumo
    const inputCostsQuery = {
      text: `SELECT i.input_name, SUM(i.cost_total) as total_cost
             FROM input_used i
             JOIN activity a ON i.activity_id = a.activity_id
             WHERE a.crop_id = $1
             GROUP BY i.input_name`,
      values: [cropId]
    }

    // Obtener todos los insumos con detalles
    const inputsQuery = {
      text: `SELECT i.input_id, i.input_name, i.quantity, i.unit, i.unit_cost, 
                    i.cost_total, a.activity_id, a.activity_type, a.date
             FROM input_used i
             JOIN activity a ON i.activity_id = a.activity_id
             WHERE a.crop_id = $1
             ORDER BY a.date, i.input_name`,
      values: [cropId]
    }

    // Obtener evolución de costos en el tiempo (por mes)
    const costEvolutionQuery = {
      text: `SELECT 
               DATE_TRUNC('month', a.date) as month,
               SUM(i.cost_total) as monthly_cost
             FROM activity a
             JOIN input_used i ON a.activity_id = i.activity_id
             WHERE a.crop_id = $1
             GROUP BY DATE_TRUNC('month', a.date)
             ORDER BY month`,
      values: [cropId]
    }

    // Ejecutar todas las consultas en paralelo
    const [
      cropResult,
      activitiesResult,
      activityCostsResult,
      inputCostsResult,
      inputsResult,
      costEvolutionResult
    ] = await Promise.all([
      pool.query(cropQuery),
      pool.query(activitiesQuery),
      pool.query(activityCostsQuery),
      pool.query(inputCostsQuery),
      pool.query(inputsQuery),
      pool.query(costEvolutionQuery)
    ])

    // Estructurar los datos para el reporte
    return {
      crop: cropResult.rows[0],
      activities: activitiesResult.rows,
      activityCosts: activityCostsResult.rows,
      inputCosts: inputCostsResult.rows,
      inputs: inputsResult.rows,
      costEvolution: costEvolutionResult.rows
    }
  } catch (error) {
    console.error('Error getting crop report data:', error)
    throw error
  }
}

export const Report = {
  getCropReportData
}
