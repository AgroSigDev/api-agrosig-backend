import { Role } from '../../models/index.js'
import { AuthError, ForbiddenError } from '../../lib/api.errors.js'
import { logger } from '../../utils/logger.utils.js'

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
        logger.auth.warn('Middleware authorize - Sin usuario autenticado')
        return next(new AuthError('Authentication required'))
      }

      const userWithRole = await Role.getUserByIdRole(request.user.user_id)

      if (!userWithRole) {
        logger.auth.warn('Middleware authorize - Usuario no encontrado en BD', {
          userId: request.user.user_id
        })
        return next(new ForbiddenError('User not found'))
      }

      const role = await Role.getRoleBYId(userWithRole.role_id)

      if (!role) {
        logger.auth.warn('Middleware authorize - Rol no encontrado', {
          userId: request.user.user_id,
          roleId: userWithRole.role_id
        })
        return next(new ForbiddenError('Access denied: insufficient permission'))
      }

      if (!allowedRoles.includes(role.name)) {
        logger.auth.warn('Middleware authorize - Permisos insuficientes', {
          userId: request.user.user_id,
          rolActual: role.name,
          rolesPermitidos: allowedRoles
        })
        return next(new ForbiddenError('Access denied: insufficient permission'))
      }

      logger.auth.info('Middleware authorize - Autorización exitosa', {
        userId: request.user.user_id,
        rol: role.name
      })

      next()
    } catch (error) {
      logger.auth.error('Error en el middleware authorize', {
        userId: request.user?.user_id,
        error: error.message
      })
      next(error)
    }
  }
}
