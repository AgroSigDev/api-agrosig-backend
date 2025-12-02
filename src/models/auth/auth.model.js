import { pool } from '../../lib/db.js'
import {
  validFieldsRegister,
  vaidateStringLength,
  validateEmialFormart,
  hashPassword,
  validateFieldsLogin,
  comparePasswords
} from '../../middlewares/index.js'
import { generateAuthToken, generateRefreshToken } from '../../utils/token.utils.js'
import { NotFoundError, AuthError, ForbiddenError, ValidationError, InternalServerError, ConflictError } from '../../lib/api.errors.js'
import { logger } from '../../utils/logger.utils.js'

/**
 * Registers a new user in the system.
 *
 * Validates the provided user fields, checks for existing users by email,
 * validates password length and email format, hashes the password, and inserts
 * the new user into the database. Returns the registered user data and an authentication token.
 *
 * @async
 * @param {Object} user - The user data to register.
 * @param {string} user.first_name - The user's first name.
 * @param {string} user.paternal_surname - The user's paternal surname.
 * @param {string} user.maternal_surname - The user's maternal surname.
 * @param {string} user.email - The user's email address.
 * @param {string} user.password - The user's password.
 * @param {string} [user.image_user] - The user's profile image (optional).
 * @returns {Promise<{result: Object, token: string}>} The registered user data and authentication token.
 * @throws {Error} If validation fails or the user already exists.
 */

