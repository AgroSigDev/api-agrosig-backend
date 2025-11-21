import express from 'express'
import { autenticate } from '../../middlewares/index.js'
import { updateWeatherData, fetchWeeklyWeather } from '../../controllers/index.js'
import { logger } from '../../utils/logger.utils.js'

const router = express.Router()

// GET /weather/get-weather/:plotId
router.get('/get-weather/:plotId', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id
    const plotId = request.params.plotId

    logger.api.info('Solicitud de obtención de datos del clima', {
      userId,
      plotId,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const result = await updateWeatherData(userId, plotId)
    const responseTime = Date.now() - startTime

    logger.api.info('Datos del clima obtenidos exitosamente', {
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
    logger.api.error('Error en endpoint de obtención de datos del clima', {
      userId: request.user?.user_id,
      plotId: request.params?.plotId,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// GET /weather/get-weekly/:plotId
router.get('/get-weekly/:plotId', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id
    const plotId = request.params.plotId

    logger.api.info('Solicitud de obtención de pronóstico semanal', {
      userId,
      plotId,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const result = await fetchWeeklyWeather(userId, plotId)
    const responseTime = Date.now() - startTime

    logger.api.info('Pronóstico semanal obtenido exitosamente', {
      userId,
      plotId,
      totalDias: result.length,
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de obtención de pronóstico semanal', {
      userId: request.user?.user_id,
      plotId: request.params?.plotId,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

export default router
