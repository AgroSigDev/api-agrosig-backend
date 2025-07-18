import { Auth } from '../../models/index.js'

async function registerUser (user) {
  const data = await Auth.registerUser(user)
  return data
}

export {
  registerUser
}
