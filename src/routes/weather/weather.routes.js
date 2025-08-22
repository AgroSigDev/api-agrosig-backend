import express from 'express'
import { autenticate } from '../../middlewares/index.js'
import { updateWeatherData, fetchWeeklyWeather } from '../../controllers/index.js'

const router = express.Router()

// GET /get-weather/:plotId
router.get('/get-weather/:plotId', autenticate, async (request, response, next) => {
  try {
    const userId = request.user.user_id
    const plotId = request.params.plotId

    const result = await updateWeatherData(userId, plotId)
    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error fetching weather data:', error)
    response.status(500).json({
      success: false,
      message: 'Error fetching weather data',
      error: error.message
    })
  }
})

// GET /get-weekly/:plotId
router.get('/get-weekly/:plotId', autenticate, async (request, response, next) => {
  try {
    const userId = request.user.user_id
    const plotId = request.params.plotId

    const result = await fetchWeeklyWeather(userId, plotId)
    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error fetching weekly weather:', error)
    response.status(500).json({
      success: false,
      message: 'Error fetching weekly weather',
      error: error.message
    })
  }
})

export default router
