import { pool } from '../../lib/db.js'
import { validFieldsRegisterCrop } from '../../middlewares/index.js'
import {
  ValidationError,
  ConflictError,
  NotFoundError,
  InternalServerError
} from '../../lib/api.errors.js'
import { logger } from '../../utils/logger.utils.js'

/**
 * Creates a new crop record for a user and plot.
 *
 * Validates crop fields and ensures the plot belongs to the user. If no plotId is provided,
 * assigns the user's default active plot. Throws an error if validation fails.
 *
 * @async
 * @function
 * @param {number} userId - The ID of the user creating the crop.
 * @param {number|null} plotId - The ID of the plot to associate with the crop. If null, uses the user's default plot.
 * @param {Object} crop - The crop data to register.
 * @param {string} crop.crop_type - The type of the crop.
 * @param {string} crop.crop_variety - The variety of the crop.
 * @param {string|Date} crop.planting_date - The planting date of the crop.
 * @param {string|Date} crop.harvest_date - The expected harvest date of the crop.
 * @returns {Promise<Object>} The newly created crop record.
 * @throws {Error} If validation fails or the plot does not belong to the user.
 */

async function createCrop (userId, plotId, crop) {
  try {
    logger.crops.info('Creando nuevo cultivo', { userId, plotId, crop })

    await validFieldsRegisterCrop(crop)

    // Si no se proporciona plotId, obtener la parcela por defecto
    if (!plotId) {
      const defaultPlot = await getDefaultPlotByUserId(userId)
      if (!defaultPlot) {
        logger.crops.warn('El usuario no tiene una parcela activa', { userId })
        throw new NotFoundError('The user does not have an active plot')
      }
      plotId = defaultPlot.plot_id
    } else {
      // Validar que el plot_id proporcionado pertenezca al usuario
      const existingPlot = await validateUserPlot(userId, plotId)
      if (!existingPlot) {
        logger.crops.warn('La parcela no pertenece al usuario o no está activa', { userId, plotId })
        throw new ConflictError('The plot does not belong to the user or is not active')
      }
    }

    const registerQuery = {
      text: 'INSERT INTO crop (user_id, plot_id, crop_type, crop_variety, planting_date, harvest_date, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      values: [
        userId,
        plotId,
        crop.crop_type,
        crop.crop_variety,
        crop.planting_date,
        crop.harvest_date,
        true
      ]
    }

    const result = await pool.query(registerQuery)

    logger.crops.info('Cultivo creado exitosamente', {
      userId,
      cropId: result.rows[0].crop_id,
      cropType: crop.crop_type
    })

    return result.rows[0]
  } catch (error) {
    logger.crops.error('Error creando cultivo', {
      userId,
      plotId,
      error: error.message,
      cropData: crop
    })

    // Re-lanzar errores personalizados, envolver otros en InternalServerError
    if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof ConflictError) {
      throw error
    }
    throw new InternalServerError('Error creating crop', { original: error.message })
  }
}

/**
 * Updates a crop record for a specific user by crop ID.
 *
 * Validates the input crop data, ensures the crop exists and belongs to the user,
 * and checks that the specified plot (if provided) also belongs to the user.
 * Updates the crop record in the database and returns the updated crop.
 *
 * @async
 * @function
 * @param {number|string} userId - The ID of the user who owns the crop.
 * @param {number|string} cropId - The ID of the crop to update.
 * @param {Object} cropData - The data to update for the crop.
 * @param {string} [cropData.crop_type] - The type of the crop.
 * @param {string} [cropData.crop_variety] - The variety of the crop.
 * @param {string|Date} [cropData.planting_date] - The planting date of the crop.
 * @param {string|Date} [cropData.harvest_date] - The harvest date of the crop.
 * @param {number|string} [cropData.plot_id] - The ID of the plot associated with the crop.
 * @returns {Promise<Object>} The updated crop record.
 * @throws {Error} If validation fails, the crop does not exist, or does not belong to the user.
 */

async function updateCropByUserId (userId, cropId, cropData) {
  try {
    logger.crops.info('Actualizando cultivo por ID', { userId, cropId, cropData })

    await validFieldsRegisterCrop(cropData)

    // validate crop ownership and existence
    const existingCrop = await getCropByIdAndUserId(cropId, userId)
    if (!existingCrop) {
      logger.crops.warn('Cultivo no encontrado o no pertenece al usuario', { userId, cropId })
      throw new NotFoundError('Crop not found or does not belong to the user')
    }

    // Validate it belongs to the user
    if (cropData.plot_id) {
      const validPlot = await validateUserPlot(userId, cropData.plot_id)
      if (!validPlot) {
        logger.crops.warn('La parcela no pertenece al usuario', { userId, plotId: cropData.plot_id })
        throw new ConflictError('The plot does not belong to the user')
      }
    }

    const query = {
      text: 'UPDATE crop SET crop_type = $1, crop_variety = $2, planting_date = $3, harvest_date = $4, plot_id = COALESCE($5, plot_id), updated_at = CURRENT_TIMESTAMP WHERE crop_id = $6 AND user_id = $7 RETURNING  *',
      values: [
        cropData.crop_type,
        cropData.crop_variety,
        cropData.planting_date,
        cropData.harvest_date,
        cropData.plot_id || existingCrop.plot_id,
        cropId,
        userId
      ]
    }
    const result = await pool.query(query)

    logger.crops.info('Cultivo actualizado exitosamente', { userId, cropId })

    return result.rows[0]
  } catch (error) {
    logger.crops.error('Error actualizando cultivo', {
      userId,
      cropId,
      error: error.message
    })

    if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof ConflictError) {
      throw error
    }
    throw new InternalServerError('Error updating crop', { original: error.message })
  }
}

