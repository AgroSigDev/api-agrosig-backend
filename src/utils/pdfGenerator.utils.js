import PDFDocument from 'pdfkit'

async function streamPDFReport (reportData, writable) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 30, size: 'A4' })
      doc.pipe(writable)

      // Header
      doc.fontSize(20).text('Resumen del Cultivo - AgroSig', { align: 'center' }).moveDown()

      doc.fontSize(12)
        .text(`Tipo de cultivo: ${reportData.crop.crop_type}`)
        .text(`Variedad: ${reportData.crop.crop_variety || 'N/A'}`)
        .text(`Siembra: ${reportData.crop.planting_date || 'N/A'}`)
        .text(`Cosecha: ${reportData.crop.harvest_date || 'N/A'}`)
        .text(`Costo total: $${Number(reportData.costTotal || 0).toFixed(2)}`)
        .moveDown()

      // Tabla simple de Actividades
      doc.fontSize(14).text('Actividades', { underline: true }).moveDown(0.5)
      if (!reportData.activities || reportData.activities.length === 0) {
        doc.text('No hay actividades registradas')
      } else {
        reportData.activities.forEach((a, idx) => {
          doc.fontSize(12).text(`${idx + 1}. ${a.activity_type} — ${a.date}`)
          doc.text(`Descripción: ${a.description || 'N/A'}`)
          doc.text(`Costo: $${Number(a.cost_total || 0).toFixed(2)}`)
          if (reportData.inputsByActivity && reportData.inputsByActivity[a.activity_id]) {
            doc.text(' Insumos:')
            reportData.inputsByActivity[a.activity_id].forEach(inp => {
              doc.text(`   • ${inp.input_name} — ${Number(inp.quantity)} ${inp.unit} — $${Number(inp.cost_total).toFixed(2)}`)
            })
          }
          doc.moveDown(0.5)
        })
      }

      // Pie chart y Line chart en imagenes
      if (reportData.charts) {
        if (reportData.charts.pie) {
          doc.addPage()
          doc.fontSize(14).text('Distribución de costos por insumo', { align: 'center' })
          doc.image(reportData.charts.pie, { fit: [500, 300], align: 'center' })
        }
        if (reportData.charts.line) {
          doc.addPage()
          doc.fontSize(14).text('Evolución de costos en el tiempo', { align: 'center' })
          doc.image(reportData.charts.line, { fit: [500, 300], align: 'center' })
        }
      }

      doc.end()

      // Resolver cuando la tuberia este terminada
      writable.on('finish', () => resolve())
      writable.on('error', error => reject(error))
    } catch (error) {
      reject(error)
    }
  })
}

export { streamPDFReport }
