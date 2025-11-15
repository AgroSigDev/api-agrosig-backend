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

async function getAllActivities (userId) {
  const activities = await Activitys.getAllActivitiesByUser(userId)
  return activities
}

export {
  registerActivity,
  getActivities,
  getActivity,
  getAllActivities
}
