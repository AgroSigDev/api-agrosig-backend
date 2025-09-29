import { pool } from '../../lib/db.js'

async function createComment (userId, message) {
  const query = {
    text: `INSERT INTO comments (user_id, message, is_edited, is_deleted, created_at, updated_at)
           VALUES ($1, $2, false, false, NOW(), NOW())
           RETURNING comment_id, user_id, message, created_at, updated_at`,
    values: [userId, message]
  }
  const result = await pool.query(query)
  return result.rows[0]
}

async function updateComment (commentId, userId, message) {
  const query = {
    text: `
      UPDATE comments
      SET message = $1, is_edited = true, updated_at = NOW()
      WHERE comment_id = $2
      RETURNING comment_id, user_id, message, is_edited, updated_at
    `,
    values: [message, commentId]
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
  return result.rows[0]
}

async function deleteComment (commentId) {
  const query = {
    text: `
      UPDATE comments
      SET is_deleted = true, updated_at = NOW()
      WHERE comment_id = $1
      RETURNING comment_id, user_id, is_deleted, updated_at
    `,
    values: [commentId]
  }
  const result = await pool.query(query)
  return result.rows[0]
}

export const Comment = {
  createComment,
  updateComment,
  getCommentOwnerId,
  deleteComment
}
