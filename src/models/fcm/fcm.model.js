import { pool } from '../../lib/db.js'
import {
  ValidationError,
  InternalServerError
} from '../../lib/api.errors.js'
import { logger } from '../../utils/logger.utils.js'

/**
 * Registra o actualiza un token FCM para un usuario.
 *
 * @async
 * @function registerFCMToken
 * @param {number} userId - ID del usuario.
 * @param {string} fcmToken - Token FCM.
 * @param {string} deviceType - Tipo de dispositivo (default: 'mobile').
 * @returns {Promise<Object>} Resultado de la operación.
 * @throws {Error} Si hay un error en la base de datos.
 */
async function registerFCMToken (userId, fcmToken, deviceType = 'mobile') {
  try {
    logger.fcm.info('Registrando token FCM', { userId, deviceType })

    if (!fcmToken || fcmToken.trim() === '') {
      throw new ValidationError('FCM token is required')
    }

    const query = {
      text: `INSERT INTO user_fcm_tokens (user_id, fcm_token, device_type) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (user_id, fcm_token) 
             DO UPDATE SET updated_at = CURRENT_TIMESTAMP`,
      values: [userId, fcmToken, deviceType]
    }

    const result = await pool.query(query)
    logger.fcm.info('Token FCM registrado exitosamente', { userId, deviceType })
    return result
  } catch (error) {
    logger.fcm.error('Error registrando token FCM', {
      userId,
      error: error.message,
      deviceType
    })

    if (error instanceof ValidationError) {
      throw error
    }
    throw new InternalServerError('Error registering FCM token', { original: error.message })
  }
}

/**
 * Elimina un token FCM para un usuario.
 *
 * @async
 * @function unregisterFCMToken
 * @param {number} userId - ID del usuario.
 * @param {string} fcmToken - Token FCM a eliminar.
 * @returns {Promise<Object>} Resultado de la operación.
 * @throws {Error} Si hay un error en la base de datos.
 */
async function unregisterFCMToken (userId, fcmToken) {
  try {
    logger.fcm.info('Eliminando token FCM', { userId, fcmToken })

    if (!fcmToken || fcmToken.trim() === '') {
      throw new ValidationError('FCM token is required')
    }

    const query = {
      text: 'DELETE FROM user_fcm_tokens WHERE user_id = $1 AND fcm_token = $2',
      values: [userId, fcmToken]
    }

    const result = await pool.query(query)
    logger.fcm.info('Token FCM eliminado exitosamente', { userId, fcmToken })
    return result
  } catch (error) {
    logger.fcm.error('Error eliminando token FCM', {
      userId,
      fcmToken,
      error: error.message
    })

    if (error instanceof ValidationError) {
      throw error
    }
    throw new InternalServerError('Error unregistering FCM token', { original: error.message })
  }
}

/**
 * Obtiene todos los tokens FCM activos de un usuario.
 *
 * @async
 * @function getUserFCMTokens
 * @param {number} userId - ID del usuario.
 * @returns {Promise<Array<Object>>} Array de tokens FCM del usuario.
 * @throws {Error} Si hay un error en la base de datos.
 */
async function getUserFCMTokens (userId) {
  try {
    logger.fcm.info('Obteniendo tokens FCM del usuario', { userId })

    const query = {
      text: 'SELECT fcm_token, device_type, created_at, updated_at FROM user_fcm_tokens WHERE user_id = $1',
      values: [userId]
    }

    const result = await pool.query(query)
    logger.fcm.info('Tokens FCM obtenidos exitosamente', {
      userId,
      total: result.rows.length
    })
    return result.rows
  } catch (error) {
    logger.fcm.error('Error obteniendo tokens FCM', {
      userId,
      error: error.message
    })
    throw new InternalServerError('Error getting user FCM tokens', { original: error.message })
  }
}

/**
 * Verifica si un token FCM existe para un usuario.
 *
 * @async
 * @function checkFCMTokenExists
 * @param {number} userId - ID del usuario.
 * @param {string} fcmToken - Token FCM a verificar.
 * @returns {Promise<boolean>} True si el token existe, false en caso contrario.
 * @throws {Error} Si hay un error en la base de datos.
 */
async function checkFCMTokenExists (userId, fcmToken) {
  try {
    logger.fcm.info('Verificando existencia de token FCM', { userId, fcmToken })

    const query = {
      text: 'SELECT 1 FROM user_fcm_tokens WHERE user_id = $1 AND fcm_token = $2',
      values: [userId, fcmToken]
    }

    const result = await pool.query(query)
    const exists = result.rows.length > 0
    logger.fcm.info('Verificación de token FCM completada', { userId, fcmToken, exists })
    return exists
  } catch (error) {
    logger.fcm.error('Error verificando token FCM', {
      userId,
      fcmToken,
      error: error.message
    })
    throw new InternalServerError('Error checking FCM token existence', { original: error.message })
  }
}

export const FCM = {
  registerFCMToken,
  unregisterFCMToken,
  getUserFCMTokens,
  checkFCMTokenExists
}
