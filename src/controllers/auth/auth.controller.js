import { Auth } from '../../models/index.js'
import { logger } from '../../utils/logger.utils.js'

async function registerUser (user) {
  try {
    logger.auth.info('Controlador - Procesando registro', { email: user.email })
    const data = await Auth.registerUser(user)
    logger.auth.info('Controlador - Registro completado', { email: user.email })
    return data
  } catch (error) {
    logger.auth.error('Controlador - Error en registro', {
      email: user.email,
      error: error.message
    })
    throw error
  }
}

async function loginUser (user) {
  try {
    logger.auth.info('Controlador - Procesando login', { email: user.email })
    const data = await Auth.loginUser(user)
    logger.auth.info('Controlador - Login completado', { email: user.email })
    return data
  } catch (error) {
    logger.auth.error('Controlador - Error en login', {
      email: user.email,
      error: error.message
    })
    throw error
  }
}

async function logoutUser (refreshToken) {
  try {
    logger.auth.info('Controlador - Procesando logout')
    const data = await Auth.logoutUser(refreshToken)
    logger.auth.info('Controlador - Logout completado')
    return data
  } catch (error) {
    logger.auth.error('Controlador - Error en logout', {
      refreshToken,
      error: error.message
    })
    throw error
  }
}

export {
  registerUser,
  loginUser,
  logoutUser
}
