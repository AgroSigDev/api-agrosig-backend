// utils/pdf.utils.js
import PDFDocument from 'pdfkit'

function formatDate (date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-ES')
}

function formatCurrency (amount) {
  return `$${Number(amount || 0).toFixed(2)}`
}

async function buildPDF (data, dataCallback, endCallback) {
  const doc = new PDFDocument({ margin: 30, size: 'A4' })

  doc.on('data', dataCallback)
  doc.on('end', endCallback)

  // Encabezado
  doc.fontSize(20).text('Reporte de Cultivo', { align: 'center' })
  doc.moveDown()

  // Resumen del cultivo
  doc.fontSize(14).text('Resumen del Cultivo:', { underline: true })
  doc.fontSize(12).text(`Tipo de Cultivo: ${data.crop.crop_type || '-'}`)
  doc.text(`Variedad: ${data.crop.crop_variety || '-'}`)
  doc.text(`Fecha Siembra: ${formatDate(data.crop.planting_date)}`)
  doc.text(`Fecha Cosecha: ${formatDate(data.crop.harvest_date)}`)
  doc.moveDown()

  // Resumen de Costos
  doc.fontSize(14).text('Resumen de Costos:', { underline: true })
  doc.fontSize(12).text(`Costo Total Cultivo: ${formatCurrency(data.summary.totalCost)}`)
  doc.moveDown()

  // Costo por actividad
  doc.fontSize(12).text('Costos por Actividad:', { underline: true })
  data.summary.costByActivityType.forEach(a => {
    doc.text(` • ${a.activity_type}: ${formatCurrency(a.total_cost)}`)
  })
  doc.moveDown()

  // Costo por insumo
  doc.fontSize(12).text('Costos por Insumo:', { underline: true })
  data.summary.costByInput.forEach(i => {
    doc.text(` • ${i.input_name}: ${formatCurrency(i.total_cost)}`)
  })
  doc.moveDown()

  // Evolución de costos (solo si hay datos)
  if (data.summary.costEvolution.length > 0) {
    doc.fontSize(12).text('Evolución de Costos Mensual:', { underline: true })
    data.summary.costEvolution.forEach(e => {
      doc.text(` • ${formatDate(e.month)}: ${formatCurrency(e.total_cost)}`)
    })
    doc.moveDown()
  }

  // Detalle de actividades
  doc.fontSize(14).text('Detalle de Actividades e Insumos:', { underline: true })
  data.activities.forEach(a => {
    doc.fontSize(12)
    doc.text(`Actividad: ${a.activity_type} - ${formatDate(a.date)} - ${formatCurrency(a.cost_total)}`)
    doc.text(`Descripción: ${a.description || 'Sin descripción'}`)

    const insumos = data.inputs.filter(i => i.activity_id === a.activity_id)
    if (insumos.length > 0) {
      insumos.forEach(i => {
        doc.fontSize(10)
        doc.text(`   • ${i.input_name}: ${i.quantity} ${i.unit} x ${formatCurrency(i.unit_cost)} = ${formatCurrency(i.cost_total)}`)
      })
    } else {
      doc.fontSize(10).text('   • Sin insumos registrados')
    }
    doc.moveDown()
  })

  doc.end()
}

export { buildPDF }
