import { pool } from '../../lib/db.js'

async function createUser (user) {
  try {
    const existingUser = await getUserById(user.email)
    if (existingUser) {
      throw new Error('User already exists')
    }

    const insertQuery = {
      text: `INSERT INTO users (role_id, first_name, paternal_surname, maternal_surname, email, password, image_user, configured_plot, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
      values: [user.google_id, user.role_id, user.first_name, user.paternal_surname, user.maternal_surname, user.email, user.password, user.image_user || null, user.configured_plot, user.is_active]
    }
    const result = await pool.query(insertQuery)
    return result.rows[0]
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

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
  createUser,
  getUserById,
  getAllUsers,
  getUserByEmail,
  deleteUserById
}
