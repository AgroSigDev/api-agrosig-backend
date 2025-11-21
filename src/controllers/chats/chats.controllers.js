import { Comment } from '../../models/index.js'
import { logger } from '../../utils/logger.utils.js'

async function registerComment (userId, comment) {
  try {
    logger.comments.info('Controlador - Registrando comentario', { userId })
    const data = await Comment.createComment(userId, comment)
    logger.comments.info('Controlador - Comentario registrado exitosamente', {
      userId,
      commentId: data.comment_id
    })
    return data
  } catch (error) {
    logger.comments.error('Controlador - Error registrando comentario', {
      userId,
      error: error.message
    })
    throw error
  }
}

async function getAllComments () {
  try {
    logger.comments.info('Controlador - Obteniendo todos los comentarios')
    const data = await Comment.getAllComments()
    logger.comments.info('Controlador - Comentarios obtenidos exitosamente', {
      total: data.length
    })
    return data
  } catch (error) {
    logger.comments.error('Controlador - Error obteniendo comentarios', {
      error: error.message
    })
    throw error
  }
}

async function updateComment (userId, commentId, commentData) {
  try {
    logger.comments.info('Controlador - Actualizando comentario', {
      userId,
      commentId
    })
    const data = await Comment.updateComment(userId, commentId, commentData)
    logger.comments.info('Controlador - Comentario actualizado exitosamente', {
      userId,
      commentId
    })
    return data
  } catch (error) {
    logger.comments.error('Controlador - Error actualizando comentario', {
      userId,
      commentId,
      error: error.message
    })
    throw error
  }
}

async function deleteComment (userId, commentId) {
  try {
    logger.comments.info('Controlador - Eliminando comentario', {
      userId,
      commentId
    })
    const data = await Comment.deleteComment(userId, commentId)
    logger.comments.info('Controlador - Comentario eliminado exitosamente', {
      userId,
      commentId
    })
    return data
  } catch (error) {
    logger.comments.error('Controlador - Error eliminando comentario', {
      userId,
      commentId,
      error: error.message
    })
    throw error
  }
}

export {
  registerComment,
  getAllComments,
  updateComment,
  deleteComment
}
