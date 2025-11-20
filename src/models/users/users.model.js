import { pool } from '../../lib/db.js'
import {
  vaidateStringLength,
  hashPassword,
  comparePasswords
} from '../../middlewares/index.js'

/**
 * Retrieves a user from the database by their user ID.
 *
 * @async
 * @function getUserById
 * @param {number|string} userId - The unique identifier of the user to retrieve.
 * @returns {Promise<Object|null>} Resolves with the user object if found, or null if not found.
 * @throws {Error} Throws an error if the database query fails.
 */

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

/**
 * Retrieves all users from the database.
 *
 * @async
 * @function getAllUsers
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of user objects.
 * @throws {Error} Throws an error if the database query fails.
 */

async function getAllUsers () {
  try {
    const query = {
      text: `
        SELECT 
          u.user_id,
          u.first_name,
          u.paternal_surname,
          u.maternal_surname,
          u.email,
          u.image_user,
          u.is_active,
          u.role_id,
          u.created_at,
          u.updated_at,
          r.name as role_name
        FROM users u
        JOIN role r ON u.role_id = r.role_id
        ORDER BY u.created_at DESC
      `
    }
    const result = await pool.query(query)
    return result.rows
  } catch (error) {
    console.error('Error getting all users:', error)
    throw error
  }
}

// crear la funcion para actuaizar el usuario por id
/**
 * Updates a user's information by their user ID.
 *
 * @async
 * @function
 * @param {number|string} userId - The unique identifier of the user to update.
 * @param {Object} userData - An object containing the user's updated data.
 * @param {string} userData.first_name - The user's updated first name.
 * @param {string} userData.paternal_surname - The user's updated paternal surname.
 * @param {string} userData.maternal_surname - The user's updated maternal surname.
 * @param {string} userData.email - The user's updated email address.
 * @returns {Promise<Object>} The updated user object.
 * @throws {Error} If the user is not found or the email already exists.
 */

async function updateUserById (userId, userData) {
  try {
    const existingUser = await getUserById(userId)
    if (!existingUser) {
      throw new Error('User not found')
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
/**
 * Updates a user's password after validating the old password, ensuring the new password is different,
 * and confirming the new password matches the repeated password. Throws errors for invalid input or failed validation.
 *
 * @async
 * @function updateUserPassword
 * @param {string|number} userId - The ID of the user whose password is to be updated.
 * @param {string} oldPassword - The user's current password.
 * @param {string} newPassword - The new password to set.
 * @param {string} repeatedPassword - The repeated new password for confirmation.
 * @returns {Promise<Object>} The updated user object.
 * @throws {Error} If any validation fails or the update operation encounters an error.
 */

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

/**
 * Updates the image path of a user by their ID.
 *
 * @async
 * @function updateImageUserById
 * @param {string|number} userId - The unique identifier of the user.
 * @param {string} nweImagePath - The new image path to set for the user.
 * @returns {Promise<{user: Object, oldImagePath: string|null}>} An object containing the updated user and the previous image path.
 * @throws {Error} If the user is not found or if there is a database error.
 */

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

/**
 * Retrieves a user from the database by their email address.
 *
 * @async
 * @function getUserByEmail
 * @param {string} email - The email address of the user to retrieve.
 * @returns {Promise<Object|null>} Resolves with the user object if found, or null if not found.
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
 * Updates the active status of a user by their user ID.
 *
 * @async
 * @function updateStatus
 * @param {number|string} userId - The unique identifier of the user.
 * @param {boolean} isActive - The new active status to set for the user.
 * @returns {Promise<Object>} The updated user object.
 * @throws {Error} Throws an error if the database query fails.
 */

async function updateStatus (userId, isActive) {
  try {
    const query = {
      text: 'UPDATE users SET is_active = $1, updated_at = now() WHERE user_id = $2 RETURNING *',
      values: [isActive, userId]
    }
    const result = await pool.query(query)
    return result.rows[0]
  } catch (error) {
    console.log('Error updating status: ', error)
    throw error
  }
}

/**
 * Deletes a user from the database by their user ID.
 *
 * @async
 * @function deleteUserById
 * @param {number|string} userId - The unique identifier of the user to delete.
 * @throws {Error} If the user is not found or if a database error occurs.
 * @returns {Promise<void>} Resolves when the user is successfully deleted.
 */

async function deleteUserById (userId) {
  try {
    const existingUser = await getUserById(userId)
    if (!existingUser) {
      throw new Error('User not found')
    }

    const query = {
      text: 'UPDATE users SET is_active = false WHERE user_id = $1',
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
  updateStatus,
  deleteUserById
}
