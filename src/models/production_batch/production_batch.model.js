import { pool } from '../../lib/db.js'
import { validateProductionBatch, validateActivityIds } from '../../middlewares/index.js'
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
    const qrUrl = `${config.appUrl}/trazabilidad/${uniqueCode}`
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

async function associateActivitiesToBatch (userId, productionId, activityIds) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    await validateActivityIds(activityIds)

    // 1. Validate production batch belongs to user
    const batch = await getProductionBatchByIdAndUserId(productionId, userId, client)
    if (!batch) {
      throw new Error('El lote de producción no existe o no pertenece al usuario')
    }

    // 2. Validate that activities belong to the same crop as the batch
    await validateActivitiesCropOwnership(activityIds, batch.crop_id, client)

    // 3. Remove existing associations
    const deleteResult = await client.query(
      'DELETE FROM activity_branch WHERE production_id = $1',
      [productionId]
    )

    // 4. Insert new associations
    const associatedActivities = []
    for (const activityId of activityIds) {
      const result = await client.query(
        `INSERT INTO activity_branch (production_id, activity_id) 
         VALUES ($1, $2) 
         RETURNING branch_id, activity_id`,
        [productionId, activityId]
      )
      associatedActivities.push(result.rows[0])
    }

    // 5. Update QR code to reflect new activities - ESTA ES LA PARTE IMPORTANTE
    const qrUpdate = await updateBatchQRCode(productionId, client)

    await client.query('COMMIT')

    return {
      success: true,
      message: 'Actividades asociadas exitosamente',
      production_id: productionId,
      associated_count: associatedActivities.length,
      activities: associatedActivities,
      qr_updated: true,
      new_qr: qrUpdate,
      previous_activity_count: deleteResult.rows.length
    }
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error associating activities to batch:', error)
    throw error
  } finally {
    client.release()
  }
}

async function getProductionBatchByIdAndUserId (productionId, userId) {
  try {
    const query = {
      text: `SELECT pb.*, c.crop_id 
             FROM production_batch pb
             JOIN crop c ON pb.crop_id = c.crop_id
             WHERE pb.production_id = $1 AND c.user_id = $2 AND pb.is_active = true`,
      values: [productionId, userId]
    }
    const result = await pool.query(query)
    return result.rows[0]
  } catch (error) {
    console.error('Error getting production batch:', error)
    throw error
  }
}

async function validateActivitiesCropOwnership (activityIds, cropId) {
  try {
    const query = {
      text: `SELECT activity_id FROM activity 
             WHERE activity_id = ANY($1) AND crop_id != $2`,
      values: [activityIds, cropId]
    }
    const result = await pool.query(query)
    return result.rows[0]
  } catch (error) {
    console.error('Error validating activities crop ownership:', error)
    throw error
  }
}

async function updateBatchQRCode (productionId, client = pool) {
  try {
    const batchInfo = await getBatchInfo(productionId)

    if (!batchInfo) {
      throw new Error('Production batch not found')
    }

    // Generar URL para el QR
    const qrUrl = `${config.appUrl}/trazabilidad/${batchInfo.unique_code}`

    // Generar QR code con la URL
    const newQRCode = await generateQRCodeDataURL(qrUrl, {
      width: 400,
      margin: 3,
      darkColor: '#1a365d',
      errorCorrectionLevel: 'H'
    })

    const qrData = {
      production_id: productionId,
      unique_code: batchInfo.unique_code,
      batch_name: batchInfo.name,
      crop_type: batchInfo.crop_type,
      activity_count: batchInfo.activity_count,
      last_activity_date: batchInfo.last_activity_date,
      timestamp: new Date().toISOString()
    }

    const updateQuery = {
      text: `UPDATE qr_lote 
             SET qr_code = $1, 
                 generation_date = CURRENT_TIMESTAMP,
                 qr_data = $2
             WHERE production_id = $3 
             RETURNING *`,
      values: [newQRCode, qrData, productionId]
    }

    const updateResult = await client.query(updateQuery)

    if (updateResult.rowCount === 0) {
      const insertQuery = {
        text: `INSERT INTO qr_lote (production_id, qr_code, qr_data) 
               VALUES ($1, $2, $3) 
               RETURNING *`,
        values: [productionId, newQRCode, qrData]
      }
      const insertResult = await client.query(insertQuery)
      return insertResult.rows[0]
    }

    return updateResult.rows[0]
  } catch (error) {
    console.error('Error updating batch QR code:', error)
    throw error
  }
}

