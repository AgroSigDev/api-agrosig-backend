import express from 'express'
import { getReport } from '../../controllers/index.js'
import { autenticate } from '../../middlewares/index.js'

const router = express.Router()

router.get('/report/:cropId', autenticate, async (request, response, next) => {
  try {
    const cropId = request.params.cropId
    const report = await getReport(cropId)
    response.status(200).json({
      success: true,
      data: report
    })
  } catch (error) {
    console.error('Error generating report:', error)
    response.status(500).json({
      success: false,
      message: 'Error generating report'
    })
  }
})

export default router
