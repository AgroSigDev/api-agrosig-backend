import { socketAuthMiddleware } from '../middlewares/index.js'
import { Notifications } from '../models/index.js'

export function socketNotifications (io) {
  const namespace = io.of('/notifications')

  namespace.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      if (!token) {
        return next(new Error('Token requerido'))
      }
      const decoded = socketAuthMiddleware(token)
      socket.user = decoded // payload del JWT
      next()
    } catch (err) {
      next(new Error('Token inválido'))
    }
  })

  namespace.on('connection', (socket) => {
    console.log(`Usuario conectado a /notifications: ${socket.user.user_id}`)

    // Crear una notificación nueva
    socket.on('notification:new', async (payload, ack) => {
      try {
        const { type, title, message, link } = payload
        const notification = await Notifications.createNotification(
          socket.user.user_id,
          type,
          title,
          message,
          link
        )
        namespace.emit('notification:created', notification) // broadcast a todos
        if (ack) ack({ success: true, notification })
      } catch (error) {
        console.error('Error creando notificación:', error)
        if (ack) ack({ success: false, error: error.message })
      }
    })

    // Marcar una notificación como leída
    socket.on('notification:mark_read', async (payload, ack) => {
      try {
        const { notificationId } = payload
        const updated = await Notifications.markAsRead(notificationId, socket.user.user_id)
        if (!updated) {
          if (ack) ack({ success: false, error: 'Notificación no encontrada o no pertenece al usuario' })
          return
        }
        namespace.emit('notification:updated', updated)
        if (ack) ack({ success: true, notification: updated })
      } catch (error) {
        console.error('Error marcando notificación como leída:', error)
        if (ack) ack({ success: false, error: error.message })
      }
    })
  })
}
