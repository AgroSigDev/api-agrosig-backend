import express from 'express'
import { registerComment, getAllComments, updateComment, deleteComment } from '../../controllers/index.js'
import { autenticate } from '../../middlewares/index.js'

const router = express.Router()

// POST /comment/register
router.post('/register', autenticate, async (request, response, next) => {
  try {
    const userId = request.user.user_id
    const commentData = request.body
    const result = await registerComment(userId, commentData)
    response.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: result
    })
  } catch (error) {
    console.log('Error creating comment: ', error)
    response.status(500).json({
      success: false,
      message: 'Error creting comment',
      error: error.message
    })
  }
})

router.get('/comments', autenticate, async (request, response) => {
  try {
    const result = await getAllComments()
    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    console.log('Error getting comments: ', error)
    response.status(500).json({
      success: false,
      message: 'Error creting comments',
      error: error.message
    })
  }
})

router.patch('/update/:commentId', autenticate, async (request, response, next) => {
  try {
    const userId = request.user.user_id
    const commentId = request.params.commentId
    const commentData = request.body

    const result = await updateComment(userId, commentId, commentData)
    response.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: result
    })
  } catch (error) {
    console.log('Error updating Comment: ', error)
    response.status(500).json({
      success: false,
      message: 'Error updating Comment',
      error: error.message
    })
  }
})

router.delete('/delete/:commentId', autenticate, async (request, response, next) => {
  try {
    const userId = request.user.user_id
    const commentId = request.params.commentId
    await deleteComment(userId, commentId)
    response.status(200).json({
      success: true,
      message: 'Comment Delete Succefully'
    })
  } catch (error) {
    console.log(error)
    next(error)
  }
})

export default router
