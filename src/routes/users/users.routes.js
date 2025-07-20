import express from 'express'
import { getAllUsers, getUserById, updateUserById, updateUserPassword, deleteUserById } from '../../controllers/index.js'
import { autenticate } from '../../middlewares/validations/auth.middleware.js'

const router = express.Router()

// GET /users/:id
router.get('/:id', autenticate, async (request, response, next) => {
  try {
    const userId = request.params.id
    const result = await getUserById(userId)
    if (!result) {
      return response.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      })
    }
    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
})

// GET /users
router.get('/', autenticate, async (request, response, next) => {
  try {
    const result = await getAllUsers()
    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
})

// PATCH /users/:id
router.patch('/:id', autenticate, async (request, response, next) => {
  try {
    const userId = request.params.id
    const userData = request.body
    const result = await updateUserById(userId, userData)
    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
})

// PATCH /users/:id/password
router.patch('/password/:id', autenticate, async (request, response, next) => {
  try {
    const userId = request.params.id
    const { oldPassword, newPassword, repeatedPassword } = request.body

    const result = await updateUserPassword(
      userId,
      oldPassword,
      newPassword,
      repeatedPassword
    )
    response.status(200).json({
      success: true,
      data: {
        message: 'Password updated successfully',
        user: result
      }
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /users/:id
router.delete('/:id', autenticate, async (request, response, next) => {
  try {
    const userId = request.params.id
    await deleteUserById(userId)
    response.status(204).json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    })
  } catch (error) {
    next(error)
  }
})

export default router
