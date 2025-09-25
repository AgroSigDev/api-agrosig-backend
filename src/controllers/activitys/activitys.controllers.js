import { Activitys } from '../../models/index.js'

async function registerActivity (userId, cropId, activityData, inputs) {
  const data = await Activitys.createActivityWithInputs(userId, cropId, activityData, inputs)
  return data
}

export {
  registerActivity
}
