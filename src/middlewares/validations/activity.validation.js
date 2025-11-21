import { ValidationError } from '../../lib/api.errors.js'
import { logger } from '../../utils/logger.utils.js'

/**
 * Validates that all required fields are present in the activity object.
 * Throws an error if any required field is missing.
 *
 * @async
 * @param {Object} activity - The activity object to validate.
 * @param {string} activity.activity_type - The type of activity.
 * @param {string|Date} activity.date - The date of the activity.
 * @param {string} activity.description - The description of the activity.
 * @throws {Error} If any required field is missing.
 */
async function validateActivity (activity) {
  if (!activity.activity_type || !activity.date || !activity.description) {
    logger.warn('Validación de actividad fallida - campos faltantes', { activity })
    throw new ValidationError('There are missing fields to submit in the application', {
      missingFields: {
        activity_type: !activity.activity_type,
        date: !activity.date,
        description: !activity.description
      },
      received: activity
    })
  }

  // Validación adicional para el tipo de actividad
  if (typeof activity.activity_type !== 'string' || activity.activity_type.trim().length === 0) {
    logger.warn('Validación de actividad fallida - tipo de actividad inválido', { activity })
    throw new ValidationError('Activity type must be a non-empty string', {
      field: 'activity_type',
      value: activity.activity_type
    })
  }

  // Validación adicional para la descripción
  if (typeof activity.description !== 'string' || activity.description.trim().length === 0) {
    logger.warn('Validación de actividad fallida - descripción inválida', { activity })
    throw new ValidationError('Description must be a non-empty string', {
      field: 'description',
      value: activity.description
    })
  }

  logger.debug('Validación de actividad exitosa', { activityType: activity.activity_type })
}

/**
 * Validates the fields of an input used object.
 * Throws an error if any required field is missing or invalid.
 *
 * @param {Object} inputUsed - The input used object to validate.
 * @param {string} inputUsed.input_name - The name of the input.
 * @param {string} inputUsed.unit - The unit of measurement.
 * @param {number} inputUsed.quantity - The quantity used (must be greater than or equal to 0).
 * @param {number} inputUsed.unit_cost - The cost per unit (must be greater than or equal to 0).
 * @throws {Error} If any required field is missing or invalid.
 */
async function validateInputUsed (inputUsed) {
  // Validar campos requeridos
  if (
    !inputUsed.input_name ||
    !inputUsed.unit ||
    inputUsed.quantity === undefined ||
    inputUsed.quantity === null ||
    inputUsed.unit_cost === undefined ||
    inputUsed.unit_cost === null
  ) {
    logger.warn('Validación de insumo fallida - campos faltantes', { inputUsed })
    throw new ValidationError('There are missing fields to submit in the application', {
      missingFields: {
        input_name: !inputUsed.input_name,
        unit: !inputUsed.unit,
        quantity: inputUsed.quantity === undefined || inputUsed.quantity === null,
        unit_cost: inputUsed.unit_cost === undefined || inputUsed.unit_cost === null
      },
      received: inputUsed
    })
  }

  // Validar que quantity y unit_cost sean números válidos y no negativos
  if (
    isNaN(parseFloat(inputUsed.quantity)) ||
    parseFloat(inputUsed.quantity) < 0 ||
    isNaN(parseFloat(inputUsed.unit_cost)) ||
    parseFloat(inputUsed.unit_cost) < 0
  ) {
    logger.warn('Validación de insumo fallida - valores numéricos inválidos', { inputUsed })
    throw new ValidationError('Quantity and unit cost must be valid non-negative numbers', {
      quantity: inputUsed.quantity,
      unit_cost: inputUsed.unit_cost
    })
  }

  // Validar que input_name sea un string no vacío
  if (typeof inputUsed.input_name !== 'string' || inputUsed.input_name.trim().length === 0) {
    logger.warn('Validación de insumo fallida - nombre de insumo inválido', { inputUsed })
    throw new ValidationError('Input name must be a non-empty string', {
      field: 'input_name',
      value: inputUsed.input_name
    })
  }

  logger.debug('Validación de insumo exitosa', { inputName: inputUsed.input_name })
}

/**
 * Validates that the provided inputs array is non-empty and that each input passes the `validateInputUsed` check.
 * Throws an error if the inputs array is empty or not an array.
 *
 * @async
 * @param {Array} inputs - The array of input objects to validate.
 * @throws {Error} If inputs is not a non-empty array or if any input fails validation.
 */
async function validateInputsArray (inputs) {
  if (!Array.isArray(inputs)) {
    logger.warn('Validación de array de insumos fallida - no es un array')
    throw new ValidationError('Inputs must be an array', {
      received: typeof inputs
    })
  }

  // Permite actividades sin insumos (como riego con agua gratuita)
  if (inputs.length === 0) {
    logger.debug('Array de insumos vacío - permitido para ciertos tipos de actividad')
    return
  }

  for (const input of inputs) {
    await validateInputUsed(input)
  }

  logger.debug('Validación de array de insumos exitosa', { count: inputs.length })
}

export {
  validateActivity,
  validateInputUsed,
  validateInputsArray
}
