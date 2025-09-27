import { pool } from '../../lib/db.js'
import { validateProductionBatch } from '../../middlewares/index.js'
import { generateUniqueBatchCode, generateQRCodeDataURL } from '../../helpers/index.js'
import { config } from '../../../config.js'

async function createProductionBatch (userId, cropId, batchData) {
  try {
    await validateProductionBatch(batchData)

    // validate that the crop belongs to the user
    const crop = await validateCropByUserId(userId, cropId)

    if (!crop) {
      throw new Error('Crop does not belong to user')
    }

    // Generate unique code and QR URL
    const uniqueCode = generateUniqueBatchCode()
    const qrUrl = `${config.port}/trazabilidad/${uniqueCode}`
    const creationDate = new Date()

    // Insert product batch
    const batchQuery = {
      text: `INSERT INTO production_batch 
             (crop_id, name, unique_code, creation_date) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
      values: [cropId, batchData.name.trim(), uniqueCode, creationDate]
    }
    const batchResult = await pool.query(batchQuery)
    const productionBatch = batchResult.rows[0]

    // Generate QR Code
    const qrDataURL = await generateQRCodeDataURL(qrUrl)

    // Insert QR record
    const qrQuery = {
      text: `INSERT INTO qr_lote (production_id, qr_code) 
             VALUES ($1, $2) 
             RETURNING *`,
      values: [productionBatch.production_id, qrDataURL]
    }
    const qrResult = await pool.query(qrQuery)
    const qrRecord = qrResult.rows[0]

    return {
      ...productionBatch,
      qr: qrRecord,
      qr_url: qrUrl
    }
  } catch (error) {
    console.error('Error creating production batch:', error)
    throw error
  }
}

async function validateCropByUserId (userId, cropId) {
  try {
    const query = {
      text: `SELECT c.crop_id, c.crop_type, c.crop_variety 
             FROM crop c 
             WHERE c.crop_id = $1 AND c.user_id = $2 AND c.is_active = true`,
      values: [cropId, userId]
    }
    const result = await pool.query(query)
    return result.rows[0]
  } catch (error) {
    console.error('Error validating crop by user ID:', error)
    throw error
  }
}

export const productionBatch = {
  createProductionBatch,
  validateCropByUserId
}
