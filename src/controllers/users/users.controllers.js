import { Users, Role } from '../../models/index.js'
import { logger } from '../../utils/logger.utils.js'

async function getAllUsers () {
  try {
    logger.users.info('Controlador - Obteniendo todos los usuarios')
    const result = await Users.getAllUsers()
    logger.users.info('Controlador - Todos los usuarios obtenidos exitosamente', {
      total: result.length
    })
    return result
  } catch (error) {
    logger.users.error('Controlador - Error obteniendo todos los usuarios', {
      error: error.message
    })
    throw error
  }
}

async function getUserById (userId) {
  try {
    logger.users.info('Controlador - Obteniendo usuario por ID', { userId })
    const result = await Users.getUserById(userId)

    if (result) {
      logger.users.info('Controlador - Usuario obtenido exitosamente', { userId })
    } else {
      logger.users.warn('Controlador - Usuario no encontrado', { userId })
    }

    return result
  } catch (error) {
    logger.users.error('Controlador - Error obteniendo usuario por ID', {
      userId,
      error: error.message
    })
    throw error
  }
}

async function getUserByEmail (email) {
  try {
    logger.users.info('Controlador - Obteniendo usuario por email', { email })
    const result = await Users.getUserByEmail(email)

    if (result) {
      logger.users.info('Controlador - Usuario encontrado por email', { email })
    } else {
      logger.users.info('Controlador - Usuario no encontrado por email', { email })
    }

    return result
  } catch (error) {
    logger.users.error('Controlador - Error obteniendo usuario por email', {
      email,
      error: error.message
    })
    throw error
  }
}

async function updateUserById (userId, userData) {
  try {
    logger.users.info('Controlador - Actualizando perfil de usuario', {
      userId,
      campos: Object.keys(userData)
    })
    const result = await Users.updateUserById(userId, userData)
    logger.users.info('Controlador - Perfil actualizado exitosamente', { userId })
    return result
  } catch (error) {
    logger.users.error('Controlador - Error actualizando perfil de usuario', {
      userId,
      error: error.message
    })
    throw error
  }
}

async function updateUserPassword (userId, oldPassword, newPassword, repeatedPassword) {
  try {
    logger.users.info('Controlador - Actualizando contraseña de usuario', { userId })
    const result = await Users.updateUserPassword(userId, oldPassword, newPassword, repeatedPassword)
    logger.users.info('Controlador - Contraseña actualizada exitosamente', { userId })
    return result
  } catch (error) {
    logger.users.error('Controlador - Error actualizando contraseña', {
      userId,
      error: error.message
    })
    throw error
  }
}

async function updateImageUserById (userId, imagePath) {
  try {
    logger.users.info('Controlador - Actualizando imagen de perfil', {
      userId,
      imagePath
    })
    const result = await Users.updateImageUserById(userId, imagePath)
    logger.users.info('Controlador - Imagen de perfil actualizada exitosamente', { userId })
    return result
  } catch (error) {
    logger.users.error('Controlador - Error actualizando imagen de perfil', {
      userId,
      error: error.message
    })
    throw error
  }
}

async function updateRole (userId, roleId) {
  try {
    logger.roles.info('Controlador - Actualizando rol de usuario', {
      userId,
      nuevoRol: roleId
    })
    const result = await Role.updateRoleById(userId, roleId)
    logger.roles.info('Controlador - Rol actualizado exitosamente', {
      userId,
      nuevoRol: roleId
    })
    return result
  } catch (error) {
    logger.roles.error('Controlador - Error actualizando rol', {
      userId,
      roleId,
      error: error.message
    })
    throw error
  }
}

async function updateStatus (userId, isActive) {
  try {
    logger.users.info('Controlador - Actualizando estado de usuario', {
      userId,
      nuevoEstado: isActive
    })
    const result = await Users.updateStatus(userId, isActive)
    logger.users.info('Controlador - Estado actualizado exitosamente', {
      userId,
      nuevoEstado: isActive
    })
    return result
  } catch (error) {
    logger.users.error('Controlador - Error actualizando estado', {
      userId,
      isActive,
      error: error.message
    })
    throw error
  }
}

async function deleteUserById (userId) {
  try {
    logger.users.info('Controlador - Eliminando usuario', { userId })
    await Users.deleteUserById(userId)
    logger.users.info('Controlador - Usuario eliminado exitosamente', { userId })
  } catch (error) {
    logger.users.error('Controlador - Error eliminando usuario', {
      userId,
      error: error.message
    })
    throw error
  }
}

export {
  getAllUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  updateUserPassword,
  updateImageUserById,
  updateRole,
  updateStatus,
  deleteUserById
}
