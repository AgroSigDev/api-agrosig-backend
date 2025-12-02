import express from 'express'
import { registerActivity, getActivities, getActivity, getAllActivities } from '../../controllers/index.js'
import { autenticate } from '../../middlewares/index.js'
import { ValidationError } from '../../lib/api.errors.js'
import { logger } from '../../utils/logger.utils.js'

const router = express.Router()

// GET /activity/all
router.get('/all', autenticate, async (request, response) => {
  try {
    const userId = request.user.user_id
    logger.info('Solicitud para obtener todas las actividades', { userId })

    const activities = await getAllActivities(userId)

    response.status(200).json({
      success: true,
      message: 'All activities retrieved successfully',
      data: activities
    })

    logger.info('Todas las actividades recuperadas exitosamente', {
      userId,
      count: activities.length
    })
  } catch (error) {
    logger.error('Error obteniendo todas las actividades', {
      userId: request.user?.user_id,
      error: error.message,
      stack: error.stack
    })

    if (error.name && error.statusCode) {
      return response.status(error.statusCode).json({
        success: false,
        message: error.message,
        error: error.code,
        details: error.details
      })
    }

    response.status(500).json({
      success: false,
      message: 'Error al obtener todas las actividades',
      error: 'INTERNAL_SERVER_ERROR'
    })
  }
})

// GET /activity/crop/:cropId
router.get('/crop/:cropId', autenticate, async (request, response) => {
  try {
    const userId = request.user.user_id
    const cropId = request.params.cropId

    logger.info('Solicitud para obtener actividades por cultivo', { userId, cropId })

    const activities = await getActivities(userId, cropId)

    response.status(200).json({
      success: true,
      message: 'Actividades recuperadas exitosamente',
      data: activities
    })

    logger.info('Actividades por cultivo recuperadas exitosamente', {
      userId,
      cropId,
      count: activities.length
    })
  } catch (error) {
    logger.error('Error obteniendo actividades por cultivo', {
      userId: request.user?.user_id,
      cropId: request.params.cropId,
      error: error.message
    })

    if (error.name && error.statusCode) {
      return response.status(error.statusCode).json({
        success: false,
        message: error.message,
        error: error.code,
        details: error.details
      })
    }

    response.status(500).json({
      success: false,
      message: 'Error al obtener las actividades',
      error: 'INTERNAL_SERVER_ERROR'
    })
  }
})

// GET /activity/:activityId
router.get('/:activityId', autenticate, async (request, response) => {
  try {
    const userId = request.user.user_id
    const { activityId } = request.params

    logger.info('Solicitud para obtener actividad específica', { userId, activityId })

    const activity = await getActivity(userId, activityId)

    response.status(200).json({
      success: true,
      message: 'Actividad recuperada exitosamente',
      data: activity
    })

    logger.debug('Actividad recuperada exitosamente', { userId, activityId })
  } catch (error) {
    logger.error('Error obteniendo actividad específica', {
      userId: request.user?.user_id,
      activityId: request.params.activityId,
      error: error.message
    })

    if (error.name && error.statusCode) {
      return response.status(error.statusCode).json({
        success: false,
        message: error.message,
        error: error.code,
        details: error.details
      })
    }

    response.status(500).json({
      success: false,
      message: 'Error al obtener la actividad',
      error: 'INTERNAL_SERVER_ERROR'
    })
  }
})

// POST /activity/register
router.post('/register/:cropId', autenticate, async (request, response) => {
  try {
    const userId = request.user.user_id
    const { cropId } = request.params
    const { activityType, date, description, inputs } = request.body

    logger.info('Solicitud para crear nueva actividad', {
      userId,
      cropId,
      activityType
    })

    const activityData = {
      activity_type: activityType,
      date: date || new Date(),
      description
    }

    // Mapear inputs
    let mappedInputs = []
    if (inputs && Array.isArray(inputs)) {
      mappedInputs = inputs.map(input => {
        const mappedInput = {
          input_name: input.input_name?.trim(),
          unit: input.unit?.trim() || 'unit',
          quantity: parseFloat(input.quantity) || 0,
          unit_cost: parseFloat(input.unit_cost) || 0,
          cost_unit: input.cost_unit?.trim() || input.unit?.trim() || 'unit'
        }

        // Validación básica del mapeo
        if (!mappedInput.input_name) {
          logger.warn('Input sin nombre en el mapeo', { input })
          throw new ValidationError('El nombre del insumo es obligatorio para todos los insumos')
        }

        return mappedInput
      })
    }

    const result = await registerActivity(userId, cropId, activityData, mappedInputs)

    response.status(201).json({
      success: true,
      message: 'Actividad creada exitosamente',
      data: result
    })

    logger.info('Actividad creada exitosamente', {
      userId,
      cropId,
      activityId: result.activity.activity_id,
      inputsCount: result.inputs.length
    })
  } catch (error) {
    logger.error('Error creando actividad', {
      userId: request.user?.user_id,
      cropId: request.params.cropId,
      error: error.message,
      stack: error.stack
    })

    if (error.name && error.statusCode) {
      return response.status(error.statusCode).json({
        success: false,
        message: error.message,
        error: error.code,
        details: error.details
      })
    }

    response.status(500).json({
      success: false,
      message: 'Error al crear la actividad',
      error: 'INTERNAL_SERVER_ERROR'
    })
  }
})

export default router
