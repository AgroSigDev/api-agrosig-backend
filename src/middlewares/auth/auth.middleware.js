import { verifyToken, verifyRefresToken } from '../../helpers/jwt.helper.js'
import { generateAuthToken } from '../../utils/token.utils.js'
import { Auth } from '../../models/index.js'
import { AuthError, TokenExpired } from '../../lib/api.errors.js'
import { logger } from '../../utils/logger.utils.js'

/**
 * Middleware to verify JWT token from the Authorization header.
 *
 * Checks for the presence of the token, validates its structure, and verifies it using the secret key.
 * If valid, attaches the decoded user information to the request object.
 * Responds with appropriate error messages if the token is missing, malformed, or invalid.
 *
 * @function
 * @param {import('express').Request} request - Express request object.
 * @param {import('express').Response} response - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {void}
 */

export const autenticate = async (request, response, next) => {
  const accessToken = request.headers.authorization?.split(' ')[1]
  const refreshToken = request.headers['x-refresh-token']

  if (!accessToken && !refreshToken) {
    logger.auth.warn('Middleware auth - Sin tokens proporcionados')
    return next(new AuthError('Authorization header is missing'))
  }

  try {
    if (accessToken) {
      const decoded = verifyToken(accessToken)
      request.user = { user_id: decoded.user_id, role_id: decoded.role_id }
      logger.auth.info('Middleware auth - Token de acceso válido', {
        userId: decoded.user_id
      })
      return next()
    }
  } catch (error) {
    logger.auth.warn('Middleware auth - Token de acceso expirado')
    return next(new TokenExpired('Token Expired'))
  }

  try {
    if (refreshToken) {
      await Auth.validateRefreshToken(refreshToken)
      const refreshDecoded = verifyRefresToken(refreshToken)
      const user = {
        user_id: refreshDecoded.user_id,
        role_id: refreshDecoded.role_id
      }
      const newAccessToken = generateAuthToken(user)
      response.set('x-new-access-token', newAccessToken)
      request.user = user

      logger.auth.info('Middleware auth - Token refrescado exitosamente', {
        userId: user.user_id
      })

      return next()
    }
  } catch (error) {
    logger.auth.error('Middleware auth - Error refrescando token', {
      error: error.message
    })
    next(error)
  }
}
