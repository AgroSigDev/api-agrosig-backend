import { pool } from '../../lib/db.js'
import { config } from '../../../config.js'
import axios from 'axios'

/**
 * Retrieves the location and coordinates of a specific plot for a given user.
 *
 * @async
 * @function findUbication
 * @param {number|string} userId - The ID of the user.
 * @param {number|string} plotId - The ID of the plot.
 * @returns {Promise<Object>} Resolves with an object containing plot_id, location, latitude, and longitude.
 * @throws Will throw an error if the database query fails.
 */

async function findUbication (userId, plotId) {
  try {
    const query = {
      text: 'SELECT plot_id, location, ST_X(geom) as longitude, ST_Y(geom) as latitude FROM plots WHERE user_id = $1 AND plot_id = $2 AND is_active = true',
      values: [userId, plotId]
    }
    const result = await pool.query(query)
    return result.rows[0]
  } catch (error) {
    console.error('Error find plot', error)
    throw error
  }
}

/**
 * Fetches current weather data for a given latitude and longitude using the OpenWeatherMap API.
 *
 * @async
 * @function getWeatherData
 * @param {number} latitude - The latitude of the location.
 * @param {number} longitude - The longitude of the location.
 * @returns {Promise<Object>} An object containing weather information:
 * @returns {number} temperature - Current temperature in Celsius.
 * @returns {number} humidity - Current humidity percentage.
 * @returns {string} description - Weather description in Spanish.
 * @returns {number} precipitation - Precipitation in mm for the last hour (if available).
 * @returns {number} wind_speed - Wind speed in m/s.
 * @returns {number} atmosphere_pressure - Atmospheric pressure in hPa.
 * @returns {number} wind_direction - Wind direction in degrees.
 * @returns {number} min_temp - Minimum temperature in Celsius.
 * @returns {number} max_temp - Maximum temperature in Celsius.
 * @returns {string} city_name - Name of the city.
 * @throws Will throw an error if the weather data cannot be fetched.
 */

async function getWeatherData (latitude, longitude) {
  try {
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${config.weather.appid}&units=metric&lang=es`)

    return {
      temperature: response.data.main.temp,
      humidity: response.data.main.humidity,
      description: response.data.weather[0].description,
      precipitation: response.data.rain ? response.data.rain['1h'] || 0 : 0,
      wind_speed: response.data.wind.speed,
      atmosphere_pressure: response.data.main.pressure,
      wind_direction: response.data.wind.deg,
      min_temp: response.data.main.temp_min,
      max_temp: response.data.main.temp_max,
      city_name: response.data.name
    }
  } catch (error) {
    console.error('Error fetching weather data:', error)
    throw error
  }
}

/**
 * Saves or updates weather data for a specific plot and user.
 * Performs an UPSERT operation on the plot_climate table based on plot_id and date.
 *
 * @async
 * @param {number|string} userId - The ID of the user associated with the plot.
 * @param {number|string} plotId - The ID of the plot for which weather data is saved.
 * @param {Object} weatherData - The weather data to save or update.
 * @param {number} weatherData.temperature - Temperature value.
 * @param {number} weatherData.humidity - Humidity value.
 * @param {string} weatherData.description - Weather description.
 * @param {number} weatherData.precipitation - Precipitation amount.
 * @param {number} weatherData.wind_speed - Wind speed.
 * @param {number} weatherData.atmosphere_pressure - Atmospheric pressure.
 * @param {string} weatherData.wind_direction - Wind direction.
 * @param {number} weatherData.min_temp - Minimum temperature.
 * @param {number} weatherData.max_temp - Maximum temperature.
 * @param {string} weatherData.city_name - City name.
 * @returns {Promise<Object>} An object indicating success and the climate record ID.
 * @throws {Error} Throws an error if the database operation fails.
 */

async function saveOrUpdateWeatherData (userId, plotId, weatherData) {
  try {
    // 1. Obtener la fecha actual YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0]

    // 2. UPSERT
    const query = {
      text: `
        INSERT INTO plot_climate
          (plot_id, temperature, humidity, description, precipitation, wind_speed,
           atmospheric_pressure, wind_direction, min_temp, max_temp, city_name, date, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
        ON CONFLICT (plot_id, date)
        DO UPDATE SET
          temperature = EXCLUDED.temperature,
          humidity = EXCLUDED.humidity,
          description = EXCLUDED.description,
          precipitation = EXCLUDED.precipitation,
          wind_speed = EXCLUDED.wind_speed,
          atmospheric_pressure = EXCLUDED.atmospheric_pressure,
          wind_direction = EXCLUDED.wind_direction,
          min_temp = EXCLUDED.min_temp,
          max_temp = EXCLUDED.max_temp,
          city_name = EXCLUDED.city_name,
          updated_at = NOW()
        RETURNING climate_id
      `,
      values: [
        plotId,
        weatherData.temperature,
        weatherData.humidity,
        weatherData.description,
        weatherData.precipitation,
        weatherData.wind_speed,
        weatherData.atmosphere_pressure,
        weatherData.wind_direction,
        weatherData.min_temp,
        weatherData.max_temp,
        weatherData.city_name,
        today
      ]
    }

    const result = await pool.query(query)
    return { success: true, climate_id: result.rows[0].climate_id }
  } catch (error) {
    console.error('Error saving or updating weather data:', error)
    throw error
  }
}

/**
 * Fetches weekly weather forecast for a given latitude and longitude using the OpenWeatherMap API.
 * Processes the forecast data to aggregate daily weather information for the next 7 days.
 *
 * @async
 * @param {number} latitude - The latitude of the location.
 * @param {number} longitude - The longitude of the location.
 * @returns {Promise<Array<Object>>} An array of daily weather forecast objects for the next 7 days.
 * Each object contains date_at, temperature, humidity, description, precipitation, wind_speed, min_temperature, max_temperature.
 * @throws {Error} Throws an error if the weather data cannot be fetched.
 */

async function fetchWeeklyWeather (latitude, longitude) {
  try {
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${config.weather.appid}&units=metric&lang=es`)

    const dailyForecast = {}

    response.data.list.forEach(item => {
      const date = new Date(item.dt * 1000)
      const dateString = date.toISOString().split('T')[0] // Formato YYYY-MM-DD

      if (!dailyForecast[dateString]) {
        dailyForecast[dateString] = {
          date_at: date,
          temperature: item.main.temp,
          humidity: item.main.humidity,
          description: item.weather[0].description,
          precipitation: item.rain ? item.rain['3h'] || 0 : 0,
          wind_speed: item.wind.speed,
          min_temperature: item.main.temp_min,
          max_temperature: item.main.temp_max
        }
      } else {
        dailyForecast[dateString].min_temperature = Math.min(dailyForecast[dateString].min_temperature, item.main.temp_min)
        dailyForecast[dateString].max_temperature = Math.max(dailyForecast[dateString].max_temperature, item.main.temp_max)
      }
    })

    return Object.values(dailyForecast).slice(0, 7) // Retornar los próximos 7 días
  } catch (error) {
    console.error('Error fetching weekly weather:', error)
    throw error
  }
}

export const Weather = {
  findUbication,
  getWeatherData,
  fetchWeeklyWeather,
  saveOrUpdateWeatherData
}
