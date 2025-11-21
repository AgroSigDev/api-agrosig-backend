import { logger } from '../../utils/logger.utils.js'
import { config } from '../../../config.js'
import { InternalServerError } from '../../lib/api.errors.js'

/**
 * Middleware global para manejar errores en una aplicación Express.
 *
 * Captura cualquier error lanzado en la aplicación y:
 * - Devuelve una respuesta JSON estandarizada con el código y mensaje de error.
 * - Registra el error en archivo mediante Winston.
 * - Incluye trazas y detalles adicionales en entornos de desarrollo.
 *
 * @function errorHandler
 * @param {Error} err - Objeto de error lanzado o pasado a next().
 * @param {import('express').Request} req - Objeto de solicitud HTTP.
 * @param {import('express').Response} res - Objeto de respuesta HTTP.
 * @param {import('express').NextFunction} next - Función para continuar con el siguiente middleware.
 */

export function errorHandler (err, req, res, next) {
  const isDevelopment = config.ENV === 'development'

  // Si el error no es una instancia de tu clase base, lo convertimos
  if (!(err instanceof Error) || !err.statusCode) {
    err = new InternalServerError('Unexpected Error', { original: err })
  }

  const statusCode = err.statusCode || 500
  const code = err.code || 'INTERNAL_SERVER_ERROR'
  const message = err.message || 'An unexpected error occurred'

  // Log del error - usando Winston
  logger.error({
    message,
    code,
    StatusCode: statusCode,
    stack: err.stack,
    details: err.details,
    path: req.originalUrl,
    method: req.method,
    user: req.user ? req.user.id : undefined
  })

  // Construcción de respuesta
  const response = {
    status: 'error',
    httpStatus: statusCode,
    code,
    message
  }

  if (isDevelopment) {
    response.details = err.details
    response.stack = err.stack
  }

  res.status(statusCode).json(response)
}
