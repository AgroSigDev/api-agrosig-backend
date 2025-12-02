import { pool } from '../../lib/db.js'
import { validateProductionBatch, validateActivityIds } from '../../middlewares/index.js'
import { generateUniqueBatchCode, generateQRCodeDataURL } from '../../helpers/index.js'
import { config } from '../../../config.js'
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  InternalServerError
} from '../../lib/api.errors.js'
import { logger } from '../../utils/logger.utils.js'

/**
 * Creates a new production batch for a specific crop, generating a unique code and QR code.
 * Validates that the crop belongs to the user and creates associated QR record.
 * @param {number} userId - The ID of the user creating the batch.
 * @param {number} cropId - The ID of the crop for which the batch is being created.
 * @param {object} batchData - The batch data object containing name and other details.
 * @param {string} batchData.name - The name of the production batch.
 * @returns {Promise<object>} The created production batch with QR code information.
 * @throws {ValidationError} If batch data validation fails.
 * @throws {NotFoundError} If the crop does not belong to the user.
 * @throws {InternalServerError} For database or other unexpected errors.
 */
async function createProductionBatch (userId, cropId, batchData) {
  try {
    logger.production.info('Creando lote de producción', { userId, cropId, batchData, appUrl: config.appUrl })

    await validateProductionBatch(batchData)

    // validate that the crop belongs to the user
    const crop = await validateCropByUserId(userId, cropId)

    if (!crop) {
      logger.production.warn('Cultivo no pertenece al usuario', { userId, cropId })
      throw new NotFoundError('Cultivo no encontrado o no pertenece al usuario')
    }

    // Generate unique code and QR URL
    const uniqueCode = generateUniqueBatchCode()
    const qrUrl = `${config.appUrl}/trazabilidad/${uniqueCode}`

    logger.info('Generando código único y URL para QR', { qrUrl, uniqueCode, appUrl: config.appUrl })

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

    logger.production.info('Lote de producción creado exitosamente', {
      userId,
      cropId,
      productionId: productionBatch.production_id,
      uniqueCode
    })

    return {
      ...productionBatch,
      qr: qrRecord,
      qr_url: qrUrl
    }
  } catch (error) {
    logger.production.error('Error creando lote de producción', {
      userId,
      cropId,
      error: error.message,
      batchData
    })

    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error
    }
    throw new InternalServerError('Error al crear el lote de producción', { original: error.message })
  }
}

/**
 * Validates that a crop belongs to a specific user and is active.
 * @param {number} userId - The ID of the user.
 * @param {number} cropId - The ID of the crop to validate.
 * @returns {Promise<object|null>} The crop data if valid, null otherwise.
 * @throws {Error} If there's a database error.
 */
async function validateCropByUserId (userId, cropId) {
  try {
    logger.production.info('Validando cultivo por ID de usuario', { userId, cropId })

    const query = {
      text: `SELECT c.crop_id, c.crop_type, c.crop_variety 
             FROM crop c 
             WHERE c.crop_id = $1 AND c.user_id = $2 AND c.is_active = true`,
      values: [cropId, userId]
    }
    const result = await pool.query(query)

    if (result.rows[0]) {
      logger.production.info('Cultivo validado exitosamente', { userId, cropId })
    } else {
      logger.production.warn('Cultivo no encontrado o no pertenece al usuario', { userId, cropId })
    }

    return result.rows[0]
  } catch (error) {
    logger.production.error('Error validando cultivo por ID de usuario', {
      userId,
      cropId,
      error: error.message
    })
    throw error
  }
}

/**
 * Retrieves production batches for a specific user with pagination.
 * Includes crop information, QR codes, and activity counts.
 * @param {number} userId - The ID of the user.
 * @param {number} [page=1] - The page number for pagination.
 * @param {number} [limit=10] - The number of batches per page.
 * @returns {Promise<Array>} Array of production batch objects with related data.
 * @throws {Error} If there's a database error.
 */
async function getProducctionBatchesByUser (userId, page = 1, limit = 10) {
  try {
    logger.production.info('Obteniendo lotes de producción por usuario', { userId, page, limit })

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

    logger.production.info('Lotes de producción obtenidos exitosamente', {
      userId,
      total: result.rows.length,
      page,
      limit
    })

    return result.rows
  } catch (error) {
    logger.production.error('Error obteniendo lotes de producción por usuario', {
      userId,
      page,
      limit,
      error: error.message
    })
    throw error
  }
}

