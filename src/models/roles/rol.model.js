import { pool } from '../../lib/db.js'

/**
 * Retrieves a user by their user ID, including their role information.
 *
 * @async
 * @function getUserByIdRole
 * @param {number|string} userId - The ID of the user to retrieve.
 * @returns {Promise<Object>} The user object with role information, or undefined if not found.
 * @throws {Error} If there is an error during the database query.
 */

async function getUserByIdRole (userId) {
  try {
    const query = {
      text: 'SELECT u.*, r.role_id AS role_id FROM users u JOIN role r ON u.role_id = r.role_id WHERE u.user_id = $1',
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
 * Retrieves all users from the "role" table in the database.
 *
 * @async
 * @function
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of user objects.
 * @throws Will throw an error if the database query fails.
 */

async function getAllUsers () {
  try {
    const query = {
      text: 'SELECT * from role'
    }
    const result = await pool.query(query)
    return result.rows
  } catch (error) {
    console.error('Error getting all users:', error)
    throw error
  }
}

/**
 * Retrieves a role from the database by its ID.
 *
 * @async
 * @function getRoleBYId
 * @param {number|string} roleId - The unique identifier of the role to retrieve.
 * @returns {Promise<Object|undefined>} The role object if found, otherwise undefined.
 * @throws {Error} If there is an error during the database query.
 */

async function getRoleBYId (roleId) {
  try {
    const query = {
      text: 'SELECT * FROM role WHERE role_id = $1',
      values: [roleId]
    }
    const result = await pool.query(query)
    return result.rows[0]
  } catch (error) {
    console.error('Error getting role by ID:', error)
    throw error
  }
}

/**
 * Updates the role for a user by their ID.
 *
 * @async
 * @function updateRoleById
 * @param {(number|string)} userId - The unique identifier of the user to update.
 * @param {(number|string)} roleId - The identifier of the role to assign to the user.
 * @returns {Promise<Object|undefined>} A promise that resolves to the updated user row (as returned by the database) or undefined if no row was updated.
 * @throws {Error} If a database error occurs while performing the update.
 * @example
 * // Assign role 3 to user 42
 * const updatedUser = await updateRoleById(42, 3);
 */

async function updateRoleById (userId, roleId) {
  try {
    const query = {
      text: 'UPDATE users SET role_id = $1, updated_at = now() WHERE user_id = $2 RETURNING *',
      values: [roleId, userId]
    }
    const result = await pool.query(query)
    return result.rows[0]
  } catch (error) {
    console.error('Error updating role by ID:', error)
    throw error
  }
}

export const Role = {
  getUserByIdRole,
  getAllUsers,
  getRoleBYId,
  updateRoleById
}
