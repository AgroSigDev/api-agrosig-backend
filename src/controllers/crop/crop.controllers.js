import { Crop } from '../../models/index.js'

async function registerCrop (userId, cropData) {
  const plotId = cropData.plot_id || null

  const data = await Crop.createCrop(userId, plotId, cropData)
  return data
}

async function getUserCrops (userId, page = 1, limit = 10) {
  const crops = await Crop.getCropsByUserId(userId, page, limit)
  const totalCrops = await Crop.getTotalCropsByUserId(userId)
  return {
    crops,
    pagination: {
      current_page: parseInt(page),
      per_page: parseInt(limit),
      total: totalCrops,
      total_pages: Math.ceil(totalCrops / limit),
      has_next: page < Math.ceil(totalCrops / limit),
      has_prev: page > 1
    }
  }
}

async function getCropByUserId (userId, cropId) {
  const crop = await Crop.getCropByIdAndUserId(cropId, userId)
  return crop
}

async function updateCropByUserId (userId, cropId, cropData) {
  const result = await Crop.updateCropByUserId(userId, cropId, cropData)
  return result
}

async function deleteCropById (userId, cropId) {
  const result = await Crop.deleteCropByUserId(userId, cropId)
  return result
}

export {
  registerCrop,
  getUserCrops,
  getCropByUserId,
  updateCropByUserId,
  deleteCropById
}
