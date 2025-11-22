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

/**
 * Service class for handling Firebase Cloud Messaging (FCM) operations.
 * Provides methods for sending notifications, managing FCM tokens, and handling errors.
 */
class FirebaseService {
  /**
   * Sanitizes data object by converting all values to strings and handling null/undefined values.
   * @param {object} data - The data object to sanitize.
   * @returns {object} The sanitized data object with all values as strings.
   */
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

  /**
   * Sends a push notification to a specific FCM token.
   * @param {string} token - The FCM registration token of the device.
   * @param {string} title - The title of the notification.
   * @param {string} body - The body message of the notification.
   * @param {object} [data={}] - Additional data to send with the notification.
   * @returns {Promise<string>} The message ID from FCM.
   * @throws {Error} If there's an error sending the notification.
   */
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

  /**
   * Sends a push notification to all FCM tokens registered for a specific user.
   * @param {number} userId - The ID of the user to send the notification to.
   * @param {string} title - The title of the notification.
   * @param {string} body - The body message of the notification.
   * @param {object} [data={}] - Additional data to send with the notification.
   * @returns {Promise<Array>} Array of PromiseSettledResult objects for each token.
   * @throws {Error} If there's an error sending the notifications.
   */
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

  /**
   * Retrieves all FCM tokens registered for a specific user.
   * @param {number} userId - The ID of the user.
   * @returns {Promise<Array<string>>} Array of FCM tokens for the user.
   */
  async getUserTokens (userId) {
    const tokens = await FCM.getUserFCMTokens(userId)
    return tokens.map(t => t.fcm_token)
  }

  /**
   * Registers a new FCM token for a user.
   * @param {number} userId - The ID of the user.
   * @param {string} token - The FCM registration token.
   * @param {string} [deviceType='mobile'] - The type of device (e.g., 'mobile', 'web').
   * @returns {Promise<void>}
   */
  async registerToken (userId, token, deviceType = 'mobile') {
    await FCM.registerFCMToken(userId, token, deviceType)
  }

  /**
   * Removes an invalid FCM token from the database.
   * @param {string} token - The invalid FCM token to remove.
   * @returns {Promise<void>}
   */
  async removeInvalidToken (token) {
    await pool.query('DELETE FROM user_fcm_tokens WHERE fcm_token = $1', [token])
    console.log(`Token inválido eliminado: ${token}`)
  }

  /**
   * Logs a failed notification attempt to the database.
   * @param {string} token - The FCM token that failed.
   * @param {string} title - The title of the notification.
   * @param {string} body - The body of the notification.
   * @param {Error} error - The error that occurred.
   * @returns {Promise<void>}
   */
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
