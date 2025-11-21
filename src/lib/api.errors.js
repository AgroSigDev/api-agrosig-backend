/**
 * @file ApiErrors.js
 * @description Clases de errores personalizados para respuestas de la API.
 * Estas clases extienden la clase Error incorporada e incluyen propiedades adicionales
 * como statusCode y code para un mejor manejo de errores en las respuestas de la API.
 * @module ApiErrors
 * Estas clases se pueden utilizar en el middleware de manejo de errores para enviar respuestas
 * consistentes y estructuradas a los clientes de la API.
 * @example
 * import { ValidationError, AuthError } from './ApiErrors.js';
 */

// Clase base para errores de la API
class ApiError extends Error {
  constructor (name, message, statusCode, code, details = null) {
    super(message)
    this.name = name
    this.statusCode = statusCode
    this.code = code
    this.details = details
    Error.captureStackTrace(this, this.constructor)
  }
}

// 🚫 400 - Error de validación
class ValidationError extends ApiError {
  constructor (message, details) {
    super('ValidationError', message, 400, 'VALIDATION_ERROR', details)
  }
}

// 🔐 401 - Errores de autenticación y autorización
class AuthError extends ApiError {
  constructor (message, details) {
    super('AuthError', message, 401, 'AUTHENTICATION_ERROR', details)
  }
}

// 🚫 403 - Errores de autorización
class ForbiddenError extends ApiError {
  constructor (message, details) {
    super('ForbiddenError', message, 403, 'FORBIDDEN', details)
  }
}

// ❌ 404 - Errores de no encontrado
class NotFoundError extends ApiError {
  constructor (message, details) {
    super('NotFoundError', message, 404, 'NOT_FOUND', details)
  }
}

// ⚠️ 409 - Errores de conflicto
class ConflictError extends ApiError {
  constructor (message, details) {
    super('ConflictError', message, 409, 'CONFLICT', details)
  }
}

// 498 - Errores de expiracion
class TokenExpired extends ApiError {
  constructor (message, details) {
    super('TokenExpired', message, 498, 'INVALID_TOKEN', details)
  }
}

// 🛠️ 500 - Errores de base de datos y servicios
class DatabaseError extends ApiError {
  constructor (message, details) {
    super('DatabaseError', message, 500, 'DATABASE_ERROR', details)
  }
}

// 🚫 503 - Errores de servicio no disponible
class ServiceUnavailableError extends ApiError {
  constructor (message, details) {
    super('ServiceUnavailableError', message, 503, 'SERVICE_UNAVAILABLE', details)
  }
}

// ❗ 400 - Errores de solicitud incorrecta
class BadRequestError extends ApiError {
  constructor (message, details) {
    super('BadRequestError', message, 400, 'BAD_REQUEST', details)
  }
}

// 💥 500 - Errores internos del servidor
class InternalServerError extends ApiError {
  constructor (message, details) {
    super('InternalServerError', message, 500, 'INTERNAL_SERVER_ERROR', details)
  }
}

export {
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TokenExpired,
  DatabaseError,
  ServiceUnavailableError,
  BadRequestError,
  InternalServerError
}