/**
 * Gets the total count of production batches for a specific user.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<number>} The total number of production batches.
 * @throws {Error} If there's a database error.
 */
async function getTotalProducctionBatchesByUserId (userId) {
  try {
    logger.production.info('Obteniendo total de lotes de producción por usuario', { userId })

    const query = {
      text: `SELECT COUNT(DISTINCT pb.production_id) as total
             FROM production_batch pb
             JOIN crop c ON pb.crop_id = c.crop_id
             WHERE c.user_id = $1 AND pb.is_active = true`,
      values: [userId]
    }
    const result = await pool.query(query)
    const total = parseInt(result.rows[0].total)

    logger.production.info('Total de lotes de producción obtenido exitosamente', { userId, total })

    return total
  } catch (error) {
    logger.production.error('Error obteniendo total de lotes de producción por usuario', {
      userId,
      error: error.message
    })
    throw error
  }
}

/**
 * Retrieves detailed information about a specific production batch.
 * Includes crop, user, plot, and QR code information.
 * @param {number} userId - The ID of the user requesting the details.
 * @param {number} productionId - The ID of the production batch.
 * @returns {Promise<object|null>} The detailed production batch data or null if not found.
 * @throws {Error} If there's a database error.
 */
async function getProductionBatchDetail (userId, productionId) {
  try {
    logger.production.info('Obteniendo detalle del lote de producción', { userId, productionId })

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

    if (result.rows[0]) {
      logger.production.info('Detalle del lote de producción obtenido exitosamente', { userId, productionId })
    } else {
      logger.production.warn('Detalle del lote de producción no encontrado', { userId, productionId })
    }

    return result.rows[0]
  } catch (error) {
    logger.production.error('Error obteniendo detalle del lote de producción', {
      userId,
      productionId,
      error: error.message
    })
    throw error
  }
}

/**
 * Associates activities to a production batch in a transactional manner.
 * Validates ownership, removes existing associations, and updates QR code.
 * @param {number} userId - The ID of the user performing the association.
 * @param {number} productionId - The ID of the production batch.
 * @param {Array<number>} activityIds - Array of activity IDs to associate.
 * @returns {Promise<object>} Result object with association details and QR update info.
 * @throws {ValidationError} If activity IDs validation fails.
 * @throws {NotFoundError} If batch doesn't exist or doesn't belong to user.
 * @throws {ConflictError} If activities don't belong to the same crop.
 * @throws {InternalServerError} For database transaction errors.
 */
async function associateActivitiesToBatch (userId, productionId, activityIds) {
  const client = await pool.connect()

  try {
    logger.production.info('Asociando actividades al lote', { userId, productionId, activityIds })

    await client.query('BEGIN')

    await validateActivityIds(activityIds)

    // 1. Validate production batch belongs to user
    const batch = await getProductionBatchByIdAndUserId(productionId, userId, client)
    if (!batch) {
      logger.production.warn('Lote de producción no encontrado o no pertenece al usuario', { userId, productionId })
      throw new NotFoundError('El lote de producción no existe o no pertenece al usuario')
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

    // 5. Update QR code to reflect new activities
    const qrUpdate = await updateBatchQRCode(productionId, client)

    await client.query('COMMIT')

    logger.production.info('Actividades asociadas exitosamente', {
      userId,
      productionId,
      associatedCount: associatedActivities.length
    })

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
    logger.production.error('Error asociando actividades al lote', {
      userId,
      productionId,
      activityIds,
      error: error.message
    })

    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error
    }
    throw new InternalServerError('Error al asociar actividades al lote', { original: error.message })
  } finally {
    client.release()
  }
}

/**
 * Retrieves a production batch by ID and validates user ownership.
 * @param {number} productionId - The ID of the production batch.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<object|null>} The production batch data with crop ID or null if not found.
 * @throws {Error} If there's a database error.
 */
async function getProductionBatchByIdAndUserId (productionId, userId) {
  try {
    logger.production.info('Obteniendo lote de producción por ID y usuario', { productionId, userId })

    const query = {
      text: `SELECT pb.*, c.crop_id 
             FROM production_batch pb
             JOIN crop c ON pb.crop_id = c.crop_id
             WHERE pb.production_id = $1 AND c.user_id = $2 AND pb.is_active = true`,
      values: [productionId, userId]
    }
    const result = await pool.query(query)

    if (result.rows[0]) {
      logger.production.info('Lote de producción encontrado', { productionId, userId })
    } else {
      logger.production.warn('Lote de producción no encontrado', { productionId, userId })
    }

    return result.rows[0]
  } catch (error) {
    logger.production.error('Error obteniendo lote de producción por ID y usuario', {
      productionId,
      userId,
      error: error.message
    })
    throw error
  }
}

