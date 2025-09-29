import { Comment } from '../../models/index.js'

async function getListMessageByUserId (userId, commentId) {
  const message = await Comment.getCommentById(userId, commentId)
  return message
}

async function createComment (userId, commentId) {
  const newComment = await Comment.createComment(userId, commentId)
  return newComment
}

async function updateComment (userId, commentId, message) {
  const updateComment = await Comment.updateComment(userId, commentId, message)
  return updateComment
}

async function deleteComment (commentId) {
  await Comment.deleteComment(commentId)
}

export {
  getListMessageByUserId,
  createComment,
  updateComment,
  deleteComment
}
