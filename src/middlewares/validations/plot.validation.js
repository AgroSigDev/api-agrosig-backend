import { ValidationError } from '../../lib/api.errors.js'
import { logger } from '../../utils/logger.utils.js'

/**
 * Validates that the required fields for registering a plot are present.
 *
 * @async
 * @param {Object} plot - The plot object to validate.
 * @param {string} plot.plot_name - The name of the plot.
 * @param {string} plot.location - The location of the plot.
 * @param {number} plot.area - The area of the plot.
 * @throws {Error} Throws an error if any required field is missing.
 */

async function validFieldsRegisterPlot (plot) {
  if (
    !plot.plot_name ||
    !plot.location ||
    !plot.area
  ) {
    logger.validation.warn('Campos faltantes en registro de parcela', {
      camposRecibidos: Object.keys(plot),
      camposFaltantes: ['plot_name', 'location', 'area'].filter(field => !plot[field])
    })
    throw new ValidationError('There are missing fields to submit in the application')
  }
  logger.validation.info('Validación de campos de registro de parcela exitosa', { plot_name: plot.plot_name })
}

/**
 * Validates the format of a location string for a plot.
 * The location must be at least 3 characters long and can contain
 * letters, numbers, spaces, commas, periods, apostrophes, and hyphens.
 *
 * @async
 * @param {string} location - The location string to validate.
 * @throws {Error} Throws an error if the location format is invalid.
 */

async function validateLocationPlot (location) {
  const locationRegex = /^[a-zA-Z0-9\s,.'-]{3,}$/
  if (!locationRegex.test(location)) {
    logger.validation.warn('Formato de ubicación inválido', { location })
    throw new ValidationError('Invalid location format')
  }
  logger.validation.info('Validación de formato de ubicación exitosa', { location })
}

/**

Validates the latitude and longitude coordinates for a plot.
Ensures that latitude is between -90 and 90 degrees, longitude is between -180 and 180 degrees,
and both are valid numeric values.
@async
@param {number|string} latitude - The latitude value to validate (must be convertible to a number).
@param {number|string} longitude - The longitude value to validate (must be convertible to a number).
@returns {boolean} True if both coordinates are valid numbers within the specified ranges.
@throws {Error} Throws 'Invalid latitude' if latitude is outside the range -90 to 90.
@throws {Error} Throws 'Invalid longitude' if longitude is outside the range -180 to 180.
*/

async function validCoordinates (latitude, longitude) {
  const lat = parseFloat(latitude)
  const lon = parseFloat(longitude)
  if (lat < -90 || lat > 90) {
    logger.validation.warn('Latitud inválida', { latitude: lat })
    throw new ValidationError('Invalid latitude')
  }

  if (lon < -180 || lon > 180) {
    logger.validation.warn('Longitud inválida', { longitude: lon })
    throw new ValidationError('Invalid longitude')
  }
  return !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180
}

/**
 * Validates that the provided area is a positive number.
 * Throws an error if the area is not a number or is less than or equal to zero.
 *
 * @async
 * @param {number} area - The area value to validate.
 * @throws {Error} If the area is not a positive number.
 */

async function validateArea (area) {
  if (isNaN(area) || area <= 0) {
    logger.validation.warn('Área inválida', { area })
    throw new ValidationError('Area must be a positive number')
  }
  logger.validation.info('Validación de área exitosa', { area })
}

export {
  validFieldsRegisterPlot,
  validateLocationPlot,
  validCoordinates,
  validateArea
}
