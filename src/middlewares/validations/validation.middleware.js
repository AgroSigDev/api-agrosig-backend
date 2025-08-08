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

async function validateLocationPlot (location) {
  const locationRegex = /^[a-zA-Z0-9\s,.'-]{3,}$/
  if (!locationRegex.test(location)) {
    throw new Error('Invalid location format')
  }
}

async function validateArea (area) {
  if (isNaN(area) || area <= 0) {
    throw new Error('Area must be a positive number')
  }
}

export {
  validFieldsRegister,
  validateFieldsLogin,
  vaidateStringLength,
  validateEmialFormart,
  validFieldsRegisterPlot,
  validateLocationPlot,
  validateArea
}
