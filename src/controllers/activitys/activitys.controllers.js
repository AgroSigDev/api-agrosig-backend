import { Activitys } from '../../models/index.js'

async function registerActivity (userId, cropId, activityData, inputs) {
  const data = await Activitys.createActivityWithInputs(userId, cropId, activityData, inputs)
  return data
}

async function getActivities (userId, cropId) {
  const activities = await Activitys.getActivitiesByCrop(userId, cropId)
  return activities
}

async function getActivity (userId, activityId) {
  const activity = await Activitys.getActivityById(userId, activityId)
  return activity
}

export {
  registerActivity,
  getActivities,
  getActivity
}
