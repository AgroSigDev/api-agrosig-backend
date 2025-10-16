import express from 'express'
import { registerActivity, getActivities, getActivity } from '../../controllers/index.js'
import { autenticate } from '../../middlewares/index.js'

const router = express.Router()

// GET /activities/crop/:cropId
router.get('/crop/:cropId', autenticate, async (request, response) => {
  try {
    const userId = request.user.user_id
    const { cropId } = request.params

    const activities = await getActivities(userId, cropId)

    response.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: activities
    })
  } catch (error) {
    console.log('Error getting activities: ', error)
    response.status(500).json({
      success: false,
      message: 'Error retrieving activities',
      error: error.message
    })
  }
})

// GET /activities/:activityId
router.get('/:activityId', autenticate, async (request, response) => {
  try {
    const userId = request.user.user_id
    const { activityId } = request.params

    const activities = await getActivity(userId, activityId)

    response.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: activities
    })
  } catch (error) {
    console.log('Error getting activities: ', error)
    response.status(500).json({
      success: false,
      message: 'Error retrieving activities',
      error: error.message
    })
  }
})

// POST /activity/register
router.post('/register/:cropId', autenticate, async (request, response, next) => {
  try {
    const userId = request.user.user_id
    const { cropId } = request.params
    const { activityType, date, description, inputs } = request.body

    const activityData = {
      activity_type: activityType,
      date: date || new Date(),
      description
    }

    // Mapear inputs - Sin ternaria problemática
    let mappedInputs = []
    if (inputs) {
      mappedInputs = inputs.map(input => {
        return {
          input_name: input.input_name?.trim(),
          unit: input.unit?.trim() || 'unit',
          quantity: parseFloat(input.quantity) || 0,
          unit_cost: parseFloat(input.unit_cost) || 0,
          cost_unit: input.cost_unit?.trim() || input.unit?.trim() || 'unit'
        }
      })
    }

    const result = await registerActivity(userId, cropId, activityData, mappedInputs)
    response.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: result
    })
  } catch (error) {
    console.log('Error creating activity: ', error)
    response.status(500).json({
      success: false,
      message: 'Error creting crop',
      error: error.message
    })
  }
})

export default router
