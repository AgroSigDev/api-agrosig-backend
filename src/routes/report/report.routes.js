import express from 'express'
import { autenticate } from '../../middlewares/index.js'
import { getReportData, getReportPDF } from '../../controllers/report/report.controllers.js'

const router = express.Router()

router.get('/report-data/:cropId', autenticate, getReportData)
router.get('/report-pdf/:cropId', autenticate, getReportPDF)

export default router
