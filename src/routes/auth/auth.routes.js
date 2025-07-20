import express from 'express'
import { registerUser, loginUser } from '../../controllers/index.js'
import { uploadProfile } from '../../helpers/multer.config.js'

const router = express.Router()

// POST /auth/register
router.post('/register', uploadProfile, async (request, response, next) => {
  try {
    const user = request.body
    if (request.file) {
      user.image_user = request.file.filename
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

// POST /auth/login
router.post('/login', async (request, response, next) => {
  try {
    const userData = request.body
    const token = await loginUser(userData)
    response.status(200).json({
      success: true,
      message: 'User logged in successfully',
      data: token
    })
  } catch (error) {
    console.error('Error logging in user:', error)
    response.status(500).json({
      success: false,
      message: 'Error logging in user',
      error: error.message
    })
  }
})

export default router
