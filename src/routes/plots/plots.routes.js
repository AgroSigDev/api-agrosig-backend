import express from 'express'
import { registerPlot, getUbicationCoords, updatePlotById, deleteUserById } from '../../controllers/index.js'
import { autenticate } from '../../middlewares/index.js'

const router = express.Router()

// GET /plots
router.get('/ubication-plot/:id', autenticate, async (request, response, next) => {
  try {
    const userId = request.params.id
    const result = await getUbicationCoords(userId)
    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error fetching plot coordinates:', error)
    response.status(500).json({
      success: false,
      message: 'Error fetching plot coordinates',
      error: error.message
    })
  }
})

// POST /plots
router.post('/register', autenticate, async (request, response, next) => {
  try {
    const userId = request.user.user_id
    const plot = request.body
    const result = await registerPlot(userId, plot)
    response.status(201).json({
      success: true,
      message: 'Plot created successfully',
      data: result
    })
  } catch (error) {
    console.error('Error creating plot:', error)
    response.status(500).json({
      success: false,
      message: 'Error creating plot',
      error: error.message
    })
  }
})

// PATCH /plots/:plotId
router.patch('/:plotId', autenticate, async (request, response, next) => {
  try {
    const userId = request.user.user_id
    const plotId = request.params.plotId
    const plotData = request.body
    const result = await updatePlotById(userId, plotId, plotData)
    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error updating plot:', error)
    response.status(500).json({
      success: false,
      message: 'Error updating plot',
      error: error.message
    })
  }
})

// DELETE /plots/:plotId
router.delete('/:plotId', autenticate, async (request, response, next) => {
  try {
    const userId = request.user.user_id
    const plotId = request.params.plotId
    await deleteUserById(userId, plotId)
    response.status(204).json({
      success: true,
      message: 'Plot Delete Succefully'
    })
  } catch (error) {
    next(error)
  }
})
export default router
