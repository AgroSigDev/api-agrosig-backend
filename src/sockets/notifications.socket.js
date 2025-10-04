import { socketAuthMiddleware } from '../middlewares/index.js'
import { Notifications } from '../models/index.js'

export function socketNotifications (io) {
  const namespace = io.of('/notifications')

  namespace.use(socketAuthMiddleware)

  namespace.on('connection', (socket) => {
    console.log(`Usuario conectado a /notifications: ${socket.user.user_id}`)

    // Unir al usuario a su room personal
    socket.join(`user_${socket.user.user_id}`)

    // Obtener notificaciones no leídas al conectar
    socket.on('notifications:get_unread', async (ack) => {
      try {
        // Aquí necesitarías agregar esta función al modelo
        const unreadNotifications = await Notifications.getUnreadByUserId(socket.user.user_id)
        if (ack) ack({ success: true, notifications: unreadNotifications })
      } catch (error) {
        console.error('Error obteniendo notificaciones no leídas:', error)
        if (ack) ack({ success: false, error: error.message })
      }
    })

    // Marcar una notificación como leída
    socket.on('notification:mark_read', async (payload, ack) => {
      try {
        const { notificationId } = payload
        if (!notificationId) {
          if (ack) ack({ success: false, error: 'notificationId requerido' })
          return
        }

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

    // Marcar todas las notificaciones como leídas
    socket.on('notifications:mark_all_read', async (ack) => {
      try {
        // Aquí necesitarías agregar esta función al modelo
        const updated = await Notifications.markAllAsRead(socket.user.user_id)
        socket.emit('notifications:all_read', { count: updated })
        if (ack) ack({ success: true, count: updated })
      } catch (error) {
        console.error('Error marcando todas las notificaciones como leídas:', error)
        if (ack) ack({ success: false, error: error.message })
      }
    })

    socket.on('disconnect', (reason) => {
      console.log(`notifications: disconnect ${socket.id} user:${socket.user.user_id} reason:${reason}`)
    })
  })
}
