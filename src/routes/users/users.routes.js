import express from 'express'
import { registerUser } from '../../controllers/auth/auth.controller.js'
import { uploadProfile } from '../../helpers/multer.config.js'

const router = express.Router()

router.post('/register', uploadProfile, async (request, response, next) => {
  try {
    const user = request.body
    if (request.file) {
      user.image_user = request.filename // Asignar la ruta de la imagen al usuario
    }
    const result = await registerUser(user)
    response.status(201).json({
      success: true,
      message: 'User created successfully',
      data: result.result,
      token: result.token
    })
  } catch (error) {
    console.error('Error registering user:', error)
    response.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    })
  }
})

export default router
