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

async function getProducctionBatchesByUser (userId, page = 1, limit = 10) {
  try {
    const offset = (page - 1) * limit
    const query = {
      text: `SELECT pb.production_id, pb.name, pb.unique_code, pb.creation_date,
                    pb.created_at, c.crop_type, c.crop_variety,
                    qr.qr_code, qr.generation_date,
                    COUNT(ab.activity_id) as activity_count,
                    COUNT(*) OVER() as total_count
             FROM production_batch pb
             JOIN crop c ON pb.crop_id = c.crop_id
             LEFT JOIN qr_lote qr ON pb.production_id = qr.production_id
             LEFT JOIN activity_branch ab ON pb.production_id = ab.production_id
             WHERE c.user_id = $1 AND pb.is_active = true
             GROUP BY pb.production_id, c.crop_id, qr.qr_id
             ORDER BY pb.created_at DESC
             LIMIT $2 OFFSET $3`,
      values: [userId, limit, offset]
    }
    const result = await pool.query(query)
    console.log('Batches query result: ', result.rows)
    return result.rows
  } catch (error) {
    console.error('Error getting production batches by user:', error)
    throw error
  }
}

async function getTotalProducctionBatchesByUserId (userId) {
  try {
    const query = {
      text: `SELECT COUNT(DISTINCT pb.production_id) as total
             FROM production_batch pb
             JOIN crop c ON pb.crop_id = c.crop_id
             WHERE c.user_id = $1 AND pb.is_active = true`,
      values: [userId]
    }
    const result = await pool.query(query)
    return parseInt(result.rows[0].total)
  } catch (error) {
    console.error('Error getting total production batches by user ID:', error)
    throw error
  }
}

async function getProductionBatchDetail (userId, productionId) {
  try {
    const query = {
      text: `SELECT pb.*, c.crop_type, c.crop_variety, 
                    c.planting_date, c.harvest_date,
                    qr.qr_code, qr.generation_date,
                    u.first_name, u.paternal_surname,
                    p.plot_name, p.location
             FROM production_batch pb
             JOIN crop c ON pb.crop_id = c.crop_id
             JOIN users u ON c.user_id = u.user_id
             JOIN plots p ON c.plot_id = p.plot_id
             LEFT JOIN qr_lote qr ON pb.production_id = qr.production_id
             WHERE pb.production_id = $1 AND c.user_id = $2 AND pb.is_active = true`,
      values: [productionId, userId]
    }
    const result = await pool.query(query)
    return result.rows[0]
  } catch (error) {
    console.error('Error getting production batch detail:', error)
    throw error
  }
}

export const productionBatch = {
  createProductionBatch,
  validateCropByUserId,
  getProducctionBatchesByUser,
  getTotalProducctionBatchesByUserId,
  getProductionBatchDetail
}
