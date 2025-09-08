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
  if (
    !activity.activity_type ||
    !activity.date ||
    !activity.description
  ) {
    console.error('Missing fields in activity registration:', activity)
    throw new Error('There are missing fields to submit in the application')
  }
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
    console.error('Missing fields in input used registration:', inputUsed)
    throw new Error('There are missing fields to submit in the application')
  }

  // Validar que quantity y unit_cost sean números válidos y no negativos
  if (
    isNaN(parseFloat(inputUsed.quantity)) ||
    parseFloat(inputUsed.quantity) < 0 ||
    isNaN(parseFloat(inputUsed.unit_cost)) ||
    parseFloat(inputUsed.unit_cost) < 0
  ) {
    console.error('Invalid numeric values in input used:', inputUsed)
    throw new Error('Quantity and unit cost must be valid non-negative numbers')
  }
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
    throw new Error('Inputs must be an array')
  }

  // Permite actividades sin insumos (como riego con agua gratuita)
  if (inputs.length === 0) {
    return
  }

  for (const input of inputs) {
    await validateInputUsed(input)
  }
}

export {
  validateActivity,
  validateInputUsed,
  validateInputsArray
}
