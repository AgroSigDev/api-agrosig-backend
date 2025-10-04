import { Notifications, Comment } from '../models/index.js'

export class NotificationService {
  static async notifyNewComment (comment, io) {
    try {
      // Notify all connected users about new comment
      const notification = await Notifications.createNotification(
        comment.user_id, // Self-notification or broadcast
        'new_comment',
        'Nuevo Comentario',
        'Se ha publicado un nuevo comentario',
        `/comments#comment-${comment.comment_id}`
      )

      // Broadcast to all users in chat namespace
      io.of('/chat').emit('notification:new_comment', notification)

      return notification
    } catch (error) {
      console.error('Error creating notification for new comment:', error)
      throw error
    }
  }

  static async notifyCommentReply (comment, io) {
    try {
      const parentComment = await Comment.getCommentById(comment.parent_comment_id)

      if (!parentComment || parentComment.user_id === comment.user_id) {
        return null // Don't notify if replying to own comment
      }

      const notification = await Notifications.createNotification(
        parentComment.user_id,
        'comment_reply',
        'Nueva Respuesta',
        `${comment.first_name} respondió a tu comentario`,
        `/comments#comment-${comment.comment_id}`
      )

      // Emit only to the specific user
      io.of('/notifications').to(`user_${parentComment.user_id}`).emit('notification:new', notification)

      return notification
    } catch (error) {
      console.error('Error creating notification for comment reply:', error)
      throw error
    }
  }

  static async notifyCommentUpdate (comment, io) {
    try {
      const notification = await Notifications.createNotification(
        comment.user_id,
        'comment_updated',
        'Comentario actualizado',
        'Tu comentario ha sido actualizado',
        '/comments'
      )

      io.of('/notifications').emit('notification:updated', notification)
      return notification
    } catch (error) {
      console.error('Error creating notification for comment update:', error)
    }
  }
}
