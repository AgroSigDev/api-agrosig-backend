import { FCM } from '../../models/index.js'

async function registerFCMToken (userId, fcmToken, deviceType) {
  const result = await FCM.registerFCMToken(userId, fcmToken, deviceType)
  return result
}

async function unregisterFCMToken (userId, fcmToken) {
  const result = await FCM.unregisterFCMToken(userId, fcmToken)
  return result
}

async function getUserFCMTokens (req, res) {
  try {
    const userId = req.user.user_id

    const tokens = await FCM.getUserFCMTokens(userId)

    res.status(200).json({
      success: true,
      tokens,
      total: tokens.length
    })
  } catch (error) {
    console.error('Error obteniendo tokens FCM:', error)
    res.status(500).json({
      success: false,
      message: 'Error obteniendo tokens FCM'
    })
  }
}

export {
  registerFCMToken,
  unregisterFCMToken,
  getUserFCMTokens
}
