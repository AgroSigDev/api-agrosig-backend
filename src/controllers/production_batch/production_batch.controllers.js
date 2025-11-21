import { NotFoundError } from '../../lib/api.errors.js'
import { productionBatch } from '../../models/index.js'
import { logger } from '../../utils/logger.utils.js'

async function createProductionBatch (userId, cropId, batchData) {
  try {
    logger.production.info('Controlador - Creando lote de producción', { userId, cropId })
    const data = await productionBatch.createProductionBatch(userId, cropId, batchData)
    logger.production.info('Controlador - Lote de producción creado exitosamente', { userId, cropId, productionId: data.production_id })
    return data
  } catch (error) {
    logger.production.error('Controlador - Error creando lote de producción', {
      userId,
      cropId,
      error: error.message
    })
    throw error
  }
}

async function getProductionBatches (userId, page = 1, limit = 10) {
  try {
    logger.production.info('Controlador - Obteniendo lotes de producción', { userId, page, limit })
    const batches = await productionBatch.getProducctionBatchesByUser(userId, page, limit)
    const totalBatches = await productionBatch.getTotalProducctionBatchesByUserId(userId)

    const result = {
      batches: batches.map(batch => ({
        production_id: batch.production_id,
        name: batch.name,
        unique_code: batch.unique_code,
        creation_date: batch.creation_date,
        created_at: batch.created_at,
        crop_type: batch.crop_type,
        crop_variety: batch.crop_variety,
        qr_code: batch.qr_code,
        generation_date: batch.generation_date,
        activity_count: parseInt(batch.activity_count || 0),
        has_activities: parseInt(batch.activity_count || 0) > 0
      })),
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: totalBatches,
        total_pages: Math.ceil(totalBatches / limit),
        has_next: page < Math.ceil(totalBatches / limit),
        has_prev: page > 1
      }
    }

    logger.production.info('Controlador - Lotes de producción obtenidos exitosamente', {
      userId,
      total: batches.length,
      totalPages: result.pagination.total_pages
    })

    return result
  } catch (error) {
    logger.production.error('Controlador - Error obteniendo lotes de producción', {
      userId,
      page,
      limit,
      error: error.message
    })
    throw error
  }
}

async function getProductionDetail (userId, productionId) {
  try {
    logger.production.info('Controlador - Obteniendo detalle del lote de producción', { userId, productionId })
    const batchDetail = await productionBatch.getProductionBatchDetail(userId, productionId)
    if (batchDetail) {
      logger.production.info('Controlador - Detalle del lote de producción obtenido exitosamente', { userId, productionId })
    } else {
      logger.production.warn('Controlador - Detalle del lote de producción no encontrado', { userId, productionId })
      throw new NotFoundError('Lote de producción no encontrado')
    }
    return batchDetail
  } catch (error) {
    logger.production.error('Controlador - Error obteniendo detalle del lote de producción', {
      userId,
      productionId,
      error: error.message
    })
    throw error
  }
}

async function associateActivities (userId, productionId, activityIds) {
  try {
    logger.production.info('Controlador - Asociando actividades al lote', { userId, productionId, activityIds })
    const data = await productionBatch.associateActivitiesToBatch(userId, productionId, activityIds)
    logger.production.info('Controlador - Actividades asociadas exitosamente', { userId, productionId, associatedCount: activityIds.length })
    return data
  } catch (error) {
    logger.production.error('Controlador - Error asociando actividades al lote', {
      userId,
      productionId,
      activityIds,
      error: error.message
    })
    throw error
  }
}

async function getAvaliableActivities (userId, productionId) {
  try {
    logger.production.info('Controlador - Obteniendo actividades disponibles para el lote', { userId, productionId })
    const data = await productionBatch.getAvaliableActivitiesForBatch(userId, productionId)
    logger.production.info('Controlador - Actividades disponibles obtenidas exitosamente', { userId, productionId, total: data.length })
    return data
  } catch (error) {
    logger.production.error('Controlador - Error obteniendo actividades disponibles para el lote', {
      userId,
      productionId,
      error: error.message
    })
    throw error
  }
}

async function getBatchActivities (userId, productionId) {
  try {
    logger.production.info('Controlador - Obteniendo actividades del lote', { userId, productionId })
    const data = await productionBatch.getBatchActivities(userId, productionId)
    logger.production.info('Controlador - Actividades del lote obtenidas exitosamente', { userId, productionId, total: data.length })
    return data
  } catch (error) {
    logger.production.error('Controlador - Error obteniendo actividades del lote', {
      userId,
      productionId,
      error: error.message
    })
    throw error
  }
}

async function generateQRCode (userId, productionId) {
  try {
    logger.production.info('Controlador - Generando código QR para el lote', { userId, productionId })
    const data = await productionBatch.updateBatchQRCode(productionId)
    logger.production.info('Controlador - Código QR generado exitosamente', { userId, productionId })
    return data
  } catch (error) {
    logger.production.error('Controlador - Error generando código QR para el lote', {
      userId,
      productionId,
      error: error.message
    })
    throw error
  }
}

async function getTraceabilityByCode (uniqueCode) {
  try {
    logger.production.info('Controlador - Obteniendo trazabilidad por código', { uniqueCode })
    const data = await productionBatch.getTraceabilityByUniqueCode(uniqueCode)
    logger.production.info('Controlador - Trazabilidad obtenida exitosamente', { uniqueCode, hasActivities: data.summary.has_activities })
    return data
  } catch (error) {
    logger.production.error('Controlador - Error obteniendo trazabilidad por código', {
      uniqueCode,
      error: error.message
    })
    throw error
  }
}

export {
  createProductionBatch,
  getProductionBatches,
  getProductionDetail,
  associateActivities,
  getAvaliableActivities,
  getBatchActivities,
  generateQRCode,
  getTraceabilityByCode
}
