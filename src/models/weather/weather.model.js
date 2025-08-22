import { pool } from '../../lib/db.js'
import { config } from '../../../config.js'
import axios from 'axios'

async function findUbication (userId, plotId) {
  try {
    const query = {
      text: 'SELECT plot_id, location, ST_X(geom) as latitude, ST_Y(geom) as longitude FROM plots WHERE user_id = $1 AND plot_id = $2',
      values: [userId, plotId]
    }
    const result = await pool.query(query)
    return result.rows[0]
  } catch (error) {
    console.error('Error find plot', error)
    throw error
  }
}

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
