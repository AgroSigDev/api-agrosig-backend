import { Report } from '../../models/index.js'
import { generatePDFReport } from '../../utils/pdfGenerator.utils.js'
import { generateExcel } from '../../utils/excelGenerator.utils.js'
import path from 'path'

async function getReportPDF (cropId) {
  const cropData = await Report.getCostTotalByCropId(cropId)

  const filePath = path.join('reports', `crop_${cropId}.pdf`)
  await generatePDFReport(cropData, filePath)
}

async function generateReportExcel (cropId) {
  const cropData = await Report.getCostTotalByCropId(cropId)
  const filePath = path.join('reports', `crop_${cropId}.xlsx`)
  await generateExcel(cropData, filePath)
}

export {
  getReportPDF,
  generateReportExcel
}
