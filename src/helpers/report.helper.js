import { Report } from '../models/index.js'
import { NotFoundError, InternalServerError } from '../lib/api.errors.js'
import { logger } from '../utils/logger.utils.js'

/**
 * Generates a comprehensive report for a specific crop, including crop details, activities, inputs, and cost summaries.
 * Validates that the crop exists and belongs to the user before compiling the report data.
 * @param {number} cropId - The ID of the crop to generate the report for.
 * @param {number} userId - The ID of the user requesting the report.
 * @returns {Promise<object>} An object containing crop information, summary statistics, activities, and inputs.
 * @throws {NotFoundError} If the crop is not found or the user does not have permission to view it.
 * @throws {InternalServerError} For other database or unexpected errors.
 */
async function getCropReport (cropId, userId) {
  try {
    logger.reports.info('Helper - Generando reporte de cultivo', { cropId, userId })

    const crop = await Report.getCropId(cropId)

    if (!crop) {
      logger.reports.warn('Helper - Cultivo no encontrado', { cropId, userId })
      throw new NotFoundError('Cultivo no encontrado')
    }

    if (crop.user_id !== userId) {
      logger.reports.warn('Helper - El usuario no tiene permisos para ver este informe', { cropId, userId })
      throw new NotFoundError('No tiene permisos para ver este informe')
    }

    const activities = await Report.getActivitiesByCropId(cropId)
    const inputs = await Report.getInputsByCropId(cropId)
    const costByActivityType = await Report.getCostByActivityType(cropId)
    const costByInput = await Report.getCostByInput(cropId)
    const costEvolution = await Report.getCostEvolution(cropId)

    // organiza inputs por actividad para mostrar en PDF
    const totalCost = costByActivityType.reduce((acc, item) => acc + Number(item.total_cost), 0)

    const reportData = {
      crop,
      summary: {
        totalCost,
        costByActivityType,
        costByInput,
        costEvolution
      },
      activities,
      inputs
    }

    logger.reports.info('Helper - Reporte de cultivo generado exitosamente', {
      cropId,
      userId,
      totalActivities: activities.length,
      totalInputs: inputs.length,
      totalCost
    })

    return reportData
  } catch (error) {
    logger.reports.error('Helper - Error generando reporte de cultivo', {
      cropId,
      userId,
      error: error.message
    })

    if (error instanceof NotFoundError) {
      throw error
    }
    throw new InternalServerError('Error generando reporte', { original: error.message })
  }
}

export {
  getCropReport
}
