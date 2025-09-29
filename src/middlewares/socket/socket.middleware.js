import { autenticate } from '../index.js'

export const socketAuthMiddleware = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token
    if (!token) return next(new Error('unauthenticated'))

    const payload = autenticate(token)
    socket.user = { user_id: payload.user_id, email: payload.email, role_id: payload.role_id || null }
    return next()
  } catch (err) {
    return next(new Error('unauthenticated'))
  }
}
