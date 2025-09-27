import PDFDocument from 'pdfkit'

function formatDate (date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-ES')
}

function formatCurrency (amount) {
  return `$${Number(amount || 0).toFixed(2)}`
}

function addTableHeader (doc, headers, columnWidths, yPosition) {
  doc.fontSize(10).font('Helvetica-Bold')
  let xPosition = 30
  headers.forEach((header, index) => {
    doc.text(header, xPosition, yPosition, { width: columnWidths[index], align: 'left' })
    xPosition += columnWidths[index]
  })
  // Línea debajo del encabezado
  doc.moveTo(30, yPosition + 15).lineTo(565, yPosition + 15).stroke()
  return yPosition + 20
}

function addTableRow (doc, rowData, columnWidths, yPosition) {
  doc.fontSize(9).font('Helvetica')
  let xPosition = 30
  rowData.forEach((cell, index) => {
    doc.text(cell.toString(), xPosition, yPosition, {
      width: columnWidths[index],
      align: 'left',
      lineBreak: false
    })
    xPosition += columnWidths[index]
  })
  return yPosition + 15
}

async function buildPDF (data, dataCallback, endCallback) {
  const doc = new PDFDocument({ margin: 30, size: 'A4' })

  doc.on('data', dataCallback)
  doc.on('end', endCallback)

  // Logo y Encabezado de la empresa
  doc.fontSize(16).font('Helvetica-Bold')
  doc.text('Soluciones AgroTech S.A de C.V', { align: 'center' })
  doc.fontSize(10).font('Helvetica')
  doc.text('Sistema de Gestión Agrícola', { align: 'center' })

  // Fecha de generación del reporte
  doc.fontSize(8).text(`Reporte generado el: ${new Date().toLocaleDateString('es-ES')}`, { align: 'right' })
  doc.moveDown(0.5)

  // Título del reporte
  doc.fontSize(18).font('Helvetica-Bold')
  doc.text('Reporte de Cultivo', { align: 'center' })
  doc.moveDown()

  // ===== RESUMEN DEL CULTIVO =====
  doc.fontSize(14).font('Helvetica-Bold')
  doc.text('Resumen del Cultivo', { underline: true })
  doc.moveDown(0.5)

  let yPosition = doc.y
  const resumenHeaders = ['Tipo de Cultivo', 'Variedad', 'Fecha Siembra', 'Fecha Cosecha']
  const resumenWidths = [120, 120, 100, 100]

  yPosition = addTableHeader(doc, resumenHeaders, resumenWidths, yPosition)

  const resumenData = [
    data.crop.crop_type || '-',
    data.crop.crop_variety || '-',
    formatDate(data.crop.planting_date),
    formatDate(data.crop.harvest_date)
  ]

  yPosition = addTableRow(doc, resumenData, resumenWidths, yPosition)
  doc.moveTo(30, yPosition).lineTo(565, yPosition).stroke()
  doc.moveDown()

  // ===== RESUMEN DE COSTOS =====
  doc.fontSize(14).font('Helvetica-Bold')
  doc.text('Resumen de Costos', { underline: true })
  doc.moveDown(0.5)

  // Costo total del cultivo
  doc.fontSize(10).font('Helvetica-Bold')
  doc.text(`Costo Total del Cultivo: ${formatCurrency(data.summary.totalCost)}`)
  doc.moveDown(0.5)

  // Costo por actividad
  doc.fontSize(12).font('Helvetica-Bold')
  doc.text('Costos por Actividad:')
  doc.moveDown(0.3)

  if (data.summary.costByActivityType && data.summary.costByActivityType.length > 0) {
    yPosition = doc.y
    const actividadHeaders = ['Actividad', 'Costo Total']
    const actividadWidths = [400, 100]

    yPosition = addTableHeader(doc, actividadHeaders, actividadWidths, yPosition)

    data.summary.costByActivityType.forEach(activity => {
      yPosition = addTableRow(doc, [activity.activity_type, formatCurrency(activity.total_cost)], actividadWidths, yPosition)
    })

    doc.moveTo(30, yPosition).lineTo(565, yPosition).stroke()
  } else {
    doc.fontSize(10).font('Helvetica').text('No hay datos de costos por actividad')
  }
  doc.moveDown()

  // Costo por insumo
  doc.fontSize(12).font('Helvetica-Bold')
  doc.text('Costos por Insumo:')
  doc.moveDown(0.3)

  if (data.summary.costByInput && data.summary.costByInput.length > 0) {
    yPosition = doc.y
    const insumoHeaders = ['Insumo', 'Costo Total']
    const insumoWidths = [400, 100]

    yPosition = addTableHeader(doc, insumoHeaders, insumoWidths, yPosition)

    data.summary.costByInput.forEach(input => {
      yPosition = addTableRow(doc, [input.input_name, formatCurrency(input.total_cost)], insumoWidths, yPosition)
    })

    doc.moveTo(30, yPosition).lineTo(565, yPosition).stroke()
  } else {
    doc.fontSize(10).font('Helvetica').text('No hay datos de costos por insumo')
  }
  doc.moveDown()

  // Evolución de costos mensual (si existe)
  if (data.summary.costEvolution && data.summary.costEvolution.length > 0) {
    doc.fontSize(12).font('Helvetica-Bold')
    doc.text('Evolución de Costos Mensual:')
    doc.moveDown(0.3)

    yPosition = doc.y
    const evolucionHeaders = ['Mes', 'Costo Total']
    const evolucionWidths = [400, 100]

    yPosition = addTableHeader(doc, evolucionHeaders, evolucionWidths, yPosition)

    data.summary.costEvolution.forEach(evolution => {
      yPosition = addTableRow(doc, [formatDate(evolution.month), formatCurrency(evolution.total_cost)], evolucionWidths, yPosition)
    })

    doc.moveTo(30, yPosition).lineTo(565, yPosition).stroke()
    doc.moveDown()
  }

  // ===== DETALLE DE ACTIVIDADES E INSUMOS =====
  doc.fontSize(14).font('Helvetica-Bold')
  doc.text('Detalle de Actividades e Insumos', { underline: true })
  doc.moveDown(0.5)

  if (data.activities && data.activities.length > 0) {
    data.activities.forEach((activity, index) => {
      // Verificar si hay espacio en la página
      if (doc.y > 700) {
        doc.addPage()
      }

      // Información de la actividad
      doc.fontSize(11).font('Helvetica-Bold')
      doc.text(`Actividad ${index + 1}: ${activity.activity_type}`)

      doc.fontSize(9).font('Helvetica')
      doc.text(`Fecha: ${formatDate(activity.date)} | Costo: ${formatCurrency(activity.cost_total)}`)
      doc.text(`Descripción: ${activity.description || 'Sin descripción'}`)
      doc.moveDown(0.3)

      // Insumos de la actividad
      const insumos = data.inputs ? data.inputs.filter(i => i.activity_id === activity.activity_id) : []

      if (insumos.length > 0) {
        yPosition = doc.y
        const detalleHeaders = ['Insumo', 'Cantidad', 'Unidad', 'Costo Unitario', 'Costo Total']
        const detalleWidths = [150, 70, 60, 90, 90]

        yPosition = addTableHeader(doc, detalleHeaders, detalleWidths, yPosition)

        insumos.forEach(insumo => {
          yPosition = addTableRow(doc, [
            insumo.input_name,
            insumo.quantity.toString(),
            insumo.unit,
            formatCurrency(insumo.unit_cost),
            formatCurrency(insumo.cost_total)
          ], detalleWidths, yPosition)
        })

        doc.moveTo(30, yPosition).lineTo(565, yPosition).stroke()
      } else {
        doc.fontSize(9).font('Helvetica').text('No hay insumos registrados para esta actividad')
      }

      doc.moveDown()

      // Línea separadora entre actividades
      if (index < data.activities.length - 1) {
        doc.moveTo(30, doc.y).lineTo(565, doc.y).stroke()
        doc.moveDown()
      }
    })
  } else {
    doc.fontSize(10).font('Helvetica').text('No hay actividades registradas')
  }

  // Pie de página
  const pageHeight = doc.page.height
  doc.fontSize(8).font('Helvetica')
  doc.text('Soluciones AgroTech S.A de C.V - Sistema de Gestión Agrícola', 30, pageHeight - 40, { align: 'center' })
  doc.text(`Página ${doc.bufferedPageRange().count}`, 30, pageHeight - 25, { align: 'center' })

  doc.end()
}

export { buildPDF }