/**
 * Validates that all activities belong to the specified crop.
 * @param {Array<number>} activityIds - Array of activity IDs to validate.
 * @param {number} cropId - The ID of the crop.
 * @throws {ConflictError} If any activities don't belong to the crop.
 * @throws {Error} If there's a database error.
 */
async function validateActivitiesCropOwnership (activityIds, cropId) {
  try {
    logger.production.info('Validando propiedad de actividades por cultivo', { activityIds, cropId })

    const query = {
      text: `SELECT activity_id FROM activity 
             WHERE activity_id = ANY($1) AND crop_id != $2`,
      values: [activityIds, cropId]
    }
    const result = await pool.query(query)

    if (result.rows.length > 0) {
      logger.production.warn('Algunas actividades no pertenecen al cultivo del lote', { activityIds, cropId })
      throw new ConflictError('Algunas actividades no pertenecen al cultivo del lote')
    }

    logger.production.info('Actividades validadas exitosamente', { activityIds, cropId })
  } catch (error) {
    logger.production.error('Error validando propiedad de actividades por cultivo', {
      activityIds,
      cropId,
      error: error.message
    })
    throw error
  }
}

/**
 * Updates the QR code for a production batch with current batch information.
 * @param {number} productionId - The ID of the production batch.
 * @param {object} [client=pool] - Database client for transactions.
 * @returns {Promise<object>} The updated QR record.
 * @throws {NotFoundError} If production batch is not found.
 * @throws {Error} If there's a database error.
 */
async function updateBatchQRCode (productionId, client = pool) {
  try {
    logger.production.info('Actualizando código QR del lote', { productionId })

    const batchInfo = await getBatchInfo(productionId)

    if (!batchInfo) {
      logger.production.warn('Lote de producción no encontrado para actualizar QR', { productionId })
      throw new NotFoundError('Production batch not found')
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
      logger.production.info('Código QR insertado exitosamente', { productionId })
      return insertResult.rows[0]
    }

    logger.production.info('Código QR actualizado exitosamente', { productionId })
    return updateResult.rows[0]
  } catch (error) {
    logger.production.error('Error actualizando código QR del lote', {
      productionId,
      error: error.message
    })
    throw error
  }
}

/**
 * Retrieves activities available for association with a production batch.
 * Returns activities from the same crop that are not already associated with the batch.
 * @param {number} userId - The ID of the user requesting the activities.
 * @param {number} productionId - The ID of the production batch.
 * @returns {Promise<Array>} Array of available activity objects with input details.
 * @throws {NotFoundError} If production batch is not found or doesn't belong to user.
 * @throws {Error} If there's a database error.
 */
