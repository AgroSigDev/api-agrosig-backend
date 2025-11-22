import { getCropReport } from '../../helpers/index.js'
import { buildPDF } from '../../utils/pdf.utils.js'
import { logger } from '../../utils/logger.utils.js'
import { NotFoundError, BadRequestError, InternalServerError } from '../../lib/api.errors.js'

async function getReportData (request, response, next) {
  const startTime = Date.now()

  try {
    const cropId = request.params.cropId
    const userId = request.user.user_id

    logger.reports.info('Controlador - Obteniendo datos de reporte', { userId, cropId })

    if (!cropId) {
      logger.reports.warn('Controlador - ID de cultivo no proporcionado', { userId })
      throw new BadRequestError('ID de cultivo es requerido')
    }

    const data = await getCropReport(cropId, userId)

    if (!data.crop) {
      logger.reports.warn('Controlador - Cultivo no encontrado para reporte', { userId, cropId })
      throw new NotFoundError('Cultivo no encontrado o no pertenece al usuario')
    }

    const responseTime = Date.now() - startTime

    logger.reports.info('Controlador - Datos de reporte obtenidos exitosamente', {
      userId,
      cropId,
      responseTime: `${responseTime}ms`
    })

    response.json(data)
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.reports.error('Controlador - Error obteniendo datos de reporte', {
      userId: request.user?.user_id,
      cropId: request.params?.cropId,
      responseTime: `${responseTime}ms`,
      error: error.message
    })

    if (error instanceof BadRequestError || error instanceof NotFoundError) {
      throw error
    }
    throw new InternalServerError('Error obteniendo datos del reporte', { original: error.message })
  }
}

async function getReportPDF (request, response, next) {
  const startTime = Date.now()

  try {
    const cropId = request.params.cropId
    const userId = request.user.user_id

    logger.reports.info('Controlador - Generando PDF de reporte', { userId, cropId })

    if (!cropId) {
      logger.reports.warn('Controlador - ID de cultivo no proporcionado para PDF', { userId })
      throw new BadRequestError('ID de cultivo es requerido')
    }

    const data = await getCropReport(cropId, userId)

    if (!data.crop) {
      logger.reports.warn('Controlador - Cultivo no encontrado para generar PDF', { userId, cropId })
      throw new NotFoundError('Cultivo no encontrado o no pertenece al usuario')
    }

    // Configurar headers para PDF
    response.setHeader('Content-Type', 'application/pdf')
    response.setHeader('Content-Disposition', `attachment; filename=reporte-cultivo-${cropId}.pdf`)

    const responseTime = Date.now() - startTime

    logger.reports.info('Controlador - PDF de reporte generado exitosamente', {
      userId,
      cropId,
      responseTime: `${responseTime}ms`
    })

    // Función para manejar chunks de datos
    const dataCallback = (chunk) => {
      response.write(chunk)
    }

    // Función para manejar el final
    const endCallback = () => {
      response.end()
    }

    // Manejar errores en la respuesta
    response.on('error', (error) => {
      logger.reports.error('Controlador - Error en response stream al generar PDF', {
        userId,
        cropId,
        error: error.message
      })
    })

    buildPDF(data, dataCallback, endCallback)
  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.reports.error('Controlador - Error generando PDF de reporte', {
      userId: request.user?.user_id,
      cropId: request.params?.cropId,
      responseTime: `${responseTime}ms`,
      error: error.message
    })

    // Si los headers ya fueron enviados, no podemos enviar un error JSON
    if (response.headersSent) {
      response.end()
      return
    }

    if (error instanceof BadRequestError || error instanceof NotFoundError) {
      throw error
    }
    throw new InternalServerError('Error generando PDF', { original: error.message })
  }
}

export {
  getReportData,
  getReportPDF
}
