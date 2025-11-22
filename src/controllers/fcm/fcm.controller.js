import { FCM } from '../../models/index.js'
import { logger } from '../../utils/logger.utils.js'

async function registerFCMToken (userId, fcmToken, deviceType) {
  try {
    logger.fcm.info('Controlador - Registrando token FCM', { userId, deviceType })
    const result = await FCM.registerFCMToken(userId, fcmToken, deviceType)
    logger.fcm.info('Controlador - Token FCM registrado exitosamente', { userId, deviceType })
    return result
  } catch (error) {
    logger.fcm.error('Controlador - Error registrando token FCM', {
      userId,
      error: error.message
    })
    throw error
  }
}

async function unregisterFCMToken (userId, fcmToken) {
  try {
    logger.fcm.info('Controlador - Eliminando token FCM', { userId, fcmToken })
    const result = await FCM.unregisterFCMToken(userId, fcmToken)
    logger.fcm.info('Controlador - Token FCM eliminado exitosamente', { userId, fcmToken })
    return result
  } catch (error) {
    logger.fcm.error('Controlador - Error eliminando token FCM', {
      userId,
      fcmToken,
      error: error.message
    })
    throw error
  }
}

async function getUserFCMTokens (userId) {
  try {
    logger.fcm.info('Controlador - Obteniendo tokens FCM del usuario', { userId })
    const tokens = await FCM.getUserFCMTokens(userId)
    logger.fcm.info('Controlador - Tokens FCM obtenidos exitosamente', {
      userId,
      total: tokens.length
    })
    return tokens
  } catch (error) {
    logger.fcm.error('Controlador - Error obteniendo tokens FCM', {
      userId,
      error: error.message
    })
    throw error
  }
}

export {
  registerFCMToken,
  unregisterFCMToken,
  getUserFCMTokens
}
