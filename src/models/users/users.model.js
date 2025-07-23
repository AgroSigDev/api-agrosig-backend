import { pool } from '../../lib/db.js'
import {
  vaidateStringLength,
  hashPassword,
  comparePasswords
} from '../../middlewares/index.js'

async function getUserById (userId) {
  try {
    const query = {
      text: 'SELECT * FROM users WHERE user_id = $1',
      values: [userId]
    }
    const result = await pool.query(query)
    return result.rows[0]
  } catch (error) {
    console.error('Error getting user by ID:', error)
    throw error
  }
}

async function getAllUsers () {
  try {
    const query = {
      text: 'SELECT * FROM users'
    }
    const result = await pool.query(query)
    return result.rows
  } catch (error) {
    console.error('Error getting all users:', error)
    throw error
  }
}

// crear la funcion para actuaizar el usuario por id
async function updateUserById (userId, userData) {
  try {
    const existingUser = await getUserById(userId)
    if (!existingUser) {
      throw new Error('User not found')
    }

    const existingEmail = await getUserByEmail(userData.email)

    if (existingEmail) {
      throw new Error('Email already exists')
    }

    const query = {
      text: 'UPDATE users SET first_name = $1, paternal_surname = $2, maternal_surname = $3, email = $4 WHERE user_id = $5 RETURNING *',
      values: [userData.first_name, userData.paternal_surname, userData.maternal_surname, userData.email, userId]
    }
    const result = await pool.query(query)
    return result.rows[0]
  } catch (error) {
    console.error('Error updating user by ID:', error)
    throw error
  }
}

// crear la funcion para actuaizar la contraseña del usuario por id
async function updateUserPassword (userId, oldPassword, newPassword, repeatedPassword) {
  try {
    if (!oldPassword || !newPassword || !repeatedPassword) {
      throw new Error('Todos los campos son requeridos')
    }

    const existingUser = await getUserById(userId)
    if (!existingUser) {
      throw new Error('User not found')
    }

    const isOldPasswordValid = await comparePasswords(oldPassword, existingUser.password)

    if (!isOldPasswordValid) {
      throw new Error('The current password is incorrect')
    }

    const isSamePassword = await comparePasswords(newPassword, existingUser.password)

    if (isSamePassword) {
      throw new Error('The new password cannot be the same as the current password')
    }

    if (newPassword !== repeatedPassword) {
      throw new Error('The new password do not match')
    }

    await vaidateStringLength(newPassword)

    const hashedPassword = await hashPassword(newPassword)

    const query = {
      text: 'UPDATE users SET password = $1 WHERE user_id = $2 RETURNING *',
      values: [hashedPassword, userId]
    }
    const result = await pool.query(query)
    return result.rows[0]
  } catch (error) {
    console.error('Error updating user password by ID:', error)
    throw error
  }
}

async function updateImageUserById (userId, nweImagePath) {
  try {
    const existingUser = await getUserById(userId)
    if (!existingUser) {
      throw new Error('User not found')
    }

    const query = {
      text: 'UPDATE users SET image_user = $1, updated_at = now() WHERE user_id = $2 RETURNING *',
      values: [nweImagePath, userId]
    }
    const result = await pool.query(query)
    return {
      user: result.rows[0],
      oldImagePath: existingUser.image_user || null
    }
  } catch (error) {
    console.error('Error updating user image by ID:', error)
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

async function deleteUserById (userId) {
  try {
    const existingUser = await getUserById(userId)
    if (!existingUser) {
      throw new Error('User not found')
    }

    const query = {
      text: 'DELETE FROM users WHERE user_id = $1',
      values: [userId]
    }
    await pool.query(query)
  } catch (error) {
    console.error('Error deleting user by ID:', error)
    throw error
  }
}

export const Users = {
  getUserById,
  getAllUsers,
  updateUserById,
  updateUserPassword,
  updateImageUserById,
  getUserByEmail,
  deleteUserById
}
