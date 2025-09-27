import express from 'express'
import { createProductionBatch } from '../../controllers/index.js'
import { autenticate } from '../../middlewares/index.js'

const router = express.Router()

// POST /production-batch
router.post('/register/:cropId', autenticate, async (request, response, next) => {
  try {
    const userId = request.user.user_id
    const cropId = request.params.cropId
    const batchData = request.body

    const result = await createProductionBatch(userId, cropId, batchData)
    response.status(201).json({
      success: true,
      message: 'Production batch created successfully',
      data: result
    })
  } catch (error) {
    console.log('Error creating production batch: ', error)
    response.status(500).json({
      success: false,
      message: 'Error creating production batch',
      error: error.message
    })
  }
})

export default router