/**
 * Retrieves a crop record from the database by its ID.
 *
 * @async
 * @function getCropById
 * @param {number|string} cropId - The unique identifier of the crop to retrieve.
 * @returns {Promise<Object|null>} Resolves with the crop object if found, or null if not found.
 * @throws {Error} Throws an error if the database query fails.
 */

async function getCropById (cropId) {
  try {
    logger.crops.info('Obteniendo cultivo por ID', { cropId })

    const query = {
      text: 'SELECT * FROM crop WHERE crop_id = $1',
      values: [cropId]
    }
    const result = await pool.query(query)

    if (result.rows[0]) {
      logger.crops.info('Cultivo encontrado por ID', { cropId })
    } else {
      logger.crops.warn('Cultivo no encontrado por ID', { cropId })
    }

    return result.rows[0]
  } catch (error) {
    logger.crops.error('Error obteniendo cultivo por ID', {
      cropId,
      error: error.message
    })
    throw error
  }
}

/**
 * Retrieves a paginated list of crops for a specific user, including plot names and total count.
 *
 * @async
 * @function getCropsByUserId
 * @param {number|string} userId - The ID of the user whose crops are to be retrieved.
 * @param {number} [page=1] - The page number for pagination.
 * @param {number} [limit=10] - The number of crops to retrieve per page.
 * @returns {Promise<Array<Object>>} Resolves to an array of crop objects with plot information and total count.
 * @throws Will throw an error if the database query fails.
 */

async function getCropsByUserId (userId, page = 1, limit = 10) {
  try {
    logger.crops.info('Obteniendo cultivos por ID de usuario', { userId, page, limit })

    const offset = (page - 1) * limit

    const query = {
      text: 'SELECT c.*, p.plot_name, COUNT(*) OVER() as total_count FROM crop c JOIN plots p ON c.plot_id = p.plot_id WHERE c.user_id = $1 AND c.is_active = true ORDER BY c.created_at DESC LIMIT $2 OFFSET $3',
      values: [userId, limit, offset]
    }
    const result = await pool.query(query)

    logger.crops.info('Cultivos obtenidos exitosamente', {
      userId,
      total: result.rows.length,
      page,
      limit
    })

    return result.rows
  } catch (error) {
    logger.crops.error('Error obteniendo cultivos por ID de usuario', {
      userId,
      page,
      limit,
      error: error.message
    })
    throw error
  }
}

/**
 * Retrieves the total number of active crops for a given user ID.
 *
 * @async
 * @function getTotalCropsByUserId
 * @param {number|string} userId - The ID of the user whose crops are to be counted.
 * @returns {Promise<number>} The total count of active crops for the specified user.
 * @throws Will throw an error if the database query fails.
 */

async function getTotalCropsByUserId (userId) {
  try {
    logger.crops.info('Obteniendo total de cultivos por ID de usuario', { userId })

    const query = {
      text: 'SELECT COUNT(*) FROM crop WHERE user_id = $1 AND is_active = true',
      values: [userId]
    }
    const result = await pool.query(query)
    const total = parseInt(result.rows[0].count)

    logger.crops.info('Total de cultivos obtenido exitosamente', { userId, total })

    return total
  } catch (error) {
    logger.crops.error('Error obteniendo total de cultivos', {
      userId,
      error: error.message
    })
    throw error
  }
}

/**
 * Deletes (deactivates) a crop for a specific user by setting its `is_active` property to false.
 * Validates that the crop exists, belongs to the user, and is currently active before deactivation.
 *
 * @async
 * @function deleteCropByUserId
 * @param {number|string} userId - The ID of the user who owns the crop.
 * @param {number|string} cropId - The ID of the crop to be deleted.
 * @throws {Error} If the crop does not exist, does not belong to the user, or is not active.
 * @returns {Promise<void>} Resolves when the crop is successfully deactivated.
 */

