import { pool } from '../../lib/db.js'
import { validFieldsRegisterComment } from '../../middlewares/index.js'

async function createComment (userId, comment) {
  try {
    await validFieldsRegisterComment(comment)

    const registerQuery = {
      text: `INSERT INTO comments (user_id, message) 
             VALUES ($1, $2) 
             RETURNING *`,
      values: [userId, comment.message]
    }

    const result = await pool.query(registerQuery)
    return result.rows[0]
  } catch (error) {
    console.log('Error creating Comment: ', error)
    throw error
  }
}

async function updateComment (userId, commentId, commentData) {
  try {
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
      throw new Error('Comment not found or user not authorized')
    }

    return result.rows[0]
  } catch (error) {
    console.log('Error updating comment: ', error)
    throw error
  }
}

async function getAllComments () {
  try {
    const query = {
      text: `SELECT c.*, u.first_name, u.email 
             FROM comments c 
             JOIN users u ON c.user_id = u.user_id 
             WHERE c.is_deleted = false 
             ORDER BY c.created_at DESC`
    }
    const result = await pool.query(query)
    return result.rows
  } catch (error) {
    console.log('Error getting comments: ', error)
    throw error
  }
}

async function deleteComment (userId, commentId) {
  try {
    // Soft delete en lugar de eliminar físicamente
    const query = {
      text: `UPDATE comments 
             SET is_deleted = true, updated_at = CURRENT_TIMESTAMP 
             WHERE comment_id = $1 AND user_id = $2 
             RETURNING *`,
      values: [commentId, userId]
    }

    const result = await pool.query(query)

    if (result.rows.length === 0) {
      throw new Error('Comment not found or user not authorized')
    }

    return result.rows[0]
  } catch (error) {
    console.log('Error deleting comment: ', error)
    throw error
  }
}

export const Comment = {
  createComment,
  updateComment,
  getAllComments,
  deleteComment
}
