import express from 'express'
import { createProductionBatch, getProductionBatches, getProductionDetail } from '../../controllers/index.js'
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

// GET /productions_batches
router.get('/productions', autenticate, async (request, response, next) => {
  try {
    const userId = request.user.user_id
    const page = parseInt(request.query.page) || 1
    const limit = parseInt(request.query.limit) || 10

    const result = await getProductionBatches(userId, page, limit)
    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    console.log('Error getting productions: ', error)
    response.status(500).json({
      success: false,
      message: 'Error creting crop',
      error: error.message
    })
  }
})

// GET /production_batches/:id
router.get('/production/:id', autenticate, async (request, response, next) => {
  try {
    const userId = request.user.user_id
    const productionId = request.params.id

    const result = await getProductionDetail(userId, productionId)

    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    console.log('Error getting production batch detail: ', error)
    response.status(500).json({
      success: false,
      message: 'Error getting production batch detail',
      error: error.message
    })
  }
})
export default router
