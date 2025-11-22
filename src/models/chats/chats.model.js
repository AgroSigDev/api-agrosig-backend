import { pool } from '../../lib/db.js'
import { validFieldsRegisterComment } from '../../middlewares/index.js'
import {
  ValidationError,
  NotFoundError,
  InternalServerError
} from '../../lib/api.errors.js'
import { logger } from '../../utils/logger.utils.js'

/**
 * Creates a new comment for a specific user.
 * Validates the comment data and inserts it into the database.
 * @param {number} userId - The ID of the user creating the comment.
 * @param {object} comment - The comment data object.
 * @param {string} comment.message - The content of the comment message.
 * @returns {Promise<object>} The created comment object with database fields.
 * @throws {ValidationError} If comment validation fails.
 * @throws {InternalServerError} For database or other unexpected errors.
 */
async function createComment (userId, comment) {
  try {
    logger.comments.info('Creando comentario', { userId, comment })

    await validFieldsRegisterComment(comment)

    const registerQuery = {
      text: `INSERT INTO comments (user_id, message) 
             VALUES ($1, $2) 
             RETURNING *`,
      values: [userId, comment.message]
    }

    const result = await pool.query(registerQuery)
    const newComment = result.rows[0]

    logger.comments.info('Comentario creado exitosamente', {
      userId,
      commentId: newComment.comment_id
    })

    return newComment
  } catch (error) {
    logger.comments.error('Error creando comentario', {
      userId,
      error: error.message,
      comment
    })

    if (error instanceof ValidationError) {
      throw error
    }
    throw new InternalServerError('Error creating comment', { original: error.message })
  }
}

/**
 * Updates an existing comment for a specific user.
 * Validates ownership and updates the comment message, marking it as edited.
 * @param {number} userId - The ID of the user updating the comment.
 * @param {number} commentId - The ID of the comment to update.
 * @param {object} commentData - The updated comment data object.
 * @param {string} commentData.message - The new content of the comment message.
 * @returns {Promise<object>} The updated comment object with database fields.
 * @throws {ValidationError} If comment validation fails.
 * @throws {NotFoundError} If comment doesn't exist or user is not authorized.
 * @throws {InternalServerError} For database or other unexpected errors.
 */
async function updateComment (userId, commentId, commentData) {
  try {
    logger.comments.info('Actualizando comentario', {
      userId,
      commentId,
      commentData
    })

    await validFieldsRegisterComment(commentData)

    const updateQuery = {
      text: `UPDATE comments 
             SET message = $1, is_edited = true, updated_at = CURRENT_TIMESTAMP 
             WHERE comment_id = $2 AND user_id = $3 
             RETURNING *`,
      values: [commentData.message, commentId, userId]
    }

    const result = await pool.query(updateQuery)

    if (result.rows.length === 0) {
      logger.comments.warn('Comentario no encontrado o usuario no autorizado', {
        userId,
        commentId
      })
      throw new NotFoundError('Comment not found or user not authorized')
    }

    const updatedComment = result.rows[0]

    logger.comments.info('Comentario actualizado exitosamente', {
      userId,
      commentId
    })

    return updatedComment
  } catch (error) {
    logger.comments.error('Error actualizando comentario', {
      userId,
      commentId,
      error: error.message,
      commentData
    })

    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error
    }
    throw new InternalServerError('Error updating comment', { original: error.message })
  }
}

/**
 * Retrieves all non-deleted comments with user information.
 * Joins comments with users table to include author details.
 * @returns {Promise<Array>} Array of comment objects with user information.
 * @throws {InternalServerError} For database or other unexpected errors.
 */
async function getAllComments () {
  try {
    logger.comments.info('Obteniendo todos los comentarios')

    const query = {
      text: `SELECT c.*, u.first_name, u.email 
             FROM comments c 
             JOIN users u ON c.user_id = u.user_id 
             WHERE c.is_deleted = false 
             ORDER BY c.created_at DESC`
    }

    const result = await pool.query(query)
    const comments = result.rows

    logger.comments.info('Comentarios obtenidos exitosamente', {
      total: comments.length
    })

    return comments
  } catch (error) {
    logger.comments.error('Error obteniendo comentarios', {
      error: error.message
    })
    throw new InternalServerError('Error getting comments', { original: error.message })
  }
}

/**
 * Soft deletes a comment by marking it as deleted.
 * Validates that the user owns the comment before deletion.
 * @param {number} userId - The ID of the user deleting the comment.
 * @param {number} commentId - The ID of the comment to delete.
 * @returns {Promise<object>} The deleted comment object with database fields.
 * @throws {NotFoundError} If comment doesn't exist or user is not authorized.
 * @throws {InternalServerError} For database or other unexpected errors.
 */
async function deleteComment (userId, commentId) {
  try {
    logger.comments.info('Eliminando comentario', {
      userId,
      commentId
    })

    const query = {
      text: `UPDATE comments 
             SET is_deleted = true, updated_at = CURRENT_TIMESTAMP 
             WHERE comment_id = $1 AND user_id = $2 
             RETURNING *`,
      values: [commentId, userId]
    }

    const result = await pool.query(query)

    if (result.rows.length === 0) {
      logger.comments.warn('Comentario no encontrado o usuario no autorizado', {
        userId,
        commentId
      })
      throw new NotFoundError('Comment not found or user not authorized')
    }

    const deletedComment = result.rows[0]

    logger.comments.info('Comentario eliminado exitosamente', {
      userId,
      commentId
    })

    return deletedComment
  } catch (error) {
    logger.comments.error('Error eliminando comentario', {
      userId,
      commentId,
      error: error.message
    })

    if (error instanceof NotFoundError) {
      throw error
    }
    throw new InternalServerError('Error deleting comment', { original: error.message })
  }
}

export const Comment = {
  createComment,
  updateComment,
  getAllComments,
  deleteComment
}
