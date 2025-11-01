import { pool } from '../../lib/db.js'

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
    const query = {
      text: `INSERT INTO user_fcm_tokens (user_id, fcm_token, device_type) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (user_id, fcm_token) 
             DO UPDATE SET updated_at = CURRENT_TIMESTAMP`,
      values: [userId, fcmToken, deviceType]
    }

    const result = await pool.query(query)
    return result
  } catch (error) {
    console.error('Error registering FCM token in model:', error)
    throw error
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
    const query = {
      text: 'DELETE FROM user_fcm_tokens WHERE user_id = $1 AND fcm_token = $2',
      values: [userId, fcmToken]
    }

    const result = await pool.query(query)
    return result
  } catch (error) {
    console.error('Error unregistering FCM token in model:', error)
    throw error
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
    const query = {
      text: 'SELECT fcm_token, device_type, created_at, updated_at FROM user_fcm_tokens WHERE user_id = $1',
      values: [userId]
    }

    const result = await pool.query(query)
    return result.rows
  } catch (error) {
    console.error('Error getting user FCM tokens:', error)
    throw error
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
    const query = {
      text: 'SELECT 1 FROM user_fcm_tokens WHERE user_id = $1 AND fcm_token = $2',
      values: [userId, fcmToken]
    }

    const result = await pool.query(query)
    return result.rows.length > 0
  } catch (error) {
    console.error('Error checking FCM token existence:', error)
    throw error
  }
}

export const FCM = {
  registerFCMToken,
  unregisterFCMToken,
  getUserFCMTokens,
  checkFCMTokenExists
}
