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
    await validFieldsRegister(user)

    const existingUser = await getUserByEmail(user.email)

    if (existingUser) {
      throw new Error('User already exists')
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

    const group = {
      result: result.rows[0],
      token
    }

    return group
  } catch (error) {
    console.error('Error registering user:', error)
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
  await validateFieldsLogin(user)

  const foundUser = await getUserByEmail(user.email)

  if (!foundUser) {
    throw new Error('User not found')
  }

  if (foundUser.google_id) {
    throw new Error('The email is already linked to this Google account')
  }

  if (!foundUser.is_active) {
    throw new Error('User is not active, please request reactivation from an administrator.')
  }

  const isPasswordValidate = await comparePasswords(
    user.password,
    foundUser.password
  )

  if (!isPasswordValidate) {
    throw new Error('Invalid password')
  }

  const token = generateAuthToken(foundUser)
  const refreshToken = generateRefreshToken(foundUser)

  await saveRefreshToken(foundUser.user_id, refreshToken)

  return {
    user: foundUser,
    token,
    refreshToken
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
    return result.rows[0]
  } catch (error) {
    console.error('Error getting user by email:', error)
    throw error
  }
}

/**
 * Guarda un refresh token en la base de datos.
 */
async function saveRefreshToken (userId, refreshToken) {
  const query = {
    text: 'INSERT INTO tokens (user_id, refresh_token) VALUES ($1, $2)',
    values: [userId, refreshToken]
  }
  await pool.query(query)
}

/**
 * Revoca (invalida) un refresh token en la base de datos.
 */
async function revokeRefreshToken (refreshToken) {
  const query = {
    text: 'UPDATE tokens SET is_revoked = true WHERE refresh_token = $1',
    values: [refreshToken]
  }
  await pool.query(query)
}

/**
 * Verifica si un refresh token fue revocado.
 */
async function isRefreshTokenRevoked (refreshToken) {
  const query = {
    text: 'SELECT is_revoked FROM tokens WHERE refresh_token = $1',
    values: [refreshToken]
  }
  const result = await pool.query(query)
  return result.rows.length > 0 && result.rows[0].is_revoked === true
}

/**
 * Cierra sesión revocando el refresh token
 */
async function logoutUser (refreshToken) {
  await revokeRefreshToken(refreshToken)
  return { message: 'Logout successful. Tokens revoked.' }
}

/**
 * Verifica si un refresh token es válido y no está revocado
 */
async function validateRefreshToken (refreshToken) {
  const revoked = await isRefreshTokenRevoked(refreshToken)
  if (revoked) throw new Error('Refresh token has been revoked')
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
