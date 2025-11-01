import { pool } from '../../lib/db.js'

/**
 * Obtiene las notificaciones de un usuario con paginación y filtro de no leídas.
 *
 * @async
 * @function getNotificationsByUserId
 * @param {number} userId - ID del usuario.
 * @param {number} limit - Límite de notificaciones por página.
 * @param {number} offset - Offset para paginación.
 * @param {boolean} unreadOnly - Si es true, solo obtiene las no leídas.
 * @returns {Promise<Array<Object>>} Array de notificaciones.
 * @throws {Error} Si hay un error en la base de datos.
 */
async function getNotificationsByUserId (userId, limit = 20, offset = 0, unreadOnly = false) {
  try {
    let query = `
      SELECT 
        notification_id,
        user_id,
        type_notification,
        title_notification,
        message_notification,
        status_notification,
        link_notification,
        sent_at,
        is_read
      FROM notifications 
      WHERE user_id = $1
    `

    const values = [userId]
    let paramCount = 1

    if (unreadOnly) {
      paramCount++
      query += ' AND is_read = false'
    }

    query += ` ORDER BY sent_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`
    values.push(parseInt(limit), parseInt(offset))

    const result = await pool.query(query, values)
    return result.rows
  } catch (error) {
    console.error('Error getting notifications:', error)
    throw error
  }
}

/**
 * Marca una notificación como leída.
 *
 * @async
 * @function markNotificationAsRead
 * @param {number} userId - ID del usuario.
 * @param {number} notificationId - ID de la notificación.
 * @returns {Promise<Object>} Resultado de la operación.
 * @throws {Error} Si hay un error en la base de datos.
 */
async function markNotificationAsRead (userId, notificationId) {
  try {
    const query = {
      text: 'UPDATE notifications SET is_read = true WHERE notification_id = $1 AND user_id = $2',
      values: [notificationId, userId]
    }

    const result = await pool.query(query)
    return result
  } catch (error) {
    console.error('Error marking notification as read:', error)
    throw error
  }
}

/**
 * Marca todas las notificaciones de un usuario como leídas.
 *
 * @async
 * @function markAllNotificationsAsRead
 * @param {number} userId - ID del usuario.
 * @returns {Promise<Object>} Resultado de la operación.
 * @throws {Error} Si hay un error en la base de datos.
 */
async function markAllNotificationsAsRead (userId) {
  try {
    const query = {
      text: 'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      values: [userId]
    }

    const result = await pool.query(query)
    return result
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    throw error
  }
}

/**
 * Obtiene el conteo de notificaciones no leídas de un usuario.
 *
 * @async
 * @function getUnreadCountByUserId
 * @param {number} userId - ID del usuario.
 * @returns {Promise<number>} Número de notificaciones no leídas.
 * @throws {Error} Si hay un error en la base de datos.
 */
async function getUnreadCountByUserId (userId) {
  try {
    const query = {
      text: 'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      values: [userId]
    }

    const result = await pool.query(query)
    return parseInt(result.rows[0].count)
  } catch (error) {
    console.error('Error getting unread count:', error)
    throw error
  }
}

export const Notification = {
  getNotificationsByUserId,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCountByUserId
}
