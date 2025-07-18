import bcrypt from 'bcrypt'

/**
 * Hashes a plain text password using bcrypt with a salt round of 10.
 *
 * @async
 * @param {string} password - The plain text password to be hashed.
 * @returns {Promise<string>} The hashed password.
 */
async function hashPassword (password) {
  const hasedPassword = await bcrypt.hash(password, 10)
  return hasedPassword
}

/**
 * Compares a plain text password with a hashed password.
 *
 * @async
 * @function
 * @param {string} password - The plain text password to compare.
 * @param {string} hash - The hashed password to compare against.
 * @returns {Promise<boolean>} Resolves to true if the password matches the hash, otherwise false.
 */
async function comparePassword (password, hash) {
  return await bcrypt.compare(password, hash)
}

export {
  hashPassword,
  comparePassword
}
