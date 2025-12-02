import { ValidationError } from '../../lib/api.errors.js'
import { logger } from '../../utils/logger.utils.js'

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
  if (!user.first_name || !user.paternal_surname || !user.maternal_surname || !user.email || !user.password) {
    logger.validation.warn('Campos faltantes en registro', {
      camposRecibidos: Object.keys(user),
      camposFaltantes: ['first_name', 'paternal_surname', 'maternal_surname', 'email', 'password'].filter(field => !user[field])
    })
    throw new ValidationError('Faltan campos por enviar en la solicitud')
  }
  logger.validation.info('Validación de campos de registro exitosa', { email: user.email })
}

/**
 * Validates that all required user profile update fields are present.
 * Throws an error if any required field is missing.
 *
 * @async
 * @param {Object} user - The user object to validate.
 * @param {string} user.first_name - The user's first name.
 * @param {string} user.paternal_surname - The user's paternal surname.
 * @param {string} user.maternal_surname - The user's maternal surname.
 * @param {string} user.email - The user's email address.
 * @throws {Error} If any required field is missing.
 */
async function validFieldsUpdateProfile (user) {
  if (!user.first_name || !user.paternal_surname || !user.maternal_surname || !user.email) {
    logger.validation.warn('Campos faltantes en actualización de perfil', {
      camposRecibidos: Object.keys(user),
      camposFaltantes: ['first_name', 'paternal_surname', 'maternal_surname', 'email'].filter(field => !user[field])
    })
    throw new ValidationError('Faltan campos por enviar en la solicitud')
  }

  // Validar formato de email
  await validateEmialFormart(user.email)

  logger.validation.info('Validación de campos de actualización de perfil exitosa', { email: user.email })
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
    logger.validation.warn('Campos faltantes en login', {
      camposRecibidos: Object.keys(user)
    })
    throw new ValidationError('Faltan campos por enviar en la solicitud')
  }
  logger.validation.info('Validación de campos de login exitosa', { email: user.email })
}

/**

Validates that the provided password string has a minimum length of 8 characters.
Throws an error if the password is too short.
@async
@param {string} password - The password string to validate.
@throws {Error} If the password is less than 8 characters long.
*/

async function vaidateStringLength (password) {
  if (password.length < 8) {
    logger.validation.warn('Contraseña demasiado corta', {
      longitud: password.length
    })
    throw new ValidationError('La contraseña debe tener al menos 8 caracteres')
  }
  logger.validation.info('Validación de longitud de contraseña exitosa')
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
    logger.validation.warn('Formato de email inválido', { email })
    throw new ValidationError('Formato de email inválido')
  }
  logger.validation.info('Validación de formato de email exitosa', { email })
}

export {
  validFieldsRegister,
  validFieldsUpdateProfile,
  validateFieldsLogin,
  vaidateStringLength,
  validateEmialFormart
}
