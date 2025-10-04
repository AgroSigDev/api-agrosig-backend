import { Comment } from '../../models/index.js'

async function getAllComments () {
  try {
    const comments = await Comment.getAllComments()

    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.getReplies(comment.comment_id)
        return {
          ...comment,
          user: {
            user_id: comment.user_id,
            first_name: comment.first_name,
            paternal_surname: comment.paternal_surname
          },
          replies: replies.map(reply => ({
            ...reply,
            user: {
              user_id: reply.user_id,
              first_name: reply.first_name,
              paternal_surname: reply.paternal_surname
            }
          }))
        }
      })
    )

    return commentsWithReplies
  } catch (error) {
    console.error('Error en getAllComments:', error)
    throw error
  }
}

async function getCommentWithReplies (commentId) {
  const comment = await Comment.getCommentById(commentId)
  if (!comment) throw new Error('COMMENT_NOT_FOUND')

  const replies = await Comment.getReplies(commentId)
  return {
    ...comment,
    replies
  }
}

async function getListMessageByUserId (userId, commentId) {
  const message = await Comment.getCommentById(userId, commentId)
  return message
}

async function createComment (userId, message, parentCommentId = null) {
  // Si es una respuesta, verificar que el comentario padre existe
  if (parentCommentId) {
    const parentComment = await Comment.getCommentById(parentCommentId)
    if (!parentComment) throw new Error('PARENT_COMMENT_NOT_FOUND')
    if (parentComment.is_deleted) throw new Error('PARENT_COMMENT_DELETED')
  }

  const newComment = await Comment.createComment(userId, message, parentCommentId)
  return newComment
}

async function updateComment (userId, commentId, message) {
  const comment = await Comment.getCommentById(commentId)
  if (!comment) throw new Error('COMMENT_NOT_FOUND')
  if (comment.user_id !== userId) throw new Error('FORBIDDEN')
  if (comment.is_deleted) throw new Error('COMMENT_DELETED')

  const updatedComment = await Comment.updateComment(commentId, userId, message)
  return updatedComment
}

async function deleteComment (userId, commentId) {
  const comment = await Comment.getCommentById(commentId)
  if (!comment) throw new Error('COMMENT_NOT_FOUND')
  if (comment.user_id !== userId) throw new Error('FORBIDDEN')

  const deletedComment = await Comment.deleteComment(commentId, userId)
  return deletedComment
}

export {
  getAllComments,
  getCommentWithReplies,
  getListMessageByUserId,
  createComment,
  updateComment,
  deleteComment
}
