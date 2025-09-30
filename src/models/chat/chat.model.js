import { pool } from '../../lib/db.js'

async function createComment (userId, message, parentCommentId = null) {
  const query = {
    text: `INSERT INTO comments (user_id, message, parent_comment_id, comment_level, is_edited, is_deleted, created_at, updated_at)
           VALUES ($1, $2, $3, $4, false, false, NOW(), NOW())
           RETURNING comment_id, user_id, message, parent_comment_id, comment_level, created_at, updated_at`,
    values: [userId, message, parentCommentId, parentCommentId ? 1 : 0] // nivel 1 si es respuesta
  }
  const result = await pool.query(query)
  return result.rows[0]
}

async function getCommentById (commentId) {
  const query = {
    text: `SELECT c.*, u.first_name, u.paternal_surname 
           FROM comments c 
           JOIN users u ON c.user_id = u.user_id 
           WHERE c.comment_id = $1`,
    values: [commentId]
  }
  const result = await pool.query(query)
  return result.rows[0]
}

async function getCommentOwnerId (commentId) {
  const query = {
    text: 'SELECT user_id FROM comments WHERE comment_id = $1',
    values: [commentId]
  }
  const result = await pool.query(query)
  return result.rows[0]?.user_id
}

async function getReplies (commentId) {
  const query = {
    text: `SELECT c.*, u.first_name, u.paternal_surname 
           FROM comments c 
           JOIN users u ON c.user_id = u.user_id 
           WHERE c.parent_comment_id = $1 AND c.is_deleted = false
           ORDER BY c.created_at ASC`,
    values: [commentId]
  }
  const result = await pool.query(query)
  return result.rows
}

async function getAllComments () {
  const query = {
    text: `SELECT c.*, u.first_name, u.paternal_surname 
           FROM comments c 
           JOIN users u ON c.user_id = u.user_id 
           WHERE c.parent_comment_id IS NULL AND c.is_deleted = false
           ORDER BY c.created_at DESC`
  }
  const result = await pool.query(query)
  return result.rows
}

async function updateComment (commentId, userId, message) {
  const query = {
    text: `
      UPDATE comments
      SET message = $1, is_edited = true, updated_at = NOW()
      WHERE comment_id = $2 AND user_id = $3
      RETURNING comment_id, user_id, message, is_edited, updated_at
    `,
    values: [message, commentId, userId]
  }
  const result = await pool.query(query)
  return result.rows[0]
}

async function deleteComment (commentId, userId) {
  const query = {
    text: `
      UPDATE comments
      SET is_deleted = true, updated_at = NOW()
      WHERE comment_id = $1 AND user_id = $2
      RETURNING comment_id, user_id, is_deleted, updated_at
    `,
    values: [commentId, userId]
  }
  const result = await pool.query(query)
  return result.rows[0]
}

export const Comment = {
  createComment,
  getCommentById,
  getCommentOwnerId,
  getReplies,
  getAllComments,
  updateComment,
  deleteComment
}