async function getAvaliableActivitiesForBatch (userId, productionId) {
  try {
    const batch = await getProductionBatchByIdAndUserId(productionId, userId)
    if (!batch) {
      throw new Error('Production batch not found')
    }

    const query = {
      text: `SELECT a.activity_id, a.activity_type, a.date, a.description,
                    a.cost_total, a.created_at,
                    json_agg(
                      json_build_object(
                        'input_name', iu.input_name,
                        'quantity', iu.quantity,
                        'unit', iu.unit
                      )
                    ) as inputs
             FROM activity a
             LEFT JOIN input_used iu ON a.activity_id = iu.activity_id
             WHERE a.crop_id = $1 
               AND a.activity_id NOT IN (
                 SELECT activity_id FROM activity_branch WHERE production_id = $2
               )
             GROUP BY a.activity_id, a.activity_type, a.date, a.description, 
                      a.cost_total, a.created_at
             ORDER BY a.date DESC`,
      values: [batch.crop_id, productionId]
    }
    const result = await pool.query(query)
    return result.rows
  } catch (error) {
    console.error('Error getting available activities for batch:', error)
    throw error
  }
}

async function getBatchActivities (productionId, userId) {
  try {
    const batch = await getProductionBatchByIdAndUserId(productionId, userId)

    if (!batch) {
      throw new Error('Production batch not found')
    }

    const query = {
      text: `SELECT a.activity_id, a.activity_type, a.date, a.description,
                    a.cost_total, a.created_at, ab.branch_id,
                    json_agg(
                      json_build_object(
                        'input_name', iu.input_name,
                        'quantity', iu.quantity,
                        'unit', iu.unit,
                        'unit_cost', iu.unit_cost
                      )
                    ) as inputs
             FROM activity_branch ab
             JOIN activity a ON ab.activity_id = a.activity_id
             LEFT JOIN input_used iu ON a.activity_id = iu.activity_id
             WHERE ab.production_id = $1
             GROUP BY a.activity_id, a.activity_type, a.date, a.description, 
                      a.cost_total, a.created_at, ab.branch_id
             ORDER BY a.date ASC`,
      values: [productionId]
    }
    const result = await pool.query(query)
    return result.rows
  } catch (error) {
    console.error('Error getting activities for batch:', error)
    throw error
  }
}

async function getBatchInfo (productionId) {
  try {
    const query = {
      text: `SELECT pb.production_id, pb.unique_code, pb.name, 
                    c.crop_type, c.crop_variety,
                    COUNT(ab.activity_id) as activity_count,
                    MAX(a.date) as last_activity_date
             FROM production_batch pb
             JOIN crop c ON pb.crop_id = c.crop_id
             LEFT JOIN activity_branch ab ON pb.production_id = ab.production_id
             LEFT JOIN activity a ON ab.activity_id = a.activity_id
             WHERE pb.production_id = $1
             GROUP BY pb.production_id, pb.unique_code, pb.name, 
                      c.crop_type, c.crop_variety`,
      values: [productionId]
    }
    const result = await pool.query(query)
    return result.rows[0]
  } catch (error) {
    console.error('Error getting batch info:', error)
    throw error
  }
}

