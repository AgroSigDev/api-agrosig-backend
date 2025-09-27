import { productionBatch } from '../../models/index.js'

async function createProductionBatch (userId, cropId, batchData) {
  const data = await productionBatch.createProductionBatch(userId, cropId, batchData)
  return data
}

export {
  createProductionBatch
}
