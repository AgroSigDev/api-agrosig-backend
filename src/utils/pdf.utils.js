import PDFDocument from 'pdfkit'

// ===== FUNCIONES AUXILIARES DE FORMATO =====

function formatDate (date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function formatCurrency (amount) {
  return `$${Number(amount || 0).toFixed(2)}`
}

// ===== FUNCIONES PARA CONSTRUCCIÓN DE TABLAS Y SECCIONES =====

function addTableHeader (doc, headers, columnWidths, yPosition, headerColor = '#2E7D32') {
  doc.save()
  doc.roundedRect(30, yPosition - 5, 535, 20, 3).fill(headerColor)

  doc.fontSize(9).font('Helvetica-Bold').fillColor('white')
  let xPosition = 30
  headers.forEach((header, index) => {
    doc.text(header, xPosition + 8, yPosition, {
      width: columnWidths[index] - 16,
      align: 'left'
    })
    xPosition += columnWidths[index]
  })

  doc.restore()
  return yPosition + 20
}

function addTableRow (doc, rowData, columnWidths, yPosition, isEven = false) {
  if (isEven) {
    doc.save()
    doc.rect(30, yPosition - 3, 535, 15).fill('#f8f9fa')
    doc.restore()
  }

  doc.fontSize(8).font('Helvetica').fillColor('#333333')
  let xPosition = 30
  rowData.forEach((cell, index) => {
    doc.text(cell.toString(), xPosition + 8, yPosition, {
      width: columnWidths[index] - 16,
      align: 'left',
      lineBreak: false
    })
    xPosition += columnWidths[index]
  })

  doc.moveTo(30, yPosition + 12).lineTo(565, yPosition + 12)
    .strokeColor('#e0e0e0').lineWidth(0.3).stroke()

  return yPosition + 15
}

function addSectionHeader (doc, title, yPosition) {
  doc.save()
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#2E7D32')
  doc.text(title, 30, yPosition)

  doc.moveTo(30, yPosition + 5).lineTo(120, yPosition + 5)
    .strokeColor('#4CAF50').lineWidth(1).stroke()
  doc.restore()

  return yPosition + 20
}

function addInfoCard (doc, label, value, x, y, width) {
  doc.save()
  doc.roundedRect(x, y, width, 22, 4)
    .fill('#f8f9fa')
    .stroke('#e0e0e0')

  doc.fontSize(7).font('Helvetica-Bold').fillColor('#666666')
  doc.text(label.toUpperCase(), x + 6, y + 4)
  doc.fontSize(8).font('Helvetica').fillColor('#333333')
  doc.text(value, x + 6, y + 13)
  doc.restore()
}

// ===== VERIFICACIÓN DE SALTO DE PÁGINA =====

function checkPageBreak (doc, yPosition, neededSpace = 50) {
  const pageHeight = doc.page.height - doc.page.margins.bottom
  const limit = pageHeight - 50 // límite de contenido antes del pie de página

  if (yPosition + neededSpace >= limit) {
    doc.addPage()
    return doc.page.margins.top + 30 // posición inicial segura en nueva página
  }
  return yPosition
}

// ===== CONSTRUCCIÓN DEL DOCUMENTO PDF =====

async function buildPDF (data, dataCallback, endCallback) {
  const doc = new PDFDocument({
    margin: 25,
    size: 'A4',
    bufferPages: true
  })

  doc.on('data', dataCallback)
  doc.on('end', endCallback)

  let yPosition = 50

  // ===== ENCABEZADO GENERAL =====
  doc.save()
  doc.rect(0, 0, doc.page.width, 70).fill('#2E7D32')

  doc.fontSize(14).font('Helvetica-Bold').fillColor('white')
  doc.text('SOLUCIONES AGROTEC S.A. DE C.V.', 30, 25)

  doc.fontSize(9).font('Helvetica').fillColor('#E8F5E8')
  doc.text('Sistema de Gestión Agrícola', 30, 42)

  const generatedDate = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
  doc.fontSize(8).fillColor('white')
  doc.text(`Generado: ${generatedDate}`, doc.page.width - 140, 30)
  doc.restore()

  yPosition = 90

  // ===== TÍTULO DEL REPORTE =====
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#2E7D32')
  doc.text('REPORTE DE CULTIVO', 30, yPosition, { align: 'center' })
  yPosition += 30

  // ===== INFORMACIÓN DEL CULTIVO =====
  yPosition = addSectionHeader(doc, 'INFORMACIÓN DEL CULTIVO', yPosition)

  const cardWidth = 125
  const gap = 10

  addInfoCard(doc, 'Tipo de Cultivo', data.crop.crop_type || '-', 30, yPosition, cardWidth)
  addInfoCard(doc, 'Variedad', data.crop.crop_variety || '-', 30 + cardWidth + gap, yPosition, cardWidth)
  addInfoCard(doc, 'Fecha Siembra', formatDate(data.crop.planting_date), 30 + (cardWidth + gap) * 2, yPosition, cardWidth)
  addInfoCard(doc, 'Fecha Cosecha', formatDate(data.crop.harvest_date), 30 + (cardWidth + gap) * 3, yPosition, cardWidth)
  yPosition += 47

  // ===== RESUMEN FINANCIERO =====
  yPosition = checkPageBreak(doc, yPosition, 80)
  yPosition = addSectionHeader(doc, 'RESUMEN FINANCIERO', yPosition)

  doc.save()
  doc.roundedRect(30, yPosition, 535, 35, 6)
    .fill('#E8F5E8')
    .stroke('#4CAF50')

  doc.fontSize(10).font('Helvetica-Bold').fillColor('#2E7D32')
  doc.text('COSTO TOTAL DEL CULTIVO', 45, yPosition + 8)
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#1B5E20')
  doc.text(formatCurrency(data.summary.totalCost), 45, yPosition + 18)
  doc.restore()
  yPosition += 55

  // ===== DISTRIBUCIÓN DE COSTOS =====
  if (data.summary.costByActivityType?.length) {
    yPosition = checkPageBreak(doc, yPosition, 100)
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333')
    doc.text('Distribución por Tipo de Actividad:', 30, yPosition)
    yPosition += 15

    const headers = ['Actividad', 'Costo Total', 'Porcentaje']
    const widths = [300, 120, 115]
    yPosition = addTableHeader(doc, headers, widths, yPosition, '#388E3C')

    data.summary.costByActivityType.forEach((activity, i) => {
      const percentage = data.summary.totalCost > 0
        ? ((Number(activity.total_cost) / data.summary.totalCost) * 100).toFixed(1)
        : '0.0'
      yPosition = addTableRow(doc, [
        activity.activity_type,
        formatCurrency(activity.total_cost),
        `${percentage}%`
      ], widths, yPosition, i % 2 === 0)
    })
    yPosition += 20
  }

  if (data.summary.costByInput?.length) {
    yPosition = checkPageBreak(doc, yPosition, 100)
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333')
    doc.text('Distribución por Tipo de Insumo:', 30, yPosition)
    yPosition += 15

    const headers = ['Insumo', 'Costo Total', 'Porcentaje']
    const widths = [300, 120, 115]
    yPosition = addTableHeader(doc, headers, widths, yPosition, '#388E3C')

    data.summary.costByInput.forEach((input, i) => {
      const percentage = data.summary.totalCost > 0
        ? ((Number(input.total_cost) / data.summary.totalCost) * 100).toFixed(1)
        : '0.0'
      yPosition = addTableRow(doc, [
        input.input_name,
        formatCurrency(input.total_cost),
        `${percentage}%`
      ], widths, yPosition, i % 2 === 0)
    })
    yPosition += 25
  }

  if (data.summary.costEvolution?.length) {
    yPosition = checkPageBreak(doc, yPosition, 80)
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333')
    doc.text('Evolución Mensual de Costos:', 30, yPosition)
    yPosition += 15

    const headers = ['Mes', 'Costo Total']
    const widths = [400, 135]
    yPosition = addTableHeader(doc, headers, widths, yPosition, '#388E3C')

    data.summary.costEvolution.forEach((evolution, i) => {
      yPosition = addTableRow(doc, [
        formatDate(evolution.month),
        formatCurrency(evolution.total_cost)
      ], widths, yPosition, i % 2 === 0)
    })
    yPosition += 30
  }

  // ===== DETALLE DE ACTIVIDADES E INSUMOS =====
  if (data.activities?.length) {
    yPosition = checkPageBreak(doc, yPosition, 100)
    yPosition = addSectionHeader(doc, 'DETALLE DE ACTIVIDADES E INSUMOS', yPosition)

    data.activities.forEach((activity, index) => {
      yPosition = checkPageBreak(doc, yPosition, 130)

      doc.save()
      doc.roundedRect(30, yPosition, 535, 22, 4)
        .fill('#E3F2FD')
        .stroke('#2196F3')
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1565C0')
      doc.text(`ACTIVIDAD ${index + 1}: ${activity.activity_type.toUpperCase()}`, 38, yPosition + 7)
      doc.restore()
      yPosition += 30

      doc.fontSize(8).font('Helvetica').fillColor('#333333')
      doc.text(`Fecha: ${formatDate(activity.date)}`, 38, yPosition)
      doc.text(`Costo Total: ${formatCurrency(activity.cost_total)}`, 200, yPosition)
      yPosition += 12

      if (activity.description) {
        const descHeight = doc.heightOfString(activity.description, { width: 500 })
        doc.text(`Descripción: ${activity.description}`, 38, yPosition, { width: 500 })
        yPosition += descHeight + 8
      } else {
        yPosition += 5
      }

      const insumos = data.inputs?.filter(i => i.activity_id === activity.activity_id) || []
      if (insumos.length > 0) {
        yPosition = checkPageBreak(doc, yPosition, 80)
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#666666')
        doc.text('INSUMOS UTILIZADOS:', 38, yPosition)
        yPosition += 12

        const insumoHeaders = ['Insumo', 'Cantidad', 'Unidad', 'Costo Unitario', 'Costo Total']
        const insumoWidths = [180, 70, 60, 90, 90]
        yPosition = addTableHeader(doc, insumoHeaders, insumoWidths, yPosition, '#1976D2')

        insumos.forEach((insumo, i) => {
          yPosition = addTableRow(doc, [
            insumo.input_name,
            insumo.quantity.toString(),
            insumo.unit,
            formatCurrency(insumo.unit_cost),
            formatCurrency(insumo.cost_total)
          ], insumoWidths, yPosition, i % 2 === 0)
        })
        yPosition += 15
      }

      if (index < data.activities.length - 1) {
        yPosition = checkPageBreak(doc, yPosition, 20)
        doc.moveTo(30, yPosition).lineTo(565, yPosition)
          .strokeColor('#e0e0e0').lineWidth(0.5).stroke()
        yPosition += 15
      }
    })
  } else {
    yPosition = checkPageBreak(doc, yPosition, 30)
    doc.fontSize(9).font('Helvetica').fillColor('#666666')
    doc.text('No hay actividades registradas para este cultivo.', 30, yPosition)
    yPosition += 20
  }

  // ===== PIE DE PÁGINA =====
  const pages = doc.bufferedPageRange()
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i)
    const bottom = doc.page.height - 40

    doc.save()
    doc.rect(0, bottom, doc.page.width, 40).fill('#2E7D32')
    doc.fontSize(8).fillColor('white')
    doc.text('Soluciones AgroTech S.A. de C.V. - Sistema de Gestión Agrícola',
      doc.page.width / 2, bottom + 12, { align: 'center' })
    doc.text(`Página ${i + 1} de ${pages.count}`,
      doc.page.width / 2, bottom + 24, { align: 'center' })
    doc.restore()
  }

  doc.end()
}

export { buildPDF }
