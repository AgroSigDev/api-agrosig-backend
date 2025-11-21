import express from 'express'
import { registerCrop, getUserCrops, getCropByUserId, updateCropByUserId, deleteCropById } from '../../controllers/index.js'
import { autenticate } from '../../middlewares/index.js'
import { logger } from '../../utils/logger.utils.js'

const router = express.Router()

// POST /crop/register
router.post('/register', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id
    const cropData = request.body

    logger.api.info('Solicitud de registro de cultivo', {
      userId,
      cropType: cropData.crop_type,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const result = await registerCrop(userId, cropData)
    const responseTime = Date.now() - startTime

    logger.api.info('Cultivo registrado exitosamente', {
      userId,
      cropId: result.crop_id,
      responseTime: `${responseTime}ms`
    })

    response.status(201).json({
      success: true,
      message: 'Crop created successfully',
      data: result
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de registro de cultivo', {
      userId: request.user?.user_id,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// GET /crops/crops
router.get('/crops', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id
    const page = parseInt(request.query.page) || 1
    const limit = parseInt(request.query.limit) || 10

    logger.api.info('Solicitud de obtención de cultivos', {
      userId,
      page,
      limit,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const result = await getUserCrops(userId, page, limit)
    const responseTime = Date.now() - startTime

    logger.api.info('Cultivos obtenidos exitosamente', {
      userId,
      total: result.crops.length,
      totalPages: result.pagination.total_pages,
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de obtención de cultivos', {
      userId: request.user?.user_id,
      page: request.query?.page,
      limit: request.query?.limit,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// GET /crops/crop/:id
router.get('/crop/:id', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id
    const cropId = request.params.id

    logger.api.info('Solicitud de obtención de cultivo por ID', {
      userId,
      cropId,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const result = await getCropByUserId(userId, cropId)
    const responseTime = Date.now() - startTime

    if (result) {
      logger.api.info('Cultivo obtenido exitosamente', {
        userId,
        cropId,
        responseTime: `${responseTime}ms`
      })
    } else {
      logger.api.warn('Cultivo no encontrado', {
        userId,
        cropId,
        responseTime: `${responseTime}ms`
      })
    }

    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de obtención de cultivo por ID', {
      userId: request.user?.user_id,
      cropId: request.params?.id,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// PATCH /crops/update/:cropId
router.patch('/update/:cropId', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id
    const cropId = request.params.cropId
    const cropData = request.body

    logger.api.info('Solicitud de actualización de cultivo', {
      userId,
      cropId,
      camposActualizados: Object.keys(cropData),
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const result = await updateCropByUserId(userId, cropId, cropData)
    const responseTime = Date.now() - startTime

    logger.api.info('Cultivo actualizado exitosamente', {
      userId,
      cropId,
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      message: 'Crop updated successfully',
      data: result
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de actualización de cultivo', {
      userId: request.user?.user_id,
      cropId: request.params?.cropId,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// DELETE /crops/delete/:cropId
router.delete('/delete/:cropId', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id
    const cropId = request.params.cropId

    logger.api.info('Solicitud de eliminación de cultivo', {
      userId,
      cropId,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    await deleteCropById(userId, cropId)
    const responseTime = Date.now() - startTime

    logger.api.info('Cultivo eliminado exitosamente', {
      userId,
      cropId,
      responseTime: `${responseTime}ms`
    })

    response.status(204).json({
      success: true,
      message: 'Crop Delete Succefully'
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de eliminación de cultivo', {
      userId: request.user?.user_id,
      cropId: request.params?.cropId,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

export default router