async function deleteCropByUserId (userId, cropId) {
  try {
    logger.crops.info('Eliminando cultivo por ID', { userId, cropId })

    // Validar que el usuario tenga cultivo
    const existingCrop = await getCropByIdAndUserId(cropId, userId)
    if (!existingCrop) {
      logger.crops.warn('Cultivo no encontrado o no pertenece al usuario', { userId, cropId })
      throw new NotFoundError('Crop not found or does not belong to the user')
    }

    // Validar que el cultivo este activo
    const isActive = existingCrop.is_active
    if (!isActive) {
      logger.crops.warn('Cultivo no está activo', { userId, cropId })
      throw new ConflictError('Crop is not active')
    }

    // Eliminar el cultivo
    const deleteQuery = {
      text: 'UPDATE crop SET is_active = false WHERE crop_id = $1 AND user_id = $2',
      values: [cropId, userId]
    }
    await pool.query(deleteQuery)

    logger.crops.info('Cultivo eliminado exitosamente', { userId, cropId })
  } catch (error) {
    logger.crops.error('Error eliminando cultivo', {
      userId,
      cropId,
      error: error.message
    })

    if (error instanceof NotFoundError || error instanceof ConflictError) {
      throw error
    }
    throw new InternalServerError('Error deleting crop', { original: error.message })
  }
}

/**
 * Retrieves a crop record by its ID and associated user ID, ensuring the crop is active.
 *
 * @async
 * @function getCropByIdAndUserId
 * @param {number|string} cropId - The unique identifier of the crop.
 * @param {number|string} userId - The unique identifier of the user.
 * @returns {Promise<Object|null>} The crop record if found, or null if not found.
 * @throws {Error} If there is an error during the database query.
 */

async function getCropByIdAndUserId (cropId, userId) {
  try {
    logger.crops.info('Obteniendo cultivo por ID y ID de usuario', { cropId, userId })

    const query = {
      text: 'SELECT * FROM crop WHERE crop_id = $1 AND user_id = $2 AND is_active = true',
      values: [cropId, userId]
    }
    const result = await pool.query(query)

    if (result.rows[0]) {
      logger.crops.info('Cultivo encontrado por ID y ID de usuario', { cropId, userId })
    } else {
      logger.crops.warn('Cultivo no encontrado por ID y ID de usuario', { cropId, userId })
    }

    return result.rows[0]
  } catch (error) {
    logger.crops.error('Error obteniendo cultivo por ID y ID de usuario', {
      cropId,
      userId,
      error: error.message
    })
    throw error
  }
}

/**
 * Retrieves the default active plot for a given user by their user ID.
 * The default plot is determined as the first active plot (ordered by plot_id).
 *
 * @async
 * @function getDefaultPlotByUserId
 * @param {number|string} userId - The ID of the user whose default plot is to be retrieved.
 * @returns {Promise<Object|null>} The first active plot object for the user, or null if none found.
 * @throws {Error} If there is an error during database query execution.
 */

async function getDefaultPlotByUserId (userId) {
  try {
    logger.crops.info('Obteniendo parcela por defecto por ID de usuario', { userId })

    const query = {
      text: 'SELECT plot_id FROM plots WHERE user_id = $1 AND is_active = true ORDER BY plot_id LIMIT 1',
      values: [userId]
    }
    const result = await pool.query(query)

    if (result.rows[0]) {
      logger.crops.info('Parcela por defecto encontrada', { userId, plotId: result.rows[0].plot_id })
    } else {
      logger.crops.warn('No se encontró parcela por defecto para el usuario', { userId })
    }

    return result.rows[0]
  } catch (error) {
    logger.crops.error('Error obteniendo parcela por defecto', {
      userId,
      error: error.message
    })
    throw error
  }
}

/**
 * Validates if a given plot belongs to a user and is active.
 *
 * @async
 * @function validateUserPlot
 * @param {number|string} userId - The ID of the user.
 * @param {number|string} plotId - The ID of the plot to validate.
 * @returns {Promise<Object|undefined>} Resolves with the plot row if valid, otherwise undefined.
 * @throws Will throw an error if the database query fails.
 */

async function validateUserPlot (userId, plotId) {
  try {
    logger.crops.info('Validando parcela de usuario', { userId, plotId })

    const query = {
      text: 'SELECT plot_id FROM plots WHERE user_id = $1 AND plot_id = $2 AND is_active = true LIMIT 1',
      values: [userId, plotId]
    }
    const result = await pool.query(query)

    if (result.rows[0]) {
      logger.crops.info('Parcela validada exitosamente', { userId, plotId })
    } else {
      logger.crops.warn('Parcela no válida para el usuario', { userId, plotId })
    }

    return result.rows[0]
  } catch (error) {
    logger.crops.error('Error validando parcela de usuario', {
      userId,
      plotId,
      error: error.message
    })
    throw error
  }
}

export const Crop = {
  createCrop,
  updateCropByUserId,
  getCropById,
  getCropsByUserId,
  getTotalCropsByUserId,
  deleteCropByUserId,
  getCropByIdAndUserId,
  getDefaultPlotByUserId,
  validateUserPlot
}
