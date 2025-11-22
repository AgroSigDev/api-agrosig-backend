import { ValidationError } from '../../lib/api.errors.js'
import { logger } from '../../utils/logger.utils.js'

/**
 * Validates production batch data to ensure required fields are present and valid.
 * Checks that the batch name is provided and not empty.
 * @param {object} batchData - The batch data object to validate.
 * @param {string} batchData.name - The name of the production batch (required).
 * @throws {ValidationError} If the name field is missing or empty.
 */
async function validateProductionBatch (batchData) {
  if (
    !batchData.name ||
    batchData.name.trim().length === 0
  ) {
    logger.validation.warn('Campos faltantes en registro de lote de producción', {
      camposRecibidos: Object.keys(batchData),
      camposFaltantes: ['name'].filter(field => !batchData[field])
    })
    throw new ValidationError('Name is required')
  }
  logger.validation.info('Validación de lote de producción exitosa', { name: batchData.name })
}

/**
 * Validates an array of activity IDs for correctness.
 * Ensures the input is an array, contains at least one element, all IDs are positive integers, and there are no duplicates.
 * @param {Array<number>} activityIds - Array of activity IDs to validate.
 * @throws {ValidationError} If activityIds is not an array, is empty, contains invalid IDs, or has duplicates.
 */
async function validateActivityIds (activityIds) {
  if (!Array.isArray(activityIds)) {
    logger.validation.warn('activity_ids no es un array', { activityIds })
    throw new ValidationError('activity_ids debe ser un array')
  }

  if (activityIds.length === 0) {
    logger.validation.warn('Se requiere al menos una actividad', { activityIds })
    throw new ValidationError('Se requiere al menos una actividad')
  }

  // Validar que todos los IDs sean números positivos
  for (const id of activityIds) {
    if (isNaN(parseInt(id)) || parseInt(id) <= 0) {
      logger.validation.warn('ID de actividad inválido', { id, activityIds })
      throw new ValidationError(`ID de actividad inválido: ${id}`)
    }
  }

  // Validar que no haya duplicados
  const uniqueIds = [...new Set(activityIds)]
  if (uniqueIds.length !== activityIds.length) {
    logger.validation.warn('Hay IDs de actividad duplicados', { activityIds, uniqueIds })
    throw new ValidationError('Hay IDs de actividad duplicados')
  }

  logger.validation.info('Validación de IDs de actividad exitosa', { total: activityIds.length })
}

export {
  validateProductionBatch,
  validateActivityIds
}
