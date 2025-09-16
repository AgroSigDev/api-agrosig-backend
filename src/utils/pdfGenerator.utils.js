import PDFDocument from 'pdfkit'
import fs from 'fs'

async function generatePDFReport (cropData, filePath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 30 })

      const stream = fs.createWriteStream(filePath)
      doc.pipe(stream)

      // Header
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('Reporte de Cultivo', { align: 'center', fontSize: 20 })
        .moveDown(0.5)

      // Datos del Cultivo
      doc.fontSize(12).text(`Cultivo: ${cropData.crop_type}`, { continued: true })
      doc.text(`  |  Variedad: ${cropData.crop_variety || 'N/A'}`)
      doc.text(`Fecha de Siembra: ${cropData.planting_date || 'N/A'}`)
      doc.text(`Fecha de Cosecha: ${cropData.harvest_date || 'N/A'}`)
      doc.text(`Costo Total: $${cropData.cost_total.toFixed(2)}`)
      doc.moveDown()

      // Actividades
      doc.fontSize(16).text('Actividades', { underline: true }).moveDown(0.5)

      if (cropData.activities.lenght === 0) {
        doc.text('No hay actividades registradas')
      } else {
        cropData.activities.array.forEach((activity, index) => {
          doc.fontSize(12).text(
            `${index + 1}. ${activity.activity_type} - ${activity.date}`
          )
          doc.text(`Descripción: ${activity.description || 'N/A'}`)
          doc.text(`Costo Total: $${activity.cost_total.toFixed(2)}`)
          doc.moveDown(0.5)

          // Insumos de la actividad
          if (activity.inputs && activity.inputs.length > 0) {
            doc.text(' Insumos utilizados:', { indent: 20 })
            activity.inputs.forEach((input) => {
              doc.text(
                `   • ${input.input_name} - Cantidad: ${input.quantity} ${input.unit} - Costo: $${input.cost_total.toFixed(
                  2
                )}`,
                { indent: 40 }
              )
            })
          }
          doc.moveDown()
        })
      }

      // Finalizar
      doc.end()

      stream.on('finish', () => resolve(filePath))
      stream.on('error', (err) => reject(err))
    } catch (error) {
      reject(error)
    }
  })
}

export {
  generatePDFReport
}
