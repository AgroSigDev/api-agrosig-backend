import { Auth } from '../../models/index.js'

async function registerUser (user) {
  const data = await Auth.registerUser(user)
  return data
}

async function loginUser (user) {
  const data = await Auth.loginUser(user)
  return data
}

async function logoutUser (refreshToken) {
  const data = await Auth.logoutUser(refreshToken)
  return data
}

export {
  registerUser,
  loginUser,
  logoutUser
}
