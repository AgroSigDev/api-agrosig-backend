import { getCropReport } from '../../helpers/index.js'
import { buildPDF } from '../../utils/pdf.utils.js'

async function getReportData (request, response, next) {
  try {
    const cropId = request.params.cropId
    const userId = request.user.user_id

    if (!cropId) {
      return response.status(400).json({ error: 'ID de cultivo es requerido' })
    }

    const data = await getCropReport(cropId, userId)
    response.json(data)
  } catch (error) {
    console.error('Error en getReportData:', error)
    response.status(500).json({ error: error.message })
  }
}

async function getReportPDF (request, response, next) {
  try {
    const cropId = request.params.cropId
    const userId = request.user.user_id
    console.log('Generando PDF para cropId:', cropId, 'userId:', userId)

    if (!cropId) {
      return response.status(400).json({ error: 'ID de cultivo es requerido' })
    }

    const data = await getCropReport(cropId, userId)

    if (!data.crop) {
      return response.status(404).json({ error: 'Cultivo no encontrado o no pertenece al usuario' })
    }

    // Configurar headers para PDF
    response.setHeader('Content-Type', 'application/pdf')
    response.setHeader('Content-Disposition', `attachment; filename=reporte-cultivo-${cropId}.pdf`)

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
      console.error('Error en response stream:', error)
    })

    buildPDF(data, dataCallback, endCallback)
  } catch (error) {
    console.error('Error en getReportPDF:', error)

    // Si los headers ya fueron enviados, no podemos enviar un error JSON
    if (response.headersSent) {
      response.end()
      return
    }

    response.status(500).json({
      error: 'Error generando PDF',
      details: error.message
    })
  }
}

export {
  getReportData,
  getReportPDF
}
