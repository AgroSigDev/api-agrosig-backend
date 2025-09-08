import express from 'express'
import { registerActivity } from '../../controllers/index.js'
import { autenticate } from '../../middlewares/index.js'

const router = express.Router()

// POST /crop
router.post('/register/:cropId', autenticate, async (request, response, next) => {
  try {
    const userId = request.user.user_id
    const { cropId } = request.params
    const { activityType, date, description, inputs } = request.body

    const activityData = {
      activity_type: activityType,
      date,
      description
    }

    // Mapear inputs - Sin ternaria problemática
    let mappedInputs = []
    if (inputs) {
      mappedInputs = inputs.map(input => {
        return {
          input_name: input.input_name,
          unit: input.unit,
          quantity: input.quantity,
          unit_cost: input.unit_cost
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
