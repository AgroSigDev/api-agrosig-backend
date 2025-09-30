import { socketAuthMiddleware } from '../middlewares/index.js'
import { Notifications } from '../models/index.js'

export function socketNotifications (io) {
  const namespace = io.of('/notifications')

  // Usa el middleware correctamente
  namespace.use(socketAuthMiddleware)

  namespace.on('connection', (socket) => {
    console.log(`Usuario conectado a /notifications: ${socket.user.user_id}`)

    // Escuchar cuando se marca como leída
    socket.on('notification:mark_read', async (payload, ack) => {
      try {
        const { notificationId } = payload
        const updated = await Notifications.markAsRead(notificationId, socket.user.user_id)
        if (!updated) {
          if (ack) ack({ success: false, error: 'Notificación no encontrada o no pertenece al usuario' })
          return
        }
        // Emitir solo al usuario específico
        socket.emit('notification:updated', updated)
        if (ack) ack({ success: true, notification: updated })
      } catch (error) {
        console.error('Error marcando notificación como leída:', error)
        if (ack) ack({ success: false, error: error.message })
      }
    })

    socket.on('disconnect', (reason) => {
      console.log(`notifications: disconnect ${socket.id} reason:${reason}`)
    })
  })
}
