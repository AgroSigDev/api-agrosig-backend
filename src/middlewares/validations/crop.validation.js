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

export {
  validFieldsRegisterCrop
}
