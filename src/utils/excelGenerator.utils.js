import ExcelJS from 'exceljs'

async function generateExcel (reportData) {
  return new Promise((resolve, reject) => {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Reporte de Cultivo')

    // Header
    sheet.addRow(['Reporte de Cultivo'])
    sheet.addRow([])
    sheet.addRow(['Cultivo', reportData.crop.crop_type])
    sheet.addRow(['Variedad', reportData.crop.crop_variety])
    sheet.addRow(['Siembra', reportData.crop.planting_date])
    sheet.addRow(['Cosecha', reportData.crop.harvest_date])
    sheet.addRow([])

    // Costos por actividad
    sheet.addRow(['Costos por Actividad'])
    sheet.addRow(['Actividad', 'Costo'])
    reportData.activityCosts.forEach(a => {
      sheet.addRow([a.activity_type, Number(a.tottal_cost)])
    })
    sheet.addRow([])

    // Costos por insumos
    sheet.addRow(['Costos por Insumos'])
    sheet.addRow(['Insumo', 'Costo'])
    reportData.inputCosts.forEach(i => {
      sheet.addRow([i.input_name, Number(i.total_cost)])
    })
    sheet.addRow([])

    // Detalle de actividades
    sheet.addRow(['Detalle de Actividades'])
    sheet.addRow(['Actividad', 'Tipo', 'Descripción', 'Costo'])
    reportData.activities.forEach(a => {
      sheet.addRow([a.date, a.activity_type, a.description, Number(a.cost_total)])
    })
    sheet.addRow([])

    // Detalle de insumos
    sheet.addRow(['Detalle de Insumos'])
    sheet.addRow(['Actividad', 'Insumo', 'Cantidad', 'Unidad', 'Costo Unitario', 'Costo Total'])
    reportData.inputs.forEach(i => {
      sheet.addRow([
        i.activity_id,
        i.input_name,
        Number(i.quantity),
        i.unit,
        Number(i.unit_cost),
        Number(i.cost_total)
      ])
    })

    // Exportar buffer
    workbook.xlsx.writeBuffer()
      .then(buffer => resolve(buffer))
      .catch(err => reject(err))
  })
}

export {
  generateExcel
}
