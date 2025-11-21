import express from 'express'
import { registerPlot, getUbicationCoords, getPlotByUserId, updatePlotById, detelePlotById } from '../../controllers/index.js'
import { autenticate } from '../../middlewares/index.js'
import { logger } from '../../utils/logger.utils.js'

const router = express.Router()

// POST /plots/register
router.post('/register', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id
    const plot = request.body

    logger.api.info('Solicitud de registro de parcela', {
      userId,
      plotName: plot.plot_name,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const result = await registerPlot(userId, plot)
    const responseTime = Date.now() - startTime

    logger.api.info('Parcela registrada exitosamente', {
      userId,
      plotId: result?.plot_id,
      responseTime: `${responseTime}ms`
    })

    response.status(201).json({
      success: true,
      message: 'Plot created successfully',
      data: result
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de registro de parcela', {
      userId: request.user?.user_id,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// GET /plots/ubication-plot/:id
router.get('/ubication-plot/', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id

    logger.api.info('Solicitud de obtención de coordenadas de parcela', {
      userId,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const result = await getUbicationCoords(userId)
    const responseTime = Date.now() - startTime

    logger.api.info('Coordenadas de parcela obtenidas exitosamente', {
      userId,
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de obtención de coordenadas de parcela', {
      userId: request.params?.id,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// GET /plots/get-plot/:plotId
router.get('/get-plot/:plotId', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id
    const plotId = request.params.plotId

    logger.api.info('Solicitud de obtención de parcela', {
      userId,
      plotId,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const result = await getPlotByUserId(userId, plotId)
    const responseTime = Date.now() - startTime

    if (result) {
      logger.api.info('Parcela obtenida exitosamente', {
        userId,
        plotId,
        responseTime: `${responseTime}ms`
      })
    } else {
      logger.api.warn('Parcela no encontrada', {
        userId,
        plotId,
        responseTime: `${responseTime}ms`
      })
    }

    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de obtención de parcela', {
      userId: request.user?.user_id,
      plotId: request.params?.plotId,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// PATCH /plots/update-plot/:plotId
router.patch('/update-plot/:plotId', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id
    const plotId = request.params.plotId
    const plotData = request.body

    logger.api.info('Solicitud de actualización de parcela', {
      userId,
      plotId,
      camposActualizados: Object.keys(plotData),
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const result = await updatePlotById(userId, plotId, plotData)
    const responseTime = Date.now() - startTime

    logger.api.info('Parcela actualizada exitosamente', {
      userId,
      plotId,
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de actualización de parcela', {
      userId: request.user?.user_id,
      plotId: request.params?.plotId,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// DELETE /plots/delete/:plotId
router.delete('/delete/:plotId', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id
    const plotId = request.params.plotId

    logger.api.info('Solicitud de eliminación de parcela', {
      userId,
      plotId,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    await detelePlotById(userId, plotId)
    const responseTime = Date.now() - startTime

    logger.api.info('Parcela eliminada exitosamente', {
      userId,
      plotId,
      responseTime: `${responseTime}ms`
    })

    response.status(204).json({
      success: true,
      message: 'Plot Delete Succefully'
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de eliminación de parcela', {
      userId: request.user?.user_id,
      plotId: request.params?.plotId,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

export default router
