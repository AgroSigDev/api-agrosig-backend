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

export const Notifications = {
  createNotification,
  markAsRead
}
