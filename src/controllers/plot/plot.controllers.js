import { NotFoundError } from '../../lib/api.errors.js'
import { Plot } from '../../models/index.js'
import { logger } from '../../utils/logger.utils.js'

async function registerPlot (userId, plot) {
  try {
    logger.plots.info('Controlador - Registrando parcela', { userId })
    const data = await Plot.createPlot(userId, plot)
    logger.plots.info('Controlador - Parcela registrada exitosamente', { userId, plotName: plot.plot_name })
    return data
  } catch (error) {
    logger.plots.error('Controlador - Error registrando parcela', {
      userId,
      error: error.message
    })
    throw error
  }
}

async function getPlotByUserId (userId, plotId) {
  try {
    logger.plots.info('Controlador - Obteniendo parcela por ID de usuario y ID de parcela', { userId, plotId })
    const data = await Plot.getPlotbyUserId(userId, plotId)
    if (data) {
      logger.plots.info('Controlador - Parcela obtenida exitosamente', { userId, plotId })
    } else {
      logger.plots.warn('Controlador - Parcela no encontrada', { userId, plotId })
      throw new NotFoundError('Plot not found')
    }
    return data
  } catch (error) {
    logger.plots.error('Controlador - Error obteniendo parcela por ID de usuario y ID de parcela', {
      userId,
      plotId,
      error: error.message
    })
    throw error
  }
}

async function getUbicationCoords (userId) {
  try {
    logger.plots.info('Controlador - Obteniendo coordenadas de ubicación', { userId })
    const data = await Plot.getUbicationCoords(userId)
    logger.plots.info('Controlador - Coordenadas de ubicación obtenidas exitosamente', {
      userId,
      total: data.length
    })
    return data
  } catch (error) {
    logger.plots.error('Controlador - Error obteniendo coordenadas de ubicación', {
      userId,
      error: error.message
    })
    throw error
  }
}

async function getAllPlots () {
  try {
    logger.plots.info('Controlador - Obteniendo todas las parcelas')
    const data = await Plot.getAllPlots()
    logger.plots.info('Controlador - Todas las parcelas obtenidas exitosamente', {
      total: data.length
    })
    return data
  } catch (error) {
    logger.plots.error('Controlador - Error obteniendo todas las parcelas', {
      error: error.message
    })
    throw error
  }
}

async function updatePlotById (userId, plotId, plotData) {
  try {
    logger.plots.info('Controlador - Actualizando parcela por ID', { userId, plotId })
    const data = await Plot.updatePlotById(userId, plotId, plotData)
    logger.plots.info('Controlador - Parcela actualizada exitosamente', { userId, plotId })
    return data
  } catch (error) {
    logger.plots.error('Controlador - Error actualizando parcela por ID', {
      userId,
      plotId,
      error: error.message
    })
    throw error
  }
}

async function detelePlotById (userId, plotId) {
  try {
    logger.plots.info('Controlador - Eliminando parcela por ID', { userId, plotId })
    await Plot.detelePlotById(userId, plotId)
    logger.plots.info('Controlador - Parcela eliminada exitosamente', { userId, plotId })
  } catch (error) {
    logger.plots.error('Controlador - Error eliminando parcela por ID', {
      userId,
      plotId,
      error: error.message
    })
    throw error
  }
}

export {
  registerPlot,
  getUbicationCoords,
  getAllPlots,
  getPlotByUserId,
  updatePlotById,
  detelePlotById
}
