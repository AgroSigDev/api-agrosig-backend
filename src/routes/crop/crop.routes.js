import express from 'express'
import { registerCrop, getUserCrops, getCropByUserId, updateCropByUserId, deleteCropById } from '../../controllers/index.js'
import { autenticate } from '../../middlewares/index.js'

const router = express.Router()

// POST /crop
router.post('/register', autenticate, async (request, response, next) => {
  try {
    const userId = request.user.user_id
    const cropData = request.body
    const result = await registerCrop(userId, cropData)
    response.status(201).json({
      success: true,
      message: 'Crop created successfully',
      data: result
    })
  } catch (error) {
    console.log('Error creating crop: ', error)
    response.status(500).json({
      success: false,
      message: 'Error creting crop',
      error: error.message
    })
  }
})

// GET /crops
router.get('/crops', autenticate, async (request, response, next) => {
  try {
    const userId = request.user.user_id
    const page = parseInt(request.query.page) || 1
    const limit = parseInt(request.query.limit) || 10

    const result = await getUserCrops(userId, page, limit)
    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    console.log('Error getting crops: ', error)
    response.status(500).json({
      success: false,
      message: 'Error creting crop',
      error: error.message
    })
  }
})

// GET /crop/:id
router.get('/crop/:id', autenticate, async (request, response, next) => {
  try {
    const userId = request.user.user_id
    const cropId = request.params.id

    const result = await getCropByUserId(userId, cropId)
    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    console.log('Error getting crop: ', error)
    response.status(500).json({
      success: false,
      message: 'Error getting crop',
      error: error.message
    })
  }
})

// PATCH /crop/:id
router.patch('/update/:cropId', autenticate, async (request, response, next) => {
  try {
    const userId = request.user.user_id
    const cropId = request.params.cropId
    const cropData = request.body
    // cropData.crop_id = request.params.id

    const result = await updateCropByUserId(userId, cropId, cropData)
    response.status(200).json({
      success: true,
      message: 'Crop updated successfully',
      data: result
    })
  } catch (error) {
    console.log('Error updating crop: ', error)
    response.status(500).json({
      success: false,
      message: 'Error updating crop',
      error: error.message
    })
  }
})

// DELETE /crop/:cropId
router.delete('/delete/:cropId', autenticate, async (request, response, next) => {
  try {
    const userId = request.user.user_id
    const cropId = request.params.cropId

    await deleteCropById(userId, cropId)
    response.status(204).json({
      success: true,
      message: 'Crop Delete Succefully'
    })
  } catch (error) {
    console.log(error)
    next(error)
  }
})

export default router
