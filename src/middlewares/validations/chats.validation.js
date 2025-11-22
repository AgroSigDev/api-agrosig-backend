import { ValidationError } from '../../lib/api.errors.js'

/**
 * Validates the required fields for registering a comment.
 * Ensures that the comment message is provided and not empty.
 * @param {object} comment - The comment data object to validate.
 * @param {string} comment.message - The message content of the comment (required).
 * @throws {ValidationError} If the message is missing or empty.
 */
async function validFieldsRegisterComment (comment) {
  if (!comment.message || comment.message.trim() === '') {
    throw new ValidationError('Message is required and cannot be empty')
  }
}

export {
  validFieldsRegisterComment
}
