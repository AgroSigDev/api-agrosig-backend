import { Notification } from '../../models/index.js'

async function getUserNotifications (userId, limit = 20, offset = 0, unreadOnly = false) {
  const notifications = await Notification.getNotificationsByUserId(userId, limit, offset, unreadOnly)
  return notifications
}

async function markAsRead (userId, notificationId) {
  const result = await Notification.markNotificationAsRead(userId, notificationId)
  return result
}

async function markAllAsRead (userId) {
  const result = await Notification.markAllNotificationsAsRead(userId)
  return result
}

async function getUnreadCount (userId) {
  const count = await Notification.getUnreadCountByUserId(userId)
  return count
}

export {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
}
