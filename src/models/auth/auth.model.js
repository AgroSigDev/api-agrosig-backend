import { pool } from '../../lib/db.js'
import {
  validFieldsRegister,
  vaidateStringLength,
  validateEmialFormart,
  hashPassword
} from '../../middlewares/index.js'
import { generateAuthToken } from '../../utils/token.utils.js'

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
export const Auth = {
  registerUser,
  getUserByEmail
}
