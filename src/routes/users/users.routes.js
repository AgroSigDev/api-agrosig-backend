import express from 'express'
import path from 'path'
import fs from 'fs'
import { getAllUsers, getUserById, updateUserById, updateUserPassword, updateImageUserById, deleteUserById } from '../../controllers/index.js'
import { autenticate, authorize } from '../../middlewares/index.js'
import { uploadProfile } from '../../helpers/index.js'

const router = express.Router()

// GET /users/:id
router.get('/get-user/:id', autenticate, authorize(['admin', 'user']), async (request, response, next) => {
  try {
    const userId = request.user.user_id
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
router.get('/', autenticate, authorize(['admin']), async (request, response, next) => {
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
router.patch('/update-profile/:id', autenticate, async (request, response, next) => {
  try {
    const userId = request.user.user_id
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
router.patch('/update-password/:id', autenticate, async (request, response, next) => {
  try {
    const userId = request.user.user_id
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

// PATCH /users/image/:id
router.patch('/image/:id', autenticate, uploadProfile, async (request, response, next) => {
  try {
    const userId = request.user.user_id

    // Verificar que se subió un archivo
    if (!request.file) {
      throw new Error('No se ha proporcionado ninguna imagen')
    }

    // Obtener solo el nombre del archivo para almacenar en BD
    const imageFileName = request.file.filename

    // Llamar al controlador (que pasará al modelo)
    const updatedUser = await updateImageUserById(userId, imageFileName)

    // Eliminar la imagen anterior si existe
    if (updatedUser.oldImagePath) {
      const fullPath = path.join(process.cwd(), 'src/uploads/profile', updatedUser.oldImagePath)
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath)
      }
    }

    response.status(200).json({
      success: true,
      message: 'Imagen de usuario actualizada correctamente',
      data: {
        imageUrl: `/uploads/profile/${imageFileName}`
      }
    })
  } catch (error) {
    // Eliminar la imagen recién subida si hay error
    if (request.file) {
      const fullPath = path.join(process.cwd(), request.file.path)
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath)
      }
    }

    console.error('Error al actualizar imagen:', error)
    response.status(500).json({
      success: false,
      message: 'Error al actualizar imagen',
      error: error.message
    })
  }
})

// DELETE /users/:id
router.delete('/:id', autenticate, async (request, response, next) => {
  try {
    const userId = request.user.user_id
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
