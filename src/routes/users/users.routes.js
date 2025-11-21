import express from 'express'
import path from 'path'
import fs from 'fs'
import { getAllUsers, getUserById, updateUserById, updateUserPassword, updateImageUserById, updateRole, updateStatus, deleteUserById } from '../../controllers/index.js'
import { autenticate, authorize } from '../../middlewares/index.js'
import { uploadProfile } from '../../helpers/index.js'
import { BadRequestError } from '../../lib/api.errors.js'
import { logger } from '../../utils/logger.utils.js'

const router = express.Router()

// GET /users/get-user/:id
router.get('/get-user/:id', autenticate, authorize(['admin', 'user']), async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id

    logger.api.info('Solicitud de obtención de usuario propio', {
      userId,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const result = await getUserById(userId)
    if (!result) {
      logger.api.warn('Usuario propio no encontrado', { userId })
      return response.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      })
    }

    const responseTime = Date.now() - startTime

    logger.api.info('Usuario propio obtenido exitosamente', {
      userId,
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de obtención de usuario propio', {
      userId: request.user?.user_id,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// GET /users/
router.get('/', autenticate, authorize(['admin']), async (request, response, next) => {
  const startTime = Date.now()

  try {
    logger.api.info('Solicitud de obtención de todos los usuarios', {
      adminUserId: request.user.user_id,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const result = await getAllUsers()
    const responseTime = Date.now() - startTime

    logger.api.info('Lista de usuarios obtenida exitosamente', {
      totalUsuarios: result.length,
      adminUserId: request.user.user_id,
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de obtención de todos los usuarios', {
      adminUserId: request.user?.user_id,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// PATCH /users/update-profile/:id
router.patch('/update-profile/:id', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id
    const userData = request.body

    logger.api.info('Solicitud de actualización de perfil', {
      userId,
      camposActualizados: Object.keys(userData),
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const result = await updateUserById(userId, userData)
    const responseTime = Date.now() - startTime

    logger.api.info('Perfil actualizado exitosamente', {
      userId,
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de actualización de perfil', {
      userId: request.user?.user_id,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// PATCH /users/update-password/:id
router.patch('/update-password/:id', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id
    const { oldPassword, newPassword, repeatedPassword } = request.body

    logger.api.info('Solicitud de actualización de contraseña', {
      userId,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const result = await updateUserPassword(userId, oldPassword, newPassword, repeatedPassword)
    const responseTime = Date.now() - startTime

    logger.api.info('Contraseña actualizada exitosamente', {
      userId,
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      data: {
        message: 'Password updated successfully',
        user: result
      }
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de actualización de contraseña', {
      userId: request.user?.user_id,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// PATCH /users/image/:id
router.patch('/image/:id', autenticate, uploadProfile, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id

    if (!request.file) {
      logger.api.warn('Intento de actualizar imagen sin archivo', { userId })
      throw new BadRequestError('No se ha proporcionado ninguna imagen')
    }

    const imageFileName = request.file.filename

    logger.api.info('Solicitud de actualización de imagen de perfil', {
      userId,
      imageFileName,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const updatedUser = await updateImageUserById(userId, imageFileName)

    // Eliminar la imagen anterior si existe
    if (updatedUser.oldImagePath) {
      const fullPath = path.join(process.cwd(), 'src/uploads/profile', updatedUser.oldImagePath)
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath)
        logger.api.info('Imagen anterior eliminada del sistema de archivos', {
          userId,
          oldImagePath: updatedUser.oldImagePath
        })
      }
    }

    const responseTime = Date.now() - startTime

    logger.api.info('Imagen de perfil actualizada exitosamente', {
      userId,
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      message: 'Imagen de usuario actualizada correctamente',
      data: {
        imageUrl: `/uploads/profile/${imageFileName}`
      }
    })
  } catch (error) {
    // Eliminar la imagen recién subida si hay error
    if (request.file) {
      const fullPath = path.join(process.cwd(), request.file.path)
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath)
        logger.api.info('Imagen subida eliminada por error en el proceso', {
          filename: request.file.filename
        })
      }
    }

    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de actualización de imagen', {
      userId: request.user?.user_id,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// PATCH /users/update-role/:id
router.patch('/update-role/:id', autenticate, authorize(['admin']), async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.params.id
    const roleId = request.body.role_id

    logger.api.info('Solicitud de actualización de rol', {
      usuarioObjetivo: userId,
      nuevoRol: roleId,
      adminUserId: request.user.user_id,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const result = await updateRole(userId, roleId)
    const responseTime = Date.now() - startTime

    logger.api.info('Rol actualizado exitosamente', {
      usuarioObjetivo: userId,
      nuevoRol: roleId,
      adminUserId: request.user.user_id,
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de actualización de rol', {
      usuarioObjetivo: request.params?.id,
      adminUserId: request.user?.user_id,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// PATCH /users/update-status/:id
router.patch('/update-status/:id', autenticate, authorize(['admin']), async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.params.id
    const { is_active: isActive } = request.body

    logger.api.info('Solicitud de actualización de estado', {
      usuarioObjetivo: userId,
      nuevoEstado: isActive,
      adminUserId: request.user.user_id,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    const result = await updateStatus(userId, isActive)
    const responseTime = Date.now() - startTime

    logger.api.info('Estado actualizado exitosamente', {
      usuarioObjetivo: userId,
      nuevoEstado: isActive,
      adminUserId: request.user.user_id,
      responseTime: `${responseTime}ms`
    })

    response.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de actualización de estado', {
      usuarioObjetivo: request.params?.id,
      adminUserId: request.user?.user_id,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// DELETE /users/:id
router.delete('/:id', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id

    logger.api.info('Solicitud de eliminación de usuario', {
      userId,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    await deleteUserById(userId)
    const responseTime = Date.now() - startTime

    logger.api.info('Usuario eliminado exitosamente', {
      userId,
      responseTime: `${responseTime}ms`
    })

    response.status(204).json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de eliminación de usuario', {
      userId: request.user?.user_id,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

export default router
