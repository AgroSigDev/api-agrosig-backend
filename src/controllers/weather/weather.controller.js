import { Weather } from '../../models/index.js'
import { config } from '../../../config.js'

async function updateWeatherData (userId, plotId) {
  // 1. Ubicación de la parcela
  const location = await Weather.findUbication(userId, plotId)
  if (!location) {
    throw new Error('Plot not found for this user')
  }

  // 2. Traer datos del clima desde OpenWeather
  const weatherData = await Weather.getWeatherData(location.latitude, location.longitude, config.weather.appid)

  // 3. Guardar o actualizar en BD
  const result = await Weather.saveOrUpdateWeatherData(userId, plotId, weatherData)
  return result
}

async function fetchWeeklyWeather (userId, plotId) {
  // 1. Ubicación de la parcela
  const location = await Weather.findUbication(userId, plotId)
  if (!location) {
    throw new Error('Plot not found for this user')
  }

  const weeklyWeather = await Weather.fetchWeeklyWeather(location.latitude, location.longitude)
  return weeklyWeather
}

export {
  updateWeatherData,
  fetchWeeklyWeather
}
