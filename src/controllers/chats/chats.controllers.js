import { Comment } from '../../models/index.js'

async function registerComment (userId, comment) {
  const data = await Comment.createComment(userId, comment)
  return data
}

async function getAllComments () {
  const data = await Comment.getAllComments()
  return data
}

async function updateComment (userId, commentId, commentData) {
  const data = await Comment.updateComment(userId, commentId, commentData)
  return data
}

async function deleteComment (userId, commentId) {
  const data = await Comment.deleteComment(userId, commentId)
  return data
}

export {
  registerComment,
  getAllComments,
  updateComment,
  deleteComment
}
