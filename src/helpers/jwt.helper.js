import jwt from 'jsonwebtoken'
import { config } from '../../config.js'

/**
 * Generates a JWT token for the given user.
 *
 * @param {Object} user - The user object containing user details.
 * @param {number|string} user.user_id - The unique identifier of the user.
 * @param {number|string} user.role_id - The role identifier of the user.
 * @returns {string} The signed JWT token.
 */

function createToken (user) {
  const payload = {
    user_id: user.user_id,
    role_id: user.role_id
  }

  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expireIn })
}

/**
 * Verifies a JWT token and returns the decoded payload.
 *
 * @param {string} bearer - The JWT token to verify.
 * @returns {Object} The decoded token payload.
 * @throws {Error} If the token is invalid or verification fails.
 */

function verifyToken (bearer) {
  const decoded = jwt.verify(bearer, config.jwt.secret)
  return decoded
}

export { createToken, verifyToken }
