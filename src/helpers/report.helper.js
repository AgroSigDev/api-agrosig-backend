import { Report } from '../models/index.js'

async function getCropReport (cropId, userId) {
  const crop = await Report.getCropId(cropId)

  if (!crop) {
    throw new Error('Cultivo no encontrado')
  }

  if (crop.user_id !== userId) {
    throw new Error('No tiene permisos para ver este informe')
  }

  const activities = await Report.getActivitiesByCropId(cropId)
  const inputs = await Report.getInputsByCropId(cropId)
  const costByActivityType = await Report.getCostByActivityType(cropId)
  const costByInput = await Report.getCostByInput(cropId)
  const costEvolution = await Report.getCostEvolution(cropId)

  // organiza inputs por actividad para mostrar en PDF
  const totalCost = costByActivityType.reduce((acc, item) => acc + Number(item.total_cost), 0)

  return {
    crop,
    summary: {
      totalCost,
      costByActivityType,
      costByInput,
      costEvolution
    },
    activities,
    inputs
  }
}

export {
  getCropReport
}