async function getAvaliableActivitiesForBatch (userId, productionId) {
  try {
    logger.production.info('Obteniendo actividades disponibles para el lote', { userId, productionId })

    const batch = await getProductionBatchByIdAndUserId(productionId, userId)
    if (!batch) {
      logger.production.warn('Lote de producción no encontrado', { userId, productionId })
      throw new NotFoundError('Production batch not found')
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

    logger.production.info('Actividades disponibles obtenidas exitosamente', {
      userId,
      productionId,
      total: result.rows.length
    })

    return result.rows
  } catch (error) {
    logger.production.error('Error obteniendo actividades disponibles para el lote', {
      userId,
      productionId,
      error: error.message
    })
    throw error
  }
}

/**
 * Retrieves activities currently associated with a production batch.
 * Includes detailed input information for each activity.
 * @param {number} productionId - The ID of the production batch.
 * @param {number} userId - The ID of the user requesting the activities.
 * @returns {Promise<Array>} Array of associated activity objects with input details.
 * @throws {NotFoundError} If production batch is not found or doesn't belong to user.
 * @throws {Error} If there's a database error.
 */
async function getBatchActivities (productionId, userId) {
  try {
    logger.production.info('Obteniendo actividades del lote', { productionId, userId })

    const batch = await getProductionBatchByIdAndUserId(productionId, userId)

    if (!batch) {
      logger.production.warn('Lote de producción no encontrado', { productionId, userId })
      throw new NotFoundError('Production batch not found')
    }

    const query = {
      text: `SELECT 
               a.activity_id, 
               a.activity_type, 
               a.date, 
               a.description,
               a.cost_total, 
               a.created_at,
               ab.branch_id,
               COALESCE(
                 (
                   SELECT json_agg(
                     json_build_object(
                       'input_name', iu.input_name,
                       'quantity', iu.quantity,
                       'unit', iu.unit,
                       'unit_cost', iu.unit_cost
                     )
                   )
                   FROM input_used iu
                   WHERE iu.activity_id = a.activity_id
                 ), 
                 '[]'::json
               ) as inputs
             FROM activity_branch ab
             JOIN activity a ON ab.activity_id = a.activity_id
             WHERE ab.production_id = $1
             ORDER BY a.date ASC`,
      values: [productionId]
    }
    const result = await pool.query(query)

    logger.production.info('Actividades del lote obtenidas exitosamente', {
      productionId,
      userId,
      total: result.rows.length
    })

    return result.rows
  } catch (error) {
    logger.production.error('Error obteniendo actividades del lote', {
      productionId,
      userId,
      error: error.message
    })
    throw error
  }
}

/**
 * Retrieves basic information about a production batch including activity counts.
 * @param {number} productionId - The ID of the production batch.
 * @returns {Promise<object|null>} Batch information object or null if not found.
 * @throws {Error} If there's a database error.
 */
async function getBatchInfo (productionId) {
  try {
    logger.production.info('Obteniendo información del lote', { productionId })

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

    if (result.rows[0]) {
      logger.production.info('Información del lote obtenida exitosamente', { productionId })
    } else {
      logger.production.warn('Información del lote no encontrada', { productionId })
    }

    return result.rows[0]
  } catch (error) {
    logger.production.error('Error obteniendo información del lote', {
      productionId,
      error: error.message
    })
    throw error
  }
}

/**
 * Retrieves complete traceability information for a production batch by unique code.
 * Includes batch details, crop info, producer info, activities, and cost summaries.
 * @param {string} uniqueCode - The unique code of the production batch.
 * @returns {Promise<object>} Complete traceability object with batch, crop, producer, activities, and summary data.
 * @throws {NotFoundError} If the unique code is not found.
 * @throws {Error} If there's a database error.
 */
async function getTraceabilityByUniqueCode (uniqueCode) {
  try {
    logger.production.info('Obteniendo trazabilidad por código único', { uniqueCode })

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
      logger.production.warn('Código de trazabilidad no encontrado', { uniqueCode })
      throw new NotFoundError('Código de trazabilidad no encontrado')
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

    logger.production.info('Trazabilidad obtenida exitosamente', {
      uniqueCode,
      hasActivities,
      totalActivities: activities.length
    })

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
    logger.production.error('Error obteniendo trazabilidad', {
      uniqueCode,
      error: error.message
    })
    throw error
  }
}

/**
 * Generates or retrieves QR code for a production batch
 * Forces QR generation if it doesn't exist
 * @param {number} productionId - The ID of the production batch
 * @returns {Promise<object>} QR code data
 * @throws {NotFoundError} If production batch not found
 */
async function generateOrGetQRCode (productionId) {
  try {
    logger.production.info('Generando o obteniendo código QR para el lote', { productionId })

    // Verify if batch exists
    const batchExists = await pool.query({
      text: 'SELECT unique_code FROM production_batch WHERE production_id = $1',
      values: [productionId]
    })

    if (batchExists.rows.length === 0) {
      logger.production.warn('Lote de producción no encontrado para generación de QR', { productionId })
      throw new NotFoundError('Production batch not found')
    }

    // Verify if QR exists
    const existingQRQuery = await pool.query({
      text: 'SELECT * FROM qr_lote WHERE production_id = $1',
      values: [productionId]
    })

    if (existingQRQuery.rows.length > 0 && existingQRQuery.rows[0].qr_code) {
      logger.production.info('Código QR existente obtenido', { productionId })
      return existingQRQuery.rows[0]
    }

    // If not, generate new QR
    logger.production.info('Código QR no encontrado, generando uno nuevo', { productionId })
    const newQR = await updateBatchQRCode(productionId)
    logger.production.info('Código QR generado exitosamente', { productionId })
    return newQR
  } catch (error) {
    logger.production.error('Error generando o obteniendo código QR para el lote', {
      productionId,
      error: error.message
    })
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
  getTraceabilityByUniqueCode,
  generateOrGetQRCode
}
