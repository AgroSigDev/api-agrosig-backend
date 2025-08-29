/**
 * Validates that all required user registration fields are present.
 * Throws an error if any required field is missing.
 *
 * @async
 * @param {Object} user - The user object to validate.
 * @param {string} user.first_name - The user's first name.
 * @param {string} user.paternal_surname - The user's paternal surname.
 * @param {string} user.maternal_surname - The user's maternal surname.
 * @param {string} user.email - The user's email address.
 * @param {string} user.password - The user's password.
 * @throws {Error} If any required field is missing.
 */

async function validFieldsRegister (user) {
  if (
    !user.first_name ||
    !user.paternal_surname ||
    !user.maternal_surname ||
    !user.email ||
    !user.password
  ) {
    console.error('Missing fields in user registration:', user)
    throw new Error('There are missing fields to submit in the application')
  }
}

/**
 * Validates that the provided password string has a minimum length of 8 characters.
 * Throws an error if the password is too short.
 *
 * @async
 * @param {string} password - The password string to validate.
 * @throws {Error} If the password is less than 8 characters long.
 */

async function validateFieldsLogin (user) {
  if (!user.email || !user.password) {
    throw new Error('There are missing fields to submit in the application')
  }
}

async function vaidateStringLength (password) {
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long')
  }
}

/**
 * Validates the format of an email address.
 * Throws an error if the email format is invalid.
 *
 * @async
 * @param {string} email - The email address to validate.
 * @throws {Error} If the email format is invalid.
 */

async function validateEmialFormart (email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format')
  }
}

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
    console.error('Missing fields in crop registration:', crop)
    throw new Error('There are missing fields to submit in the application')
  }
}

/**
 * Validates that all required fields are present in the activity object.
 * Throws an error if any required field is missing.
 *
 * @async
 * @param {Object} activity - The activity object to validate.
 * @param {string} activity.activity_type - The type of activity.
 * @param {string|Date} activity.date - The date of the activity.
 * @param {string} activity.description - The description of the activity.
 * @param {string} activity.input_name - The name of the input.
 * @param {string} activity.unit - The unit of measurement.
 * @param {number} activity.quantity - The quantity used.
 * @param {number} activity.unit_cost - The cost per unit.
 * @throws {Error} If any required field is missing.
 */

async function validateActivity (activity) {
  if (
    !activity.activity_type ||
    !activity.date ||
    !activity.description ||
    !activity.input_name ||
    !activity.unit ||
    !activity.quantity ||
    !activity.unit_cost
  ) {
    console.error('Missing fields in activity registration:', activity)
    throw new Error('There are missing fields to submit in the application')
  }
}

export {
  validFieldsRegister,
  validateFieldsLogin,
  vaidateStringLength,
  validateEmialFormart,
  validFieldsRegisterPlot,
  validateLocationPlot,
  validCoordinates,
  validateArea,
  validFieldsRegisterCrop,
  validateActivity
}
