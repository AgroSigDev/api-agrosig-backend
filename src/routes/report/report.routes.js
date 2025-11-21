import express from 'express'
import { autenticate } from '../../middlewares/index.js'
import { getReportData, getReportPDF } from '../../controllers/report/report.controllers.js'
import { logger } from '../../utils/logger.utils.js'

const router = express.Router()

// GET /reports/report-data/:cropId
router.get('/report-data/:cropId', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id
    const cropId = request.params.cropId

    logger.api.info('Solicitud de obtención de datos de reporte', {
      userId,
      cropId,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    await getReportData(request, response, next)

    const responseTime = Date.now() - startTime
    logger.api.info('Datos de reporte obtenidos exitosamente', {
      userId,
      cropId,
      responseTime: `${responseTime}ms`
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de obtención de datos de reporte', {
      userId: request.user?.user_id,
      cropId: request.params?.cropId,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

// GET /reports/report-pdf/:cropId
router.get('/report-pdf/:cropId', autenticate, async (request, response, next) => {
  const startTime = Date.now()

  try {
    const userId = request.user.user_id
    const cropId = request.params.cropId

    logger.api.info('Solicitud de generación de PDF de reporte', {
      userId,
      cropId,
      ip: request.ip,
      userAgent: request.get('User-Agent')
    })

    await getReportPDF(request, response, next)

    const responseTime = Date.now() - startTime
    logger.api.info('PDF de reporte generado exitosamente', {
      userId,
      cropId,
      responseTime: `${responseTime}ms`
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.api.error('Error en endpoint de generación de PDF de reporte', {
      userId: request.user?.user_id,
      cropId: request.params?.cropId,
      responseTime: `${responseTime}ms`,
      error: error.message
    })
    next(error)
  }
})

export default router
