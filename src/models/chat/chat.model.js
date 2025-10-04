import { pool } from '../../lib/db.js'

async function createComment (userId, message, parentCommentId = null) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    let commentLevel = 0
    if (parentCommentId) {
      // Verify parent exists and get its level
      const parentResult = await client.query(
        'SELECT comment_level, is_deleted FROM comments WHERE comment_id = $1',
        [parentCommentId]
      )

      if (parentResult.rows.length === 0) {
        throw new Error('PARENT_COMMENT_NOT_FOUND')
      }
      if (parentResult.rows[0].is_deleted) {
        throw new Error('PARENT_COMMENT_DELETED')
      }

      commentLevel = parentResult.rows[0].comment_level + 1
    }

    const query = {
      text: `INSERT INTO comments (user_id, message, parent_comment_id, comment_level, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             RETURNING comment_id, user_id, message, parent_comment_id, comment_level, created_at, updated_at`,
      values: [userId, message, parentCommentId, commentLevel]
    }

    const result = await client.query(query)
    await client.query('COMMIT')

    return result.rows[0]
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
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
  if (result.rows.length === 0) {
    throw new Error('COMMENT_NOT_FOUND')
  }

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
