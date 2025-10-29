import express from 'express'
import { createProductionBatch, getProductionBatches, getProductionDetail, associateActivities, getAvaliableActivities, getBatchActivities, generateQRCode, getTraceabilityByCode } from '../../controllers/index.js'
import { autenticate } from '../../middlewares/index.js'

const router = express.Router()

// POST /production
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

// GET /productions
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

// GET /production/:id
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

// POST /production/associate-activities
router.post('/associate-activities/:productionId', autenticate, async (request, response, next) => {
  try {
    const userId = request.user.user_id
    const productionId = request.params.productionId
    const activityIds = request.body.activityIds || request.body.activity_ids

    const result = await associateActivities(userId, productionId, activityIds)
    response.status(200).json({
      success: true,
      message: 'Activities associated successfully',
      data: result
    })
  } catch (error) {
    console.log('Error associating activities: ', error)
    response.status(500).json({
      success: false,
      message: 'Error associating activities',
      error: error.message
    })
  }
})

// GET /production/available-activities/:productionId
router.get('/available-activities/:productionId', autenticate, async (request, response, next) => {
  try {
    const userId = request.user.user_id
    const productionId = request.params.productionId

    const result = await getAvaliableActivities(userId, productionId)
    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    console.log('Error getting available activities: ', error)
    response.status(500).json({
      success: false,
      message: 'Error getting available activities',
      error: error.message
    })
  }
})

// GET /production/activities/:productionId
router.get('/activities/:productionId', autenticate, async (request, response, next) => {
  try {
    const userId = request.user.user_id
    const productionId = request.params.productionId

    const result = await getBatchActivities(userId, productionId)
    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    console.log('Error getting batch activities: ', error)
    response.status(500).json({
      success: false,
      message: 'Error getting batch activities',
      error: error.message
    })
  }
})

// GET /production/traceability/:uniqueCode
router.get('/traceability/:uniqueCode', async (request, response, next) => {
  try {
    const uniqueCode = request.params.uniqueCode
    const result = await getTraceabilityByCode(uniqueCode)
    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    console.log('Error getting traceability by code: ', error)
    response.status(500).json({
      success: false,
      message: 'Error getting traceability by code',
      error: error.message
    })
  }
})

// POST /production/generate-qr/:productionId
router.post('/generate-qr/:productionId', autenticate, async (request, response, next) => {
  try {
    const userId = request.user.user_id
    const productionId = request.params.productionId

    const result = await generateQRCode(userId, productionId)
    response.status(200).json({
      success: true,
      message: 'QR code generated successfully',
      data: result
    })
  } catch (error) {
    console.log('Error generating QR code: ', error)
    response.status(500).json({
      success: false,
      message: 'Error generating QR code',
      error: error.message
    })
  }
})

export default router
