import express from 'express'
import { registerFCMToken, unregisterFCMToken } from '../../controllers/index.js'
import { autenticate } from '../../middlewares/index.js'

const router = express.Router()

// POST /fcm/register-token
router.post('/register-token', autenticate, async (request, response, next) => {
  try {
    const userId = request.user.user_id
    const { fcm_token: fcmToken, device_type: deviceType = 'mobile' } = request.body

    const result = await registerFCMToken(userId, fcmToken, deviceType)
    response.status(200).json({
      success: true,
      message: 'Token registrado exitosamente',
      data: result
    })
  } catch (error) {
    console.log('Error registrando token FCM: ', error)
    response.status(500).json({
      success: false,
      message: 'Error registrando token'
    })
  }
})

// DELETE /fcm/unregister-token
router.post('/unregister-token', autenticate, async (request, response, next) => {
  try {
    const userId = request.user.user_id
    const { fcm_token: fcmToken } = request.body

    const result = await unregisterFCMToken(userId, fcmToken)
    response.status(200).json({
      success: true,
      message: 'Token eliminado exitosamente',
      data: result
    })
  } catch (error) {
    console.log('Error eliminando token FCM: ', error)
    response.status(500).json({
      success: false,
      message: 'Error eliminando token'
    })
  }
})

export default router
