import { NotFoundError } from '../../lib/api.errors.js'
import { Activitys } from '../../models/index.js'
import { logger } from '../../utils/logger.utils.js'

async function registerActivity (userId, cropId, activityData, inputs) {
  try {
    logger.activities.info('Controlador - Registrando actividad', { userId, cropId })
    const data = await Activitys.createActivityWithInputs(userId, cropId, activityData, inputs)
    logger.activities.info('Controlador - Actividad registrada exitosamente', { userId, cropId, activityId: data.activity.activity_id })
    return data
  } catch (error) {
    logger.activities.error('Controlador - Error registrando actividad', {
      userId,
      cropId,
      error: error.message
    })
    throw error
  }
}

async function getActivities (userId, cropId) {
  try {
    logger.activities.info('Controlador - Obteniendo actividades por cultivo', { userId, cropId })

    const crop = await Activitys.getCropById(userId, cropId)
    if (!crop) {
      logger.activities.warn('Controlador - Cultivo no encontrado al obtener actividades', {
        userId,
        cropId
      })
      throw new NotFoundError('Cultivo no encontrado o no pertenece al usuario', {
        cropId,
        userId
      })
    }

    const activities = await Activitys.getActivitiesByCrop(userId, cropId)

    logger.activities.info('Controlador - Actividades por cultivo obtenidas exitosamente', {
      userId,
      cropId,
      total: activities.length,
      cropType: crop.crop_type
    })

    return activities
  } catch (error) {
    logger.activities.error('Controlador - Error obteniendo actividades por cultivo', {
      userId,
      cropId,
      error: error.message
    })
    throw error
  }
}

async function getActivity (userId, activityId) {
  try {
    logger.activities.info('Controlador - Obteniendo actividad por ID', { userId, activityId })
    const activity = await Activitys.getActivityById(userId, activityId)
    if (activity) {
      logger.activities.info('Controlador - Actividad obtenida exitosamente', { userId, activityId })
    } else {
      logger.activities.warn('Controlador - Actividad no encontrada', { userId, activityId })
      throw new NotFoundError('Actividad no encontrada')
    }
    return activity
  } catch (error) {
    logger.activities.error('Controlador - Error obteniendo actividad por ID', {
      userId,
      activityId,
      error: error.message
    })
    throw error
  }
}

async function getAllActivities (userId) {
  try {
    logger.activities.info('Controlador - Obteniendo todas las actividades', { userId })
    const activities = await Activitys.getAllActivitiesByUser(userId)
    logger.activities.info('Controlador - Todas las actividades obtenidas exitosamente', { userId, total: activities.length })
    return activities
  } catch (error) {
    logger.activities.error('Controlador - Error obteniendo todas las actividades', {
      userId,
      error: error.message
    })
    throw error
  }
}

export {
  registerActivity,
  getActivities,
  getActivity,
  getAllActivities
}
