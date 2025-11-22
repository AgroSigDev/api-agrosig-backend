import express from 'express'
import NotificationScheduler from '../../services/notifications.scheduler.service.js'
import { getUserNotifications, markAsRead, markAllAsRead, getUnreadCount } from '../../controllers/index.js'
import { autenticate, authorize } from '../../middlewares/index.js'
import { logger } from '../../utils/logger.utils.js'

const router = express.Router()

// GET /notifications/notifications
router.get('/notifications', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id
    const { limit = 20, offset = 0, unread_only: unreadOnly = false } = request.query

    logger.api.info('Solicitud de obtención de notificaciones', {
      userId,
      limit,
      offset,
      unreadOnly,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const notifications = await getUserNotifications(
      userId,
      parseInt(limit),
      parseInt(offset),
      unreadOnly === 'true'
    )
    const responseTime = Date.now() - startTime

    logger.api.info('Notificaciones obtenidas exitosamente', {
      userId,
      total: notifications.length,
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      notifications,
      total: notifications.length
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de obtención de notificaciones', {
      userId: request.user?.user_id,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// GET /notifications/unread/count
router.get('/unread/count', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id

    logger.api.info('Solicitud de obtención de conteo de no leídas', {
      userId,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const unreadCount = await getUnreadCount(userId)
    const responseTime = Date.now() - startTime

    logger.api.info('Conteo de no leídas obtenido exitosamente', {
      userId,
      unreadCount,
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      unread_count: unreadCount
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de obtención de conteo de no leídas', {
      userId: request.user?.user_id,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// PUT /notifications/read/:notification_id
router.put('/read/:notification_id', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id
    const { notification_id: notificationId } = request.params

    logger.api.info('Solicitud de marcar notificación como leída', {
      userId,
      notificationId,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const result = await markAsRead(userId, notificationId)
    const responseTime = Date.now() - startTime

    logger.api.info('Notificación marcada como leída exitosamente', {
      userId,
      notificationId,
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      message: 'Notificación marcada como leída',
      data: result
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de marcar notificación como leída', {
      userId: request.user?.user_id,
      notificationId: request.params?.notification_id,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// PUT /notifications/read-all
router.put('/read-all', autenticate, authorize(['admin']), async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id

    logger.api.info('Solicitud de marcar todas las notificaciones como leídas', {
      userId,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    await markAllAsRead(userId)
    const responseTime = Date.now() - startTime

    logger.api.info('Todas las notificaciones marcadas como leídas exitosamente', {
      userId,
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de marcar todas las notificaciones como leídas', {
      userId: request.user?.user_id,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// POST /notifications/test/weather
router.post('/test/weather', autenticate, authorize(['admin']), async (request, response, next) => {
  const startTime = Date.now()

  try {
    logger.api.info('Solicitud de prueba de notificaciones de clima', {
      userId: request.user.user_id,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    await NotificationScheduler.sendWeatherNotifications()
    const responseTime = Date.now() - startTime

    logger.api.info('Prueba de notificaciones de clima ejecutada exitosamente', {
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      message: 'Notificaciones de clima ejecutadas manualmente'
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de prueba de notificaciones de clima', {
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// POST /notifications/test/activities
router.post('/test/activities', autenticate, authorize(['admin']), async (request, response, next) => {
  const startTime = Date.now()

  try {
    logger.api.info('Solicitud de prueba de recordatorios de actividades', {
      userId: request.user.user_id,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    await NotificationScheduler.sendActivityReminders()
    const responseTime = Date.now() - startTime

    logger.api.info('Prueba de recordatorios de actividades ejecutada exitosamente', {
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      message: 'Recordatorios de actividades ejecutados manualmente'
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de prueba de recordatorios de actividades', {
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

export default router
