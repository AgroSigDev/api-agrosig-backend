import { ValidationError } from '../../lib/api.errors.js'
import { logger } from '../../utils/logger.utils.js'

/**
 * Validates the required fields of a crop object.
 * Throws an error if any required field is missing.
 *
 * @async
 * @param {Object} crop - The crop object to validate.
 * @param {string} crop.crop_type - The type of the crop.
 * @param {string} crop.crop_variety - The variety of the crop.
 * @param {string|Date} crop.planting_date - The planting date of the crop.
 * @param {string|Date} crop.harvest_date - The harvest date of the crop.
 * @throws {Error} If any required field is missing.
 */

async function validFieldsRegisterCrop (crop) {
  if (
    !crop.crop_type ||
    !crop.crop_variety ||
    !crop.planting_date ||
    !crop.harvest_date
  ) {
    logger.validation.warn('Campos faltantes en registro de cultivo', {
      camposRecibidos: Object.keys(crop),
      camposFaltantes: ['crop_type', 'crop_variety', 'planting_date', 'harvest_date'].filter(field => !crop[field])
    })
    throw new ValidationError('Faltan campos por enviar en la solicitud')
  }
  logger.validation.info('Validación de campos de registro de cultivo exitosa', { crop_type: crop.crop_type })
}

export {
  validFieldsRegisterCrop
}
