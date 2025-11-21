import { Crop } from '../../models/index.js'
import { logger } from '../../utils/logger.utils.js'

async function registerCrop (userId, cropData) {
  try {
    logger.crops.info('Controlador - Registrando cultivo', { userId })
    const plotId = cropData.plot_id || null

    const data = await Crop.createCrop(userId, plotId, cropData)
    logger.crops.info('Controlador - Cultivo registrado exitosamente', { userId, cropId: data.crop_id })
    return data
  } catch (error) {
    logger.crops.error('Controlador - Error registrando cultivo', {
      userId,
      error: error.message
    })
    throw error
  }
}

async function getUserCrops (userId, page = 1, limit = 10) {
  try {
    logger.crops.info('Controlador - Obteniendo cultivos de usuario', { userId, page, limit })
    const crops = await Crop.getCropsByUserId(userId, page, limit)
    const totalCrops = await Crop.getTotalCropsByUserId(userId)

    const result = {
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

    logger.crops.info('Controlador - Cultivos de usuario obtenidos exitosamente', {
      userId,
      total: crops.length,
      totalPages: result.pagination.total_pages
    })

    return result
  } catch (error) {
    logger.crops.error('Controlador - Error obteniendo cultivos de usuario', {
      userId,
      page,
      limit,
      error: error.message
    })
    throw error
  }
}

async function getCropByUserId (userId, cropId) {
  try {
    logger.crops.info('Controlador - Obteniendo cultivo por ID de usuario y ID de cultivo', { userId, cropId })
    const crop = await Crop.getCropByIdAndUserId(cropId, userId)
    if (crop) {
      logger.crops.info('Controlador - Cultivo obtenido exitosamente', { userId, cropId })
    } else {
      logger.crops.warn('Controlador - Cultivo no encontrado', { userId, cropId })
    }
    return crop
  } catch (error) {
    logger.crops.error('Controlador - Error obteniendo cultivo por ID de usuario y ID de cultivo', {
      userId,
      cropId,
      error: error.message
    })
    throw error
  }
}

async function updateCropByUserId (userId, cropId, cropData) {
  try {
    logger.crops.info('Controlador - Actualizando cultivo por ID', { userId, cropId })
    const result = await Crop.updateCropByUserId(userId, cropId, cropData)
    logger.crops.info('Controlador - Cultivo actualizado exitosamente', { userId, cropId })
    return result
  } catch (error) {
    logger.crops.error('Controlador - Error actualizando cultivo por ID', {
      userId,
      cropId,
      error: error.message
    })
    throw error
  }
}

async function deleteCropById (userId, cropId) {
  try {
    logger.crops.info('Controlador - Eliminando cultivo por ID', { userId, cropId })
    await Crop.deleteCropByUserId(userId, cropId)
    logger.crops.info('Controlador - Cultivo eliminado exitosamente', { userId, cropId })
  } catch (error) {
    logger.crops.error('Controlador - Error eliminando cultivo por ID', {
      userId,
      cropId,
      error: error.message
    })
    throw error
  }
}

export {
  registerCrop,
  getUserCrops,
  getCropByUserId,
  updateCropByUserId,
  deleteCropById
}
