import { pool } from '../../lib/db.js'

async function createNotification (userId, type, title, message, link) {
  try {
    const query = {
      text: `
      INSERT INTO notifications (user_id, type_notification, title_notification, message_notification, link_notification, status_notification, sent_at, is_read)
      VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), false)
      RETURNING notification_id, user_id, type_notification, title_notification, message_notification, link_notification, status_notification, sent_at, is_read
    `,
      values: [userId, type, title, message, link]
    }
    const result = await pool.query(query)
    return result.rows[0]
  } catch (error) {
    console.log('Error getting notifications by user ID: ', error)
    throw error
  }
}

async function markAsRead (notificationId, userId) {
  try {
    const query = {
      text: `
      UPDATE notifications
      SET is_read = true, status_notification = 'read', sent_at = NOW()
      WHERE notification_id = $1 AND user_id = $2
      RETURNING notification_id, user_id, is_read, status_notification, sent_at
    `,
      values: [notificationId, userId]
    }
    const result = await pool.query(query)
    return result.rows[0]
  } catch (error) {
    console.log('Error updating notification: ', error)
    throw error
  }
}

async function getUnreadByUserId (userId) {
  try {
    const query = {
      text: `
        SELECT * FROM notifications 
        WHERE user_id = $1 AND is_read = false 
        ORDER BY sent_at DESC
      `,
      values: [userId]
    }
    const result = await pool.query(query)
    return result.rows
  } catch (error) {
    console.log('Error getting unread notifications:', error)
    throw error
  }
}

async function markAllAsRead (userId) {
  try {
    const query = {
      text: `
        UPDATE notifications 
        SET is_read = true, status_notification = 'read'
        WHERE user_id = $1 AND is_read = false
        RETURNING notification_id
      `,
      values: [userId]
    }
    const result = await pool.query(query)
    return result.rowCount // número de notificaciones actualizadas
  } catch (error) {
    console.log('Error marking all as read:', error)
    throw error
  }
}

export const Notifications = {
  createNotification,
  markAsRead,
  getUnreadByUserId,
  markAllAsRead
}
