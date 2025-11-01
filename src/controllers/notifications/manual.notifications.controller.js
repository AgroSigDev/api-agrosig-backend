import FirebaseService from '../../services/firebase.service.js'
import { pool } from '../../lib/db.js'

/**
 * Envía una notificación a un usuario específico.
 * Endpoint: POST /notifications/send-to-user/:userId
 */
export async function sendNotificationToUser (req, res) {
  try {
    const { userId } = req.params
    const { title, body, data = {} } = req.body

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'El título y el cuerpo de la notificación son obligatorios.'
      })
    }

    const result = await FirebaseService.sendToUser(userId, title, body, data)

    res.status(200).json({
      success: true,
      message: `Notificación enviada a usuario ${userId}`,
      result
    })
  } catch (error) {
    console.error('Error enviando notificación a usuario:', error)
    res.status(500).json({
      success: false,
      message: 'Error enviando notificación',
      error: error.message
    })
  }
}

/**
 * Envía una notificación manual a un usuario específico
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function sendManualNotification (req, res) {
  try {
    const { user_id: userId, title, body, data = {} } = req.body

    // Validar que el usuario que envía es admin
    if (req.user.role_id !== 1) { // 1 = admin
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden enviar notificaciones manuales'
      })
    }

    // Validar campos requeridos
    if (!userId || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'user_id, title y body son requeridos'
      })
    }

    // Verificar que el usuario existe
    const userQuery = await pool.query(
      'SELECT user_id FROM users WHERE user_id = $1 AND is_active = true',
      [userId]
    )

    if (userQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado o inactivo'
      })
    }

    // Enviar notificación
    await FirebaseService.sendToUser(userId, title, body, data)

    // Registrar en historial
    await pool.query(
      `INSERT INTO notifications 
       (user_id, type_notification, title_notification, message_notification, status_notification) 
       VALUES ($1, 'manual', $2, $3, 'sent')`,
      [userId, title, body]
    )

    res.status(200).json({
      success: true,
      message: 'Notificación enviada correctamente'
    })
  } catch (error) {
    console.error('Error enviando notificación manual:', error)
    res.status(500).json({
      success: false,
      message: 'Error enviando notificación'
    })
  }
}

/**
 * Envía una notificación manual a múltiples usuarios
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function sendBulkManualNotification (req, res) {
  try {
    const { user_ids: userIds, title, body, data = {}, send_to_all: sendToAll = false } = req.body

    // Validar que el usuario que envía es admin
    if (req.user.role_id !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden enviar notificaciones manuales'
      })
    }

    // Validar campos requeridos
    if (!sendToAll && (!userIds || !Array.isArray(userIds))) {
      return res.status(400).json({
        success: false,
        message: 'user_ids (array) o send_to_all son requeridos'
      })
    }

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'title y body son requeridos'
      })
    }

    let targetUsers = []

    if (sendToAll) {
      // Obtener todos los usuarios activos
      const usersQuery = await pool.query(
        'SELECT user_id FROM users WHERE is_active = true'
      )
      targetUsers = usersQuery.rows.map(row => row.user_id)
    } else {
      // Validar que los usuarios existen
      const placeholders = userIds.map((_, index) => `$${index + 1}`).join(',')
      const usersQuery = await pool.query(
        `SELECT user_id FROM users WHERE user_id IN (${placeholders}) AND is_active = true`,
        userIds
      )
      targetUsers = usersQuery.rows.map(row => row.user_id)
    }

    if (targetUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontraron usuarios activos'
      })
    }

    // Enviar notificaciones
    const results = []
    for (const userId of targetUsers) {
      try {
        await FirebaseService.sendToUser(userId, title, body, data)

        // Registrar en historial
        await pool.query(
          `INSERT INTO notifications 
           (user_id, type_notification, title_notification, message_notification, status_notification) 
           VALUES ($1, 'manual_bulk', $2, $3, 'sent')`,
          [userId, title, body]
        )

        results.push({ user_id: userId, status: 'success' })
      } catch (error) {
        console.error(`Error enviando notificación a usuario ${userId}:`, error)
        results.push({ user_id: userId, status: 'error', error: error.message })
      }
    }

    const successful = results.filter(r => r.status === 'success').length
    const failed = results.filter(r => r.status === 'error').length

    res.status(200).json({
      success: true,
      message: `Notificaciones enviadas: ${successful} exitosas, ${failed} fallidas`,
      results
    })
  } catch (error) {
    console.error('Error enviando notificación masiva:', error)
    res.status(500).json({
      success: false,
      message: 'Error enviando notificaciones'
    })
  }
}

export {
  sendManualNotification,
  sendBulkManualNotification
}
