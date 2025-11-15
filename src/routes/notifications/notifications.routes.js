import express from 'express'
import NotificationScheduler from '../../services/notifications.scheduler.service.js'
import { getUserNotifications, markAsRead, markAllAsRead, getUnreadCount, sendManualNotification, sendBulkManualNotification, sendNotificationToUser } from '../../controllers/index.js'
import { autenticate, authorize } from '../../middlewares/index.js'

const router = express.Router()

// GET /notifications - Obtener notificaciones del usuario
router.get('/notifications', autenticate, async (request, response, next) => {
  try {
    const userId = request.user.user_id
    const { limit = 20, offset = 0, unread_only: unreadOnly = false } = request.query

    const notifications = await getUserNotifications(
      userId,
      parseInt(limit),
      parseInt(offset),
      unreadOnly === 'true'
    )
    response.status(200).json({
      success: true,
      notifications,
      total: notifications.length
    })
  } catch (error) {
    console.log('Error obteniendo notificaciones: ', error)
    response.status(500).json({
      success: false,
      message: 'Error obteniendo notificaciones'
    })
  }
})

// GET /notifications/unread/count - Obtener conteo de no leídas
router.get('/unread/count', autenticate, async (request, response, next) => {
  try {
    const userId = request.user.user_id

    const unreadCount = await getUnreadCount(userId)

    response.status(200).json({
      success: true,
      unread_count: unreadCount // Ahora es un número
    })
  } catch (error) {
    console.error('Error obteniendo conteo de no leídas:', error)
    response.status(500).json({
      success: false,
      message: 'Error obteniendo conteo de notificaciones no leídas'
    })
  }
})

// POST /notifications/send-to-user/:userId
router.post('/send-to-user/:userId', autenticate, authorize(['admin']), async (request, response) => {
  try {
    await sendNotificationToUser(request, response)
  } catch (error) {
    console.error('Error en ruta send-to-user:', error)
    response.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// POST /notifications/manual/send - Enviar notificación a un usuario específico (Solo admin)
router.post('/manual/send', autenticate, authorize(['admin']), async (request, response) => {
  try {
    await sendManualNotification(request, response)
  } catch (error) {
    console.error('Error en ruta manual send:', error)
    response.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// POST /notifications/manual/send-bulk - Enviar notificación a múltiples usuarios (Solo admin)
router.post('/manual/send-bulk', autenticate, authorize(['admin']), async (request, response) => {
  try {
    await sendBulkManualNotification(request, response)
  } catch (error) {
    console.error('Error en ruta manual send-bulk:', error)
    response.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// PUT /notifications/:notification_id/read - Marcar como leída
router.put('/read/:notification_id', autenticate, async (request, response, next) => {
  try {
    const userId = request.user.user_id
    const { notification_id: notificationId } = request.params

    const result = await markAsRead(userId, notificationId)

    if (result.rowCount === 0) {
      return response.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      })
    }

    response.status(200).json({
      success: true,
      message: 'Notificación marcada como leída'
    })
  } catch (error) {
    console.error('Error marcando notificación como leída:', error)
    response.status(500).json({
      success: false,
      message: 'Error marcando notificación como leída'
    })
  }
})

// PUT /notifications/read-all - Marcar todas como leídas
router.put('/read-all', autenticate, authorize(['admin']), async (request, response, next) => {
  try {
    const userId = request.user.user_id
    await markAllAsRead(userId)

    response.status(200).json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    })
  } catch (error) {
    console.error('Error marcando todas las notificaciones como leídas:', error)
    response.status(500).json({
      success: false,
      message: 'Error marcando todas las notificaciones como leídas'
    })
  }
})

// POST /notifications/test/weather - Disparar notificaciones de clima manualmente
router.post('/test/weather', autenticate, authorize(['admin']), async (request, response, next) => {
  try {
    await NotificationScheduler.sendWeatherNotifications()
    response.status(200).json({
      success: true,
      message: 'Notificaciones de clima ejecutadas manualmente'
    })
  } catch (error) {
    console.error('Error en test de clima:', error)
    response.status(500).json({
      success: false,
      message: 'Error ejecutando notificaciones de clima'
    })
  }
})

// POST /notifications/test/activities - Disparar recordatorios de actividades
router.post('/test/activities', autenticate, authorize(['admin']), async (request, response, next) => {
  try {
    await NotificationScheduler.sendActivityReminders()
    request.status(200).json({
      success: true,
      message: 'Recordatorios de actividades ejecutados manualmente'
    })
  } catch (error) {
    console.error('Error en test de actividades:', error)
    response.status(500).json({
      success: false,
      message: 'Error ejecutando recordatorios de actividades'
    })
  }
})

export default router
