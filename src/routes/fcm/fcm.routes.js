import express from 'express'
import { registerFCMToken, unregisterFCMToken, getUserFCMTokens } from '../../controllers/index.js'
import { autenticate, authorize } from '../../middlewares/index.js'
import { logger } from '../../utils/logger.utils.js'

const router = express.Router()

// POST /fcm/register-token
router.post('/register-token', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id
    const { fcm_token: fcmToken, device_type: deviceType = 'mobile' } = request.body

    logger.api.info('Solicitud de registro de token FCM', {
      userId,
      deviceType,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const result = await registerFCMToken(userId, fcmToken, deviceType)
    const responseTime = Date.now() - startTime

    logger.api.info('Token FCM registrado exitosamente', {
      userId,
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      message: 'Token registrado exitosamente',
      data: result
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de registro de token FCM', {
      userId: request.user?.user_id,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// POST /fcm/unregister-token
router.post('/unregister-token', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id
    const { fcm_token: fcmToken } = request.body

    logger.api.info('Solicitud de eliminación de token FCM', {
      userId,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const result = await unregisterFCMToken(userId, fcmToken)
    const responseTime = Date.now() - startTime

    logger.api.info('Token FCM eliminado exitosamente', {
      userId,
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      message: 'Token eliminado exitosamente',
      data: result
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de eliminación de token FCM', {
      userId: request.user?.user_id,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// GET /fcm/tokens
router.get('/tokens', autenticate, authorize(['admin']), async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id

    logger.api.info('Solicitud de obtención de tokens FCM', {
      userId,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const tokens = await getUserFCMTokens(userId)
    const responseTime = Date.now() - startTime

    logger.api.info('Tokens FCM obtenidos exitosamente', {
      userId,
      total: tokens.length,
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      tokens,
      total: tokens.length
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de obtención de tokens FCM', {
      userId: request.user?.user_id,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

export default router
