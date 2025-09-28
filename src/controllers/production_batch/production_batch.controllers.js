import { productionBatch } from '../../models/index.js'

async function createProductionBatch (userId, cropId, batchData) {
  const data = await productionBatch.createProductionBatch(userId, cropId, batchData)
  return data
}

async function getProductionBatches (userId, page = 1, limit = 10) {
  const batches = await productionBatch.getProducctionBatchesByUser(userId, page, limit)

  const totalBatches = await productionBatch.getTotalProducctionBatchesByUserId(userId)
  return {
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
}

async function getProductionDetail (userId, productionId) {
  const batchDetail = await productionBatch.getProductionBatchDetail(userId, productionId)
  return batchDetail
}

async function associateActivities (userId, productionId, activityIds) {
  const data = await productionBatch.associateActivitiesToBatch(userId, productionId, activityIds)
  return data
}

async function getAvaliableActivities (userId, productionId) {
  const data = await productionBatch.getAvaliableActivitiesForBatch(userId, productionId)
  return data
}

async function getBatchActivities (userId, productionId) {
  const data = await productionBatch.getBatchActivities(userId, productionId)
  return data
}

export {
  createProductionBatch,
  getProductionBatches,
  getProductionDetail,
  associateActivities,
  getAvaliableActivities,
  getBatchActivities
}
