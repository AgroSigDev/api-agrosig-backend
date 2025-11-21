import { pool } from '../../lib/db.js'
import {
  vaidateStringLength,
  hashPassword,
  comparePasswords
} from '../../middlewares/index.js'
import { NotFoundError, InternalServerError, ConflictError, ValidationError } from '../../lib/api.errors.js'
import { logger } from '../../utils/logger.utils.js'

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
    logger.users.info('Obteniendo usuario por ID', { userId })

    const query = {
      text: 'SELECT * FROM users WHERE user_id = $1',
      values: [userId]
    }
    const result = await pool.query(query)

    if (result.rows[0]) {
      logger.users.info('Usuario encontrado por ID', {
        userId,
        email: result.rows[0].email
      })
    } else {
      logger.users.warn('Usuario no encontrado por ID', { userId })
    }

    return result.rows[0]
  } catch (error) {
    logger.users.error('Error obteniendo usuario por ID', {
      userId,
      error: error.message
    })
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
    logger.users.info('Obteniendo todos los usuarios')

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

    logger.users.info('Todos los usuarios obtenidos exitosamente', {
      total: result.rows.length
    })

    return result.rows
  } catch (error) {
    logger.users.error('Error obteniendo todos los usuarios', {
      error: error.message
    })
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
    logger.users.info('Iniciando actualización de perfil de usuario', {
      userId,
      camposActualizados: Object.keys(userData)
    })

    const existingUser = await getUserById(userId)
    if (!existingUser) {
      logger.users.warn('Usuario no encontrado para actualización', { userId })
      throw new NotFoundError('User not found')
    }

    const query = {
      text: 'UPDATE users SET first_name = $1, paternal_surname = $2, maternal_surname = $3, email = $4 WHERE user_id = $5 RETURNING *',
      values: [userData.first_name, userData.paternal_surname, userData.maternal_surname, userData.email, userId]
    }
    const result = await pool.query(query)

    logger.users.info('Perfil de usuario actualizado exitosamente', {
      userId,
      email: result.rows[0].email
    })

    return result.rows[0]
  } catch (error) {
    logger.users.error('Error actualizando perfil de usuario', {
      userId,
      error: error.message
    })

    if (error instanceof NotFoundError) throw error
    throw new InternalServerError('Error updating user by ID', { original: error.message })
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
    logger.users.info('Iniciando actualización de contraseña', { userId })

    if (!oldPassword || !newPassword || !repeatedPassword) {
      logger.users.warn('Campos faltantes en actualización de contraseña', { userId })
      throw new ValidationError('Todos los campos son requeridos')
    }

    const existingUser = await getUserById(userId)
    if (!existingUser) {
      logger.users.warn('Usuario no encontrado para actualizar contraseña', { userId })
      throw new NotFoundError('User not found')
    }

    const isOldPasswordValid = await comparePasswords(oldPassword, existingUser.password)
    if (!isOldPasswordValid) {
      logger.users.warn('Contraseña actual incorrecta', { userId })
      throw new ConflictError('The current password is incorrect')
    }

    const isSamePassword = await comparePasswords(newPassword, existingUser.password)
    if (isSamePassword) {
      logger.users.warn('Nueva contraseña igual a la actual', { userId })
      throw new ConflictError('The new password cannot be the same as the current password')
    }

    if (newPassword !== repeatedPassword) {
      logger.users.warn('Las contraseñas nuevas no coinciden', { userId })
      throw new ConflictError('The new password do not match')
    }

    await vaidateStringLength(newPassword)

    const hashedPassword = await hashPassword(newPassword)

    const query = {
      text: 'UPDATE users SET password = $1 WHERE user_id = $2 RETURNING *',
      values: [hashedPassword, userId]
    }
    const result = await pool.query(query)

    logger.users.info('Contraseña actualizada exitosamente', { userId })

    return result.rows[0]
  } catch (error) {
    logger.users.error('Error actualizando contraseña', {
      userId,
      error: error.message
    })

    if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof ConflictError) {
      throw error
    }
    throw new InternalServerError('Error updating user password', { original: error.message })
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

async function updateImageUserById (userId, newImagePath) {
  try {
    logger.users.info('Iniciando actualización de imagen de perfil', {
      userId,
      nuevaImagen: newImagePath
    })

    const existingUser = await getUserById(userId)
    if (!existingUser) {
      logger.users.warn('Usuario no encontrado para actualizar imagen', { userId })
      throw new NotFoundError('User not found')
    }

    const query = {
      text: 'UPDATE users SET image_user = $1, updated_at = now() WHERE user_id = $2 RETURNING *',
      values: [newImagePath, userId]
    }
    const result = await pool.query(query)

    logger.users.info('Imagen de perfil actualizada exitosamente', {
      userId,
      imagenAnterior: existingUser.image_user,
      nuevaImagen: newImagePath
    })

    return {
      user: result.rows[0],
      oldImagePath: existingUser.image_user || null
    }
  } catch (error) {
    logger.users.error('Error actualizando imagen de perfil', {
      userId,
      error: error.message
    })

    if (error instanceof NotFoundError) throw error
    throw new InternalServerError('Error updating image', { original: error.message })
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
    logger.users.info('Buscando usuario por email', { email })

    const query = {
      text: 'SELECT * FROM users WHERE email = $1',
      values: [email]
    }
    const result = await pool.query(query)

    if (result.rows[0]) {
      logger.users.info('Usuario encontrado por email', {
        email,
        userId: result.rows[0].user_id
      })
    } else {
      logger.users.info('Usuario no encontrado por email', { email })
    }

    return result.rows[0]
  } catch (error) {
    logger.users.error('Error obteniendo usuario por email', {
      email,
      error: error.message
    })
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
    logger.users.info('Actualizando estado de usuario', {
      userId,
      nuevoEstado: isActive
    })

    const existingUser = await getUserById(userId)
    if (!existingUser) {
      logger.users.warn('Usuario no encontrado para actualizar estado', { userId })
      throw new NotFoundError('User not found')
    }

    const query = {
      text: 'UPDATE users SET is_active = $1, updated_at = now() WHERE user_id = $2 RETURNING *',
      values: [isActive, userId]
    }
    const result = await pool.query(query)

    logger.users.info('Estado de usuario actualizado exitosamente', {
      userId,
      estadoAnterior: existingUser.is_active,
      nuevoEstado: isActive
    })

    return result.rows[0]
  } catch (error) {
    logger.users.error('Error actualizando estado de usuario', {
      userId,
      error: error.message
    })

    if (error instanceof NotFoundError) throw error
    throw new InternalServerError('Error updating status', { original: error.message })
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
    logger.users.info('Iniciando eliminación lógica de usuario', { userId })

    const existingUser = await getUserById(userId)
    if (!existingUser) {
      logger.users.warn('Usuario no encontrado para eliminar', { userId })
      throw new NotFoundError('User not found')
    }

    const query = {
      text: 'UPDATE users SET is_active = false WHERE user_id = $1',
      values: [userId]
    }
    await pool.query(query)

    logger.users.info('Usuario desactivado exitosamente', { userId })
  } catch (error) {
    logger.users.error('Error eliminando usuario', {
      userId,
      error: error.message
    })

    if (error instanceof NotFoundError) throw error
    throw new InternalServerError('Error deleting by user', { original: error.message })
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
