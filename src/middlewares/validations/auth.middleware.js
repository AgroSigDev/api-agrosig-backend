import { verifyToken } from '../../helpers/jwt.helper.js'

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
export const autenticate = (request, response, next) => {
  const token = request.header('Authorization')

  if (!token) {
    return response.status(401).json({
      success: false,
      message: 'Unauthorized access, the token is missing',
      code: 'TOKEN_MISSING',
      details: 'The token is missing'
    })
  }

  const bearer = token.split(' ')[1]

  if (!bearer) {
    return response.status(401).json({
      success: false,
      message: 'Bearer token is missing',
      code: 'BEARER_TOKEN_MISSING',
      details: 'The bearer token is missing'
    })
  }

  try {
    const decoded = verifyToken(bearer)

    if (!decoded.user_id) {
      return response.status(401).json({
        success: false,
        message: 'Invalid token structure',
        code: 'INVALID_TOKEN_STRUCTURE',
        details: 'Token does not contain user_id'
      })
    }

    request.user = {
      user_id: decoded.user_id,
      role_id: decoded.role_id
    }
    next()
  } catch (error) {
    next(error)
  }
}
