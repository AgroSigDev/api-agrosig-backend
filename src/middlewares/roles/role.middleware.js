import { UsersRoles } from '../../models/index.js'

/**
 * Middleware to authorize users based on their roles.
 *
 * @param {Array<string|number>} allowedRoles - Array of allowed role identifiers.
 * @returns {Function} Express middleware function that checks if the authenticated user has one of the allowed roles.
 *
 * @async
 * @function
 * @throws Will forward any errors to the next middleware.
 *
 * @example
 * app.use('/admin', authorize(['admin', 'superuser']));
 */

export const authorize = (allowedRoles) => {
  return async (request, response, next) => {
    try {
      if (!request.user) {
        return response.status(401).json({
          success: false,
          message: 'Authentication required'
        })
      }

      const userWithRole = await UsersRoles.getUserByIdRole(request.user.user_id)

      if (!userWithRole) {
        return response.status(401).json({
          success: false,
          message: 'Access denied, user not found'
        })
      }

      const role = await UsersRoles.getRoleBYId(userWithRole.role_id)

      if (!role) {
        return response.status(401).json({
          success: false,
          message: 'Access denied, insufficient permissions'
        })
      }
      next()
    } catch (error) {
      console.error('Error en el middleware authorize', error)
      next(error)
    }
  }
}