async function getTraceabilityByUniqueCode (uniqueCode) {
  try {
    // 1. Get basic batch information
    const batchQuery = {
      text: `SELECT pb.production_id, pb.name as batch_name, pb.creation_date,
                    pb.unique_code, c.crop_type, c.crop_variety, 
                    c.planting_date, c.harvest_date,
                    u.first_name, u.paternal_surname, u.maternal_surname,
                    p.plot_name, p.location,
                    COUNT(ab.activity_id) as total_activities,
                    MAX(a.date) as last_activity_date
             FROM production_batch pb
             JOIN crop c ON pb.crop_id = c.crop_id
             JOIN users u ON c.user_id = u.user_id
             JOIN plots p ON c.plot_id = p.plot_id
             LEFT JOIN activity_branch ab ON pb.production_id = ab.production_id
             LEFT JOIN activity a ON ab.activity_id = a.activity_id
             WHERE pb.unique_code = $1 AND pb.is_active = true
             GROUP BY pb.production_id, pb.name, pb.creation_date, pb.unique_code,
                      c.crop_type, c.crop_variety, c.planting_date, c.harvest_date,
                      u.first_name, u.paternal_surname, u.maternal_surname,
                      p.plot_name, p.location`,
      values: [uniqueCode]
    }

    const batchResult = await pool.query(batchQuery)

    if (batchResult.rows.length === 0) {
      throw new Error('Código de trazabilidad no encontrado')
    }

    const batch = batchResult.rows[0]

    // 2. Get activities with their inputs
    const activitiesQuery = {
      text: `SELECT a.activity_id, a.activity_type, a.date, a.description,
                    a.cost_total, a.created_at,
                    json_agg(
                      json_build_object(
                        'input_name', iu.input_name,
                        'quantity', iu.quantity,
                        'unit', iu.unit,
                        'unit_cost', iu.unit_cost,
                        'cost_total', iu.cost_total
                      ) 
                    ) as inputs
             FROM activity_branch ab
             JOIN activity a ON ab.activity_id = a.activity_id
             LEFT JOIN input_used iu ON a.activity_id = iu.activity_id
             WHERE ab.production_id = $1
             GROUP BY a.activity_id, a.activity_type, a.date, a.description, 
                      a.cost_total, a.created_at
             ORDER BY a.date ASC`,
      values: [batch.production_id]
    }

    const activitiesResult = await pool.query(activitiesQuery)
    const activities = activitiesResult.rows

    // 3. Calculate total costs
    const totalBatchCost = activities.reduce((total, activity) => {
      return total + parseFloat(activity.cost_total || 0)
    }, 0)

    const hasActivities = activities.length > 0

    return {
      batch_info: {
        name: batch.batch_name,
        unique_code: batch.unique_code,
        creation_date: batch.creation_date,
        production_id: batch.production_id
      },
      crop_info: {
        type: batch.crop_type,
        variety: batch.crop_variety,
        planting_date: batch.planting_date,
        harvest_date: batch.harvest_date
      },
      producer_info: {
        name: `${batch.first_name} ${batch.paternal_surname} ${batch.maternal_surname}`.trim(),
        plot: batch.plot_name,
        location: batch.location
      },
      activities,
      summary: {
        has_activities: hasActivities,
        total_activities: parseInt(batch.total_activities || 0),
        total_batch_cost: totalBatchCost,
        last_activity_date: batch.last_activity_date,
        qr_scanned_at: new Date().toISOString()
      },
      message: hasActivities
        ? `Trazabilidad completa - ${batch.total_activities} actividades registradas`
        : 'Este lote no tiene actividades asociadas. La trazabilidad estará disponible cuando se agreguen actividades.'
    }
  } catch (error) {
    console.error('Error obteniendo trazabilidad:', error)
    throw error
  }
}

export const productionBatch = {
  createProductionBatch,
  validateCropByUserId,
  getProducctionBatchesByUser,
  getTotalProducctionBatchesByUserId,
  getProductionBatchDetail,
  associateActivitiesToBatch,
  getProductionBatchByIdAndUserId,
  validateActivitiesCropOwnership,
  updateBatchQRCode,
  getAvaliableActivitiesForBatch,
  getBatchActivities,
  getBatchInfo,
  getTraceabilityByUniqueCode
}
