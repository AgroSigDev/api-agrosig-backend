import { Notification } from '../../models/index.js'
import { logger } from '../../utils/logger.utils.js'

async function getUserNotifications (userId, limit = 20, offset = 0, unreadOnly = false) {
  try {
    logger.notifications.info('Controlador - Obteniendo notificaciones del usuario', {
      userId,
      limit,
      offset,
      unreadOnly
    })
    const notifications = await Notification.getNotificationsByUserId(userId, limit, offset, unreadOnly)
    logger.notifications.info('Controlador - Notificaciones obtenidas exitosamente', {
      userId,
      total: notifications.length
    })
    return notifications
  } catch (error) {
    logger.notifications.error('Controlador - Error obteniendo notificaciones', {
      userId,
      error: error.message
    })
    throw error
  }
}

async function markAsRead (userId, notificationId) {
  try {
    logger.notifications.info('Controlador - Marcando notificación como leída', {
      userId,
      notificationId
    })
    const result = await Notification.markNotificationAsRead(userId, notificationId)
    logger.notifications.info('Controlador - Notificación marcada como leída exitosamente', {
      userId,
      notificationId
    })
    return result
  } catch (error) {
    logger.notifications.error('Controlador - Error marcando notificación como leída', {
      userId,
      notificationId,
      error: error.message
    })
    throw error
  }
}

async function markAllAsRead (userId) {
  try {
    logger.notifications.info('Controlador - Marcando todas las notificaciones como leídas', { userId })
    const result = await Notification.markAllNotificationsAsRead(userId)
    logger.notifications.info('Controlador - Todas las notificaciones marcadas como leídas exitosamente', { userId })
    return result
  } catch (error) {
    logger.notifications.error('Controlador - Error marcando todas las notificaciones como leídas', {
      userId,
      error: error.message
    })
    throw error
  }
}

async function getUnreadCount (userId) {
  try {
    logger.notifications.info('Controlador - Obteniendo conteo de no leídas', { userId })
    const count = await Notification.getUnreadCountByUserId(userId)
    logger.notifications.info('Controlador - Conteo de no leídas obtenido exitosamente', {
      userId,
      count
    })
    return count
  } catch (error) {
    logger.notifications.error('Controlador - Error obteniendo conteo de no leídas', {
      userId,
      error: error.message
    })
    throw error
  }
}

export {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
}
