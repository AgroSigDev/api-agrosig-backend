import express from 'express'
import { createProductionBatch, getProductionBatches, getProductionDetail, associateActivities, getAvaliableActivities, getBatchActivities, generateQRCode, getTraceabilityByCode } from '../../controllers/index.js'
import { autenticate } from '../../middlewares/index.js'
import { logger } from '../../utils/logger.utils.js'

const router = express.Router()

// POST /production/register/:cropId
router.post('/register/:cropId', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id
    const cropId = request.params.cropId
    const batchData = request.body

    logger.api.info('Solicitud de creación de lote de producción', {
      userId,
      cropId,
      batchName: batchData.name,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const result = await createProductionBatch(userId, cropId, batchData)
    const responseTime = Date.now() - startTime

    logger.api.info('Lote de producción creado exitosamente', {
      userId,
      cropId,
      productionId: result.production_id,
      responseTime: `${responseTime}ms`
    })

    response.status(201).json({
      success: true,
      message: 'Production batch created successfully',
      data: result
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de creación de lote de producción', {
      userId: request.user?.user_id,
      cropId: request.params?.cropId,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// GET /production/productions
router.get('/productions', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id
    const page = parseInt(request.query.page) || 1
    const limit = parseInt(request.query.limit) || 10

    logger.api.info('Solicitud de obtención de lotes de producción', {
      userId,
      page,
      limit,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const result = await getProductionBatches(userId, page, limit)
    const responseTime = Date.now() - startTime

    logger.api.info('Lotes de producción obtenidos exitosamente', {
      userId,
      total: result.batches.length,
      totalPages: result.pagination.total_pages,
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de obtención de lotes de producción', {
      userId: request.user?.user_id,
      page: request.query?.page,
      limit: request.query?.limit,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// GET /production/production/:id
router.get('/production/:id', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id
    const productionId = request.params.id

    logger.api.info('Solicitud de obtención de detalle de lote de producción', {
      userId,
      productionId,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const result = await getProductionDetail(userId, productionId)
    const responseTime = Date.now() - startTime

    if (result) {
      logger.api.info('Detalle de lote de producción obtenido exitosamente', {
        userId,
        productionId,
        responseTime: `${responseTime}ms`
      })
    } else {
      logger.api.warn('Detalle de lote de producción no encontrado', {
        userId,
        productionId,
        responseTime: `${responseTime}ms`
      })
    }

    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de obtención de detalle de lote de producción', {
      userId: request.user?.user_id,
      productionId: request.params?.id,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// GET /production/available-activities/:productionId
router.get('/available-activities/:productionId', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id
    const productionId = request.params.productionId

    logger.api.info('Solicitud de obtención de actividades disponibles para lote', {
      userId,
      productionId,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const result = await getAvaliableActivities(userId, productionId)
    const responseTime = Date.now() - startTime

    logger.api.info('Actividades disponibles obtenidas exitosamente', {
      userId,
      productionId,
      total: result.length,
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de obtención de actividades disponibles para lote', {
      userId: request.user?.user_id,
      productionId: request.params?.productionId,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// POST /production/associate-activities/:productionId
router.post('/associate-activities/:productionId', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id
    const productionId = request.params.productionId
    const activityIds = request.body.activityIds || request.body.activity_ids

    logger.api.info('Solicitud de asociación de actividades a lote', {
      userId,
      productionId,
      activityIdsCount: activityIds?.length,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const result = await associateActivities(userId, productionId, activityIds)
    const responseTime = Date.now() - startTime

    logger.api.info('Actividades asociadas exitosamente', {
      userId,
      productionId,
      associatedCount: activityIds?.length,
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      message: 'Activities associated successfully',
      data: result
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de asociación de actividades a lote', {
      userId: request.user?.user_id,
      productionId: request.params?.productionId,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// GET /production/activities/:productionId
router.get('/activities/:productionId', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id
    const productionId = request.params.productionId

    logger.api.info('Solicitud de obtención de actividades del lote', {
      userId,
      productionId,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const result = await getBatchActivities(userId, productionId)
    const responseTime = Date.now() - startTime

    logger.api.info('Actividades del lote obtenidas exitosamente', {
      userId,
      productionId,
      total: result.length,
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de obtención de actividades del lote', {
      userId: request.user?.user_id,
      productionId: request.params?.productionId,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// GET /production/traceability/:uniqueCode
router.get('/traceability/:uniqueCode', async (request, response, next) => {
  const startTime = Date.now()

  try {
    const uniqueCode = request.params.uniqueCode

    logger.api.info('Solicitud de obtención de trazabilidad por código', {
      uniqueCode,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const result = await getTraceabilityByCode(uniqueCode)
    const responseTime = Date.now() - startTime

    logger.api.info('Trazabilidad obtenida exitosamente', {
      uniqueCode,
      hasActivities: result.summary.has_activities,
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de obtención de trazabilidad por código', {
      uniqueCode: request.params?.uniqueCode,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// POST /production/generate-qr/:productionId
router.post('/generate-qr/:productionId', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id
    const productionId = request.params.productionId

    logger.api.info('Solicitud de generación de código QR para lote', {
      userId,
      productionId,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const result = await generateQRCode(userId, productionId)
    const responseTime = Date.now() - startTime

    logger.api.info('Código QR generado exitosamente', {
      userId,
      productionId,
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      message: 'QR code generated successfully',
      data: result
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de generación de código QR para lote', {
      userId: request.user?.user_id,
      productionId: request.params?.productionId,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

export default router