async function registerUser (user) {
  try {
    logger.auth.info('Iniciando registro de usuario', { email: user.email })

    await validFieldsRegister(user)

    const existingUser = await getUserByEmail(user.email)

    if (existingUser) {
      logger.auth.warn('Intento de registro con email existente', { email: user.email })
      throw new ConflictError('Ya existe un usuario con este correo electrónico')
    }

    await vaidateStringLength(user.password)
    await validateEmialFormart(user.email)

    const hashedPassword = await hashPassword(user.password)

    const registerQuery = {
      text: `INSERT INTO users (role_id, first_name, paternal_surname, maternal_surname, email, password, image_user, configured_plot, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
      values: [
        '2',
        user.first_name,
        user.paternal_surname,
        user.maternal_surname,
        user.email,
        hashedPassword,
        user.image_user || null,
        false,
        true
      ]
    }

    const result = await pool.query(registerQuery)
    const token = generateAuthToken(result.rows[0])

    logger.auth.info('Usuario registrado exitosamente', {
      userId: result.rows[0].user_id,
      email: user.email
    })

    return {
      result: result.rows[0],
      token
    }
  } catch (error) {
    logger.auth.error('Error en registro de usuario', {
      email: user.email,
      error: error.message
    })
    throw error
  }
}

/**
 * Authenticates a user by validating login fields, checking user existence,
 * verifying account status, and comparing passwords.
 * Generates and returns authentication and refresh tokens upon successful login.
 *
 * @async
 * @param {Object} user - The user login data.
 * @param {string} user.email - The user's email address.
 * @param {string} user.password - The user's password.
 * @returns {Promise<Object>} An object containing the authentication token and refresh token.
 * @throws {Error} Throws errors for missing fields, user not found, linked Google account,
 * inactive user, or invalid password.
 */

async function loginUser (user) {
  try {
    logger.auth.info('Iniciando proceso de login', { email: user.email })

    await validateFieldsLogin(user)

    const foundUser = await getUserByEmail(user.email)

    if (!foundUser) {
      logger.auth.warn('Usuario no encontrado en login', { email: user.email })
      throw new NotFoundError('Usuario no encontrado')
    }

    if (foundUser.google_id) {
      logger.auth.warn('Intento de login con cuenta de Google', { email: user.email })
      throw new AuthError('El correo electrónico ya está vinculado a una cuenta de Google')
    }

    if (!foundUser.is_active) {
      logger.auth.warn('Intento de login con usuario inactivo', { email: user.email })
      throw new ForbiddenError('El usuario no está activo, por favor solicite la reactivación a un administrador.')
    }

    const isPasswordValidate = await comparePasswords(user.password, foundUser.password)

    if (!isPasswordValidate) {
      logger.auth.warn('Contraseña incorrecta en login', { email: user.email })
      throw new AuthError('Contraseña inválida')
    }

    const token = generateAuthToken(foundUser)
    const refreshToken = generateRefreshToken(foundUser)

    await saveRefreshToken(foundUser.user_id, refreshToken)

    logger.auth.info('Login exitoso', {
      userId: foundUser.user_id,
      email: user.email
    })

    return {
      user: {
        user_id: foundUser.user_id,
        role_id: foundUser.role_id,
        first_name: foundUser.first_name,
        paternal_surname: foundUser.paternal_surname,
        maternal_surname: foundUser.maternal_surname,
        email: foundUser.email,
        image_user: foundUser.image_user,
        configured_plot: foundUser.configured_plot,
        is_active: foundUser.is_active,
        created_at: foundUser.created_at,
        updated_at: foundUser.updated_at
      },
      token,
      refreshToken
    }
  } catch (error) {
    logger.auth.error('Error en proceso de login', {
      email: user.email,
      error: error.message
    })

    if (error instanceof NotFoundError || error instanceof AuthError || error instanceof ForbiddenError || error instanceof ValidationError) {
      throw error
    }

    throw new InternalServerError('Error al iniciar sesión del usuario', { original: error.message })
  }
}

/**
 * Retrieves a user from the database by their email address.
 *
 * @async
 * @function
 * @param {string} email - The email address of the user to retrieve.
 * @returns {Promise<Object|undefined>} A promise that resolves to the user object if found, or undefined if not found.
 * @throws {Error} If there is an error during the database query.
 */

async function getUserByEmail (email) {
  try {
    const query = {
      text: 'SELECT * FROM users WHERE email = $1',
      values: [email]
    }
    const result = await pool.query(query)

    if (result.rows[0]) {
      logger.database.info('Usuario encontrado por email', { email })
    } else {
      logger.database.info('Usuario no encontrado por email', { email })
    }

    return result.rows[0]
  } catch (error) {
    logger.database.error('Error obteniendo usuario por email', {
      email,
      error: error.message
    })
    throw error
  }
}

/**
 * Guarda un refresh token en la base de datos.
 */
async function saveRefreshToken (userId, refreshToken) {
  try {
    const query = {
      text: 'INSERT INTO tokens (user_id, refresh_token) VALUES ($1, $2)',
      values: [userId, refreshToken]
    }
    await pool.query(query)
    logger.database.info('Refresh token guardado', { userId })
  } catch (error) {
    logger.database.error('Error guardando refresh token', {
      userId,
      error: error.message
    })
    throw error
  }
}

/**
 * Revoca (invalida) un refresh token en la base de datos.
 */
async function revokeRefreshToken (refreshToken) {
  try {
    const query = {
      text: 'UPDATE tokens SET is_revoked = true WHERE refresh_token = $1',
      values: [refreshToken]
    }
    await pool.query(query)
    logger.database.info('Refresh token revocado', { refreshToken })
  } catch (error) {
    logger.database.error('Error revocando refresh token', {
      refreshToken,
      error: error.message
    })
    throw error
  }
}

/**
 * Verifica si un refresh token fue revocado.
 */
async function isRefreshTokenRevoked (refreshToken) {
  try {
    const query = {
      text: 'SELECT is_revoked FROM tokens WHERE refresh_token = $1',
      values: [refreshToken]
    }
    const result = await pool.query(query)
    const revoked = result.rows.length > 0 && result.rows[0].is_revoked === true

    if (revoked) {
      logger.database.info('Refresh token está revocado', { refreshToken })
    }

    return revoked
  } catch (error) {
    logger.database.error('Error verificando refresh token revocado', {
      refreshToken,
      error: error.message
    })
    throw error
  }
}

/**
 * Cierra sesión revocando el refresh token
 */
async function logoutUser (refreshToken) {
  try {
    await revokeRefreshToken(refreshToken)
    logger.auth.info('Logout exitoso', { refreshToken })
    return { message: 'Cierre de sesión exitoso. Tokens revocados.' }
  } catch (error) {
    logger.auth.error('Error en logout', {
      refreshToken,
      error: error.message
    })
    throw error
  }
}

/**
 * Verifica si un refresh token es válido y no está revocado
 */
async function validateRefreshToken (refreshToken) {
  try {
    const revoked = await isRefreshTokenRevoked(refreshToken)
    if (revoked) {
      logger.auth.warn('Refresh token revocado', { refreshToken })
      throw new Error('El token de actualización ha sido revocado')
    }
    logger.auth.info('Refresh token válido', { refreshToken })
  } catch (error) {
    logger.auth.error('Error validando refresh token', {
      refreshToken,
      error: error.message
    })
    throw error
  }
}
export const Auth = {
  registerUser,
  loginUser,
  getUserByEmail,
  saveRefreshToken,
  revokeRefreshToken,
  isRefreshTokenRevoked,
  logoutUser,
  validateRefreshToken
}
