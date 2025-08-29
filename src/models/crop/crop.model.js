import { pool } from '../../lib/db.js'
import { validFieldsRegisterCrop } from '../../middlewares/index.js'

async function createCrop (userId, plotId, crop) {
  try {
    await validFieldsRegisterCrop(crop)

    // Si no se proporciona plotId, obtener la parcela por defecto
    if (!plotId) {
      const defaultPlot = await getDefaultPlotByUserId(userId)
      if (!defaultPlot) {
        throw new Error('The user does not have an active plot')
      }
      plotId = defaultPlot.plot_id
    } else {
      // Validar que el plot_id proporcionado pertenezca al usuario
      const existingPlot = await validateUserPlot(userId, plotId)
      if (!existingPlot) {
        throw new Error('The plot does not belong to the user or is not active')
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
    return result.rows[0]
  } catch (error) {
    console.log('Error creating crop: ', error)
    throw error
  }
}

async function updateCropByUserId (userId, cropId, cropData) {
  try {
    await validFieldsRegisterCrop(cropData)

    // validate crop ownership and existence
    const existingCrop = await getCropByIdAndUserId(cropId, userId)
    if (!existingCrop) {
      throw new Error('Crop not found or does not belong to the user')
    }

    // Validate it belongs to the user
    if (cropData.plot_id) {
      const validPlot = await validateUserPlot(userId, cropData.plot_id)
      if (!validPlot) {
        throw new Error('The plot does not belong to the user')
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
        // cropData.crop_id
      ]
    }
    const result = await pool.query(query)
    return result.rows[0]
  } catch (error) {
    console.log('Error updating crop: ', error)
    throw error
  }
}

async function getCropById (cropId) {
  try {
    const query = {
      text: 'SELECT * FROM crop WHERE crop_id = $1',
      values: [cropId]
    }
    const result = await pool.query(query)
    return result.rows[0]
  } catch (error) {
    console.log('Error getting crop by ID: ', error)
    throw error
  }
}

async function getCropsByUserId (userId, page = 1, limit = 10) {
  try {
    const offset = (page - 1) * limit

    const query = {
      text: 'SELECT c.*, p.plot_name, COUNT(*) OVER() as total_count FROM crop c JOIN plots p ON c.plot_id = p.plot_id WHERE c.user_id = $1 AND c.is_active = true ORDER BY c.created_at DESC LIMIT $2 OFFSET $3',
      values: [userId, limit, offset]
    }
    const result = await pool.query(query)
    return result.rows
  } catch (error) {
    console.log('Error getting crops by user ID: ', error)
    throw error
  }
}

async function getTotalCropsByUserId (userId) {
  try {
    const query = {
      text: 'SELECT COUNT(*) FROM crop WHERE user_id = $1 AND is_active = true',
      values: [userId]
    }
    const result = await pool.query(query)
    return parseInt(result.rows[0].count)
  } catch (error) {
    console.log('Error getting total crops: ', error)
    throw error
  }
}

async function deleteCropByUserId (userId, cropId) {
  try {
    // Validar que el usuario tenga cultivo
    const existingCrop = await getCropByIdAndUserId(cropId, userId)
    if (!existingCrop) {
      throw new Error('Crop not found or does not belong to the user')
    }

    // Validar que el cultivo este activo
    const isActive = existingCrop.is_active
    if (!isActive) {
      throw new Error('Crop is not active')
    }

    // Eliminar el cultivo
    const deleteQuery = {
      text: 'UPDATE crop SET is_active = false WHERE crop_id = $1 AND user_id = $2',
      values: [cropId, userId]
    }
    await pool.query(deleteQuery)
  } catch (error) {

  }
}

async function getCropByIdAndUserId (cropId, userId) {
  try {
    const query = {
      text: 'SELECT * FROM crop WHERE crop_id = $1 AND user_id = $2 AND is_active = true',
      values: [cropId, userId]
    }
    const result = await pool.query(query)
    return result.rows[0]
  } catch (error) {
    console.log('Error getting crop by ID: ', error)
    throw error
  }
}

async function getDefaultPlotByUserId (userId) {
  try {
    const query = {
      text: 'SELECT plot_id FROM plots WHERE user_id = $1 AND is_active = true ORDER BY plot_id LIMIT 1',
      values: [userId]
    }
    const result = await pool.query(query)
    return result.rows[0]
  } catch (error) {
    console.log('Error getting default plot: ', error)
    throw error
  }
}

async function validateUserPlot (userId, plotId) {
  try {
    const query = {
      text: 'SELECT plot_id FROM plots WHERE user_id = $1 AND plot_id = $2 AND is_active = true LIMIT 1',
      values: [userId, plotId]
    }
    const result = await pool.query(query)
    return result.rows[0]
  } catch (error) {
    console.log('Error validating user plot: ', error)
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
