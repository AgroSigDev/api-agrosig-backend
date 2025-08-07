import { Plot } from '../../models/index.js'

async function registerPlot (userId, plot) {
  const data = await Plot.createPlot(userId, plot)
  return data
}

async function getUbicationCoords (userId, location) {
  const data = await Plot.getUbicationCoords(userId, location)
  return data
}

async function getAllPlots (userId) {
  const data = await Plot.getAllPlots(userId)
  return data
}

async function updatePlotById (userId, plotId, plotData) {
  const data = await Plot.updatePlotById(userId, plotId, plotData)
  return data
}

async function detelePlotById (userId, plotId) {
  await Plot.detelePlotById(userId, plotId)
}

export {
  registerPlot,
  getUbicationCoords,
  getAllPlots,
  updatePlotById,
  detelePlotById
}
