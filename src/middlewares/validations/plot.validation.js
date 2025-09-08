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
    console.error('Missing fields in plot registration:', plot)
    throw new Error('There are missing fields to submit in the application')
  }
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
    throw new Error('Invalid location format')
  }
}

async function validCoordinates (latitude, longitude) {
  const lat = parseFloat(latitude)
  const lon = parseFloat(longitude)
  if (lat < -90 || lat > 90) {
    throw new Error('Invalid latitude')
  }

  if (lon < -180 || lon > 180) {
    throw new Error('Invalid longitude')
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
    throw new Error('Area must be a positive number')
  }
}

export {
  validFieldsRegisterPlot,
  validateLocationPlot,
  validCoordinates,
  validateArea
}
