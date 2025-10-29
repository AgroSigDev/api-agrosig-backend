import { verifyToken, verifyRefresToken } from '../../helpers/jwt.helper.js'
import { generateAuthToken } from '../../utils/token.utils.js'
import { Auth } from '../../models/index.js'

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
    return response.status(403).json({
      success: false,
      message: 'Unauthorized access, the token is missing'
    })
  }

  try {
    if (accessToken) {
      const decoded = verifyToken(accessToken)
      request.user = { user_id: decoded.user_id, role_id: decoded.role_id }
      return next()
    }
  } catch (error) {
    if (error.name !== 'TokenExpiredError') return next(error)
  }

  try {
    if (refreshToken) {
      await Auth.validateRefreshToken(refreshToken)
      const refreshDecoded = verifyRefresToken(refreshToken)
      const user = { user_id: refreshDecoded.user_id, role_id: refreshDecoded.role_id }
      const newAccessToken = generateAuthToken(user)
      response.set('x-new-access-token', newAccessToken)
      request.user = user
      return next()
    }
  } catch (error) {
    return response.status(401).json({
      success: false,
      message: 'Invalid or revoked refresh token',
      error: error.message
    })
  }
}
