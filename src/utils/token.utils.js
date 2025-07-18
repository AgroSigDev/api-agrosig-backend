import { createToken } from '../helpers/jwt.helper.js'

/**
 * Generates an authentication token for a given user.
 *
 * @param {Object} user - The user object containing user details.
 * @param {number|string} user.user_id - The unique identifier of the user.
 * @param {number|string} user.role_id - The role identifier of the user.
 * @returns {string} The generated authentication token.
 */

function generateAuthToken (user) {
  const payload = {
    user_id: user.user_id,
    role_id: user.role_id
  }
  return createToken(payload)
}

export { generateAuthToken }
