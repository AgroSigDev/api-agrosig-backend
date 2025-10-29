import express from 'express'
import { registerUser, loginUser, logoutUser } from '../../controllers/index.js'
import { uploadProfile } from '../../helpers/index.js'

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
    const result = await loginUser(userData)
    response.status(200).json({
      success: true,
      message: 'User logged in successfully',
      data: {
        user: result.user,
        token: result.token,
        refreshToken: result.refreshToken
      }
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

// POST /auth/logout
router.post('/logout', async (request, response) => {
  try {
    const refreshToken = request.headers['x-refresh-token']

    if (!refreshToken) {
      return response.status(400).json({
        success: false,
        message: 'Missing refresh token in headers'
      })
    }

    await logoutUser(refreshToken)
    response.status(200).json({
      success: true,
      message: 'Logout successful. Tokens invalidated.'
    })
  } catch (error) {
    console.error('Error logging out user:', error)
    response.status(500).json({
      success: false,
      message: 'Error logging out user',
      error: error.message
    })
  }
})

export default router
