import { Notifications } from '../models/index.js'

export class NotificationService {
  static async notifyNewComment (comment, io) {
    try {
      // Notificar a todos los usuarios sobre nuevo comentario
      const notification = await Notifications.createNotification(
        comment.user_id, // El que creó el comentario
        'new_comment',
        'Nuevo comentario',
        'Se ha agregado un nuevo comentario',
        '/comments'
      )

      // Emitir a todos en el namespace de notificaciones
      io.of('/notifications').emit('notification:new', notification)
      return notification
    } catch (error) {
      console.error('Error creating notification for new comment:', error)
    }
  }

  static async notifyCommentReply (comment, parentCommentAuthorId, io) {
    try {
      // Notificar solo al autor del comentario padre
      const notification = await Notifications.createNotification(
        parentCommentAuthorId,
        'comment_reply',
        'Nueva respuesta',
        'Alguien respondió a tu comentario',
        '/comments'
      )

      // Emitir solo al usuario específico
      io.of('/notifications').to(`user_${parentCommentAuthorId}`).emit('notification:new', notification)
      return notification
    } catch (error) {
      console.error('Error creating notification for comment reply:', error)
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
