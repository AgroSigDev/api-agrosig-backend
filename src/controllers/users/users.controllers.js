import { Users } from '../../models/index.js'

async function getAllUsers () {
  const result = await Users.getAllUsers()
  return result
}

async function getUserById (userId) {
  const result = await Users.getUserById(userId)
  return result
}

async function getUserByEmail (email) {
  const result = await Users.getUserByEmail(email)
  return result
}

async function updateUserById (userId, userData) {
  const result = await Users.updateUserById(userId, userData)
  return result
}

async function updateUserPassword (userId, oldPassword, newPassword, repeatedPassword) {
  const result = await Users.updateUserPassword(
    userId,
    oldPassword,
    newPassword,
    repeatedPassword
  )
  return result
}

async function updateImageUserById (userId, imagePath) {
  const result = await Users.updateImageUserById(userId, imagePath)
  return result
}

async function deleteUserById (userId) {
  await Users.deleteUserById(userId)
}

export {
  getAllUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  updateUserPassword,
  updateImageUserById,
  deleteUserById
}
