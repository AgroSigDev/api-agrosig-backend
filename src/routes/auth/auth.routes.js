import express from 'express'
import { registerUser, loginUser, logoutUser } from '../../controllers/index.js'
import { uploadProfile } from '../../helpers/index.js'
import { logger } from '../../utils/logger.utils.js'
import { BadRequestError } from '../../lib/api.errors.js'

const router = express.Router()

// POST /auth/register
router.post('/register', uploadProfile, async (request, response, next) => {
  const startTime = Date.now()

  try {
    logger.api.info('Solicitud de registro recibida', {
      email: request.body.email,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const user = request.body
    if (request.file) {
      user.image_user = request.file.filename
      logger.api.info('Imagen de perfil subida en registro', {
        filename: request.file.filename,
        email: user.email
      })
    }

    const result = await registerUser(user)
    const responseTime = Date.now() - startTime

    logger.api.info('Registro completado exitosamente', {
      email: user.email,
      userId: result.result.user_id,
      responseTime: `${responseTime}ms`
    })

    response.status(201).json({
      success: true,
      message: 'User created successfully',
      data: result.result,
      token: result.token
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de registro', {
      email: request.body.email,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// POST /auth/login
router.post('/login', async (request, response, next) => {
  const startTime = Date.now()

  try {
    logger.api.info('Solicitud de login recibida', {
      email: request.body.email,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const userData = request.body
    const result = await loginUser(userData)
    const responseTime = Date.now() - startTime

    logger.api.info('Login completado exitosamente', {
      email: userData.email,
      userId: result.user.user_id,
      responseTime: `${responseTime}ms`
    })

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
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de login', {
      email: request.body.email,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// POST /auth/logout
router.post('/logout', async (request, response, next) => {
  const startTime = Date.now()

  try {
    const refreshToken = request.headers['x-refresh-token']

    if (!refreshToken) {
      logger.api.warn('Intento de logout sin refresh token')
      throw new BadRequestError('Missing refresh token in headers')
    }

    await logoutUser(refreshToken)
    const responseTime = Date.now() - startTime

    logger.api.info('Logout completado exitosamente', {
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      message: 'Logout successful. Session terminated.'
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de logout', {
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

export default router
