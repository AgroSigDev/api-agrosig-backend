import { pool } from '../../lib/db.js'
import { InternalServerError, NotFoundError } from '../../lib/api.errors.js'
import { logger } from '../../utils/logger.utils.js'

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
    logger.notifications.info('Obteniendo notificaciones del usuario', {
      userId,
      limit,
      offset,
      unreadOnly
    })

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
      query += ` AND is_read = $${paramCount}`
      values.push(false)
    }

    query += ` ORDER BY sent_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`
    values.push(parseInt(limit), parseInt(offset))

    const result = await pool.query(query, values)
    logger.notifications.info('Notificaciones obtenidas exitosamente', {
      userId,
      total: result.rows.length
    })
    return result.rows
  } catch (error) {
    logger.notifications.error('Error obteniendo notificaciones', {
      userId,
      error: error.message
    })
    throw new InternalServerError('Error getting notifications', { original: error.message })
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
    logger.notifications.info('Marcando notificación como leída', {
      userId,
      notificationId
    })

    const query = {
      text: 'UPDATE notifications SET is_read = true WHERE notification_id = $1 AND user_id = $2',
      values: [notificationId, userId]
    }

    const result = await pool.query(query)

    if (result.rowCount === 0) {
      logger.notifications.warn('Notificación no encontrada para marcar como leída', {
        userId,
        notificationId
      })
      throw new NotFoundError('Notification not found')
    }

    logger.notifications.info('Notificación marcada como leída exitosamente', {
      userId,
      notificationId
    })
    return result
  } catch (error) {
    logger.notifications.error('Error marcando notificación como leída', {
      userId,
      notificationId,
      error: error.message
    })

    if (error instanceof NotFoundError) {
      throw error
    }
    throw new InternalServerError('Error marking notification as read', { original: error.message })
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
    logger.notifications.info('Marcando todas las notificaciones como leídas', { userId })

    const query = {
      text: 'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      values: [userId]
    }

    const result = await pool.query(query)
    logger.notifications.info('Todas las notificaciones marcadas como leídas exitosamente', {
      userId,
      updatedCount: result.rowCount
    })
    return result
  } catch (error) {
    logger.notifications.error('Error marcando todas las notificaciones como leídas', {
      userId,
      error: error.message
    })
    throw new InternalServerError('Error marking all notifications as read', { original: error.message })
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
    logger.notifications.info('Obteniendo conteo de notificaciones no leídas', { userId })

    const query = {
      text: 'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      values: [userId]
    }

    const result = await pool.query(query)
    const count = parseInt(result.rows[0].count)
    logger.notifications.info('Conteo de no leídas obtenido exitosamente', {
      userId,
      count
    })
    return count
  } catch (error) {
    logger.notifications.error('Error obteniendo conteo de no leídas', {
      userId,
      error: error.message
    })
    throw new InternalServerError('Error getting unread count', { original: error.message })
  }
}

export const Notification = {
  getNotificationsByUserId,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCountByUserId
}
