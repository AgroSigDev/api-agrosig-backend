import { pool } from '../lib/db.js'
import admin from 'firebase-admin'
import { FCM } from '../models/index.js'
import { config } from '../../config.js'

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      firebase_type: config.firebase.type,
      projectId: config.firebase.project_id,
      privateKeyId: config.firebase.private_key_id,
      privateKey: config.firebase.privateKey,
      clientEmail: config.firebase.clientEmail,
      clientId: config.firebase.clientId,
      authUri: config.firebase.authUri,
      tokenUri: config.firebase.tokenUri,
      authProviderX509CertUrl: config.firebase.authProviderX509CertUrl,
      clientX509CertUrl: config.firebase.clientX509CertUrl,
      universeDomain: config.firebase.universeDomain
    })
  })
}

const messaging = admin.messaging()

class FirebaseService {
  sanitizeData (data) {
    const sanitized = {}
    for (const [key, value] of Object.entries(data || {})) {
      sanitized[key] =
        value === null || value === undefined
          ? ''
          : typeof value === 'object'
            ? JSON.stringify(value)
            : String(value)
    }
    return sanitized
  }

  async sendNotification (token, title, body, data = {}) {
    try {
      const message = {
        token,
        notification: { title, body },
        data: this.sanitizeData(data),
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default', contentAvailable: true } } }
      }

      const response = await messaging.send(message)
      console.log(`Notificación enviada: ${response}`)
      return response
    } catch (error) {
      console.error('Error enviando notificación:', error)

      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      ) {
        await this.removeInvalidToken(token)
      }

      await this.logFailedNotification(token, title, body, error)
      throw error
    }
  }

  async sendToUser (userId, title, body, data = {}) {
    try {
      const tokens = await this.getUserTokens(userId)

      if (!tokens.length) {
        console.warn(`Usuario ${userId} no tiene tokens FCM registrados.`)
        return
      }

      const sanitizedData = this.sanitizeData(data)
      const messages = tokens.map(token => ({
        token,
        notification: { title, body },
        data: sanitizedData,
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default', contentAvailable: true } } }
      }))

      const results = await Promise.allSettled(messages.map(m => messaging.send(m)))

      for (let i = 0; i < results.length; i++) {
        if (results[i].status === 'rejected') {
          const error = results[i].reason
          const token = tokens[i]
          console.error(`Error con token ${token}: ${error.code}`)
          if (
            error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered'
          ) {
            await this.removeInvalidToken(token)
          }
        }
      }

      console.log(`Envío a ${tokens.length} dispositivos del usuario ${userId}`)
      return results
    } catch (error) {
      console.error('Error en sendToUser:', error)
      throw error
    }
  }

  async getUserTokens (userId) {
    const tokens = await FCM.getUserFCMTokens(userId)
    return tokens.map(t => t.fcm_token)
  }

  async registerToken (userId, token, deviceType = 'mobile') {
    await FCM.registerFCMToken(userId, token, deviceType)
  }

  async removeInvalidToken (token) {
    await pool.query('DELETE FROM user_fcm_tokens WHERE fcm_token = $1', [token])
    console.log(`Token inválido eliminado: ${token}`)
  }

  async logFailedNotification (token, title, body, error) {
    try {
      await pool.query(
        `
        INSERT INTO notifications (
          user_id, type_notification, title_notification,
          message_notification, status_notification, link_notification
        )
        VALUES (NULL, 'fcm_error', $1, $2, $3, $4)
        `,
        [
          title || 'Error FCM',
          body || '',
          'failed',
          JSON.stringify({ token, error: error.message })
        ]
      )
    } catch (err) {
      console.error('Error registrando fallo de notificación:', err)
    }
  }
}

export default new FirebaseService()
