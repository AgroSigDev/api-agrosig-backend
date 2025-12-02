import { Weather } from '../../models/index.js'
import { config } from '../../../config.js'
import { logger } from '../../utils/logger.utils.js'
import { NotFoundError, InternalServerError } from '../../lib/api.errors.js'

async function updateWeatherData (userId, plotId) {
  try {
    logger.weather.info('Controlador - Actualizando datos del clima', { userId, plotId })

    // 1. Ubicación de la parcela
    const location = await Weather.findUbication(userId, plotId)
    if (!location) {
      logger.weather.warn('Controlador - Parcela no encontrada para el usuario', { userId, plotId })
      throw new NotFoundError('Parcela no encontrada para este usuario')
    }

    // 2. Traer datos del clima desde OpenWeather
    const weatherData = await Weather.getWeatherData(location.latitude, location.longitude, config.weather.appid)

    // 3. Guardar o actualizar en BD
    const result = await Weather.saveOrUpdateWeatherData(userId, plotId, weatherData)

    const responseData = {
      climate_id: result.climate_id,
      plot_id: plotId,
      ...weatherData,
      date: new Date().toISOString().split('T')[0] // Fecha actual
    }

    logger.weather.info('Controlador - Datos del clima actualizados exitosamente', { userId, plotId })

    return responseData
  } catch (error) {
    logger.weather.error('Controlador - Error actualizando datos del clima', {
      userId,
      plotId,
      error: error.message
    })

    if (error instanceof NotFoundError) {
      throw error
    }
    throw new InternalServerError('Error updating weather data', { original: error.message })
  }
}

async function fetchWeeklyWeather (userId, plotId) {
  try {
    logger.weather.info('Controlador - Obteniendo pronóstico semanal', { userId, plotId })

    // 1. Ubicación de la parcela
    const location = await Weather.findUbication(userId, plotId)
    if (!location) {
      logger.weather.warn('Controlador - Parcela no encontrada para el usuario', { userId, plotId })
      throw new NotFoundError('Parcela no encontrada para este usuario')
    }

    const weeklyWeather = await Weather.fetchWeeklyWeather(location.latitude, location.longitude)

    logger.weather.info('Controlador - Pronóstico semanal obtenido exitosamente', {
      userId,
      plotId,
      totalDias: weeklyWeather.length
    })

    return weeklyWeather
  } catch (error) {
    logger.weather.error('Controlador - Error obteniendo pronóstico semanal', {
      userId,
      plotId,
      error: error.message
    })

    if (error instanceof NotFoundError) {
      throw error
    }
    throw new InternalServerError('Error obteniendo pronóstico semanal del clima', { original: error.message })
  }
}

export {
  updateWeatherData,
  fetchWeeklyWeather
}
