import express from 'express'
import { registerComment, getAllComments, updateComment, deleteComment } from '../../controllers/index.js'
import { autenticate } from '../../middlewares/index.js'
import { logger } from '../../utils/logger.utils.js'

const router = express.Router()

// POST /comment/register
router.post('/register', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id
    const commentData = request.body

    logger.api.info('Solicitud de creación de comentario', {
      userId,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const result = await registerComment(userId, commentData)
    const responseTime = Date.now() - startTime

    logger.api.info('Comentario creado exitosamente', {
      userId,
      commentId: result.comment_id,
      responseTime: `${responseTime}ms`
    })

    response.status(201).json({
      success: true,
      message: 'Comentario creado exitosamente',
      data: result
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de creación de comentario', {
      userId: request.user?.user_id,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// GET /comment/comments
router.get('/comments', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    logger.api.info('Solicitud de obtención de todos los comentarios', {
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const result = await getAllComments()
    const responseTime = Date.now() - startTime

    logger.api.info('Comentarios obtenidos exitosamente', {
      total: result.length,
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de obtención de comentarios', {
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// PATCH /comment/update/:commentId
router.patch('/update/:commentId', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id
    const commentId = request.params.commentId
    const commentData = request.body

    logger.api.info('Solicitud de actualización de comentario', {
      userId,
      commentId,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const result = await updateComment(userId, commentId, commentData)
    const responseTime = Date.now() - startTime

    logger.api.info('Comentario actualizado exitosamente', {
      userId,
      commentId,
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      message: 'Comentario actualizado exitosamente',
      data: result
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de actualización de comentario', {
      userId: request.user?.user_id,
      commentId: request.params?.commentId,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// DELETE /comment/delete/:commentId
router.delete('/delete/:commentId', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id
    const commentId = request.params.commentId

    logger.api.info('Solicitud de eliminación de comentario', {
      userId,
      commentId,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    await deleteComment(userId, commentId)
    const responseTime = Date.now() - startTime

    logger.api.info('Comentario eliminado exitosamente', {
      userId,
      commentId,
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      message: 'Comentario eliminado exitosamente'
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de eliminación de comentario', {
      userId: request.user?.user_id,
      commentId: request.params?.commentId,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

export default router
