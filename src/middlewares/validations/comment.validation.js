async function validateFieldsComment (message) {
  if (!message) {
    console.error('Missing fields in comment:', message)
    throw new Error('There are missing fields to submit in the application')
  }
}

export {
  validateFieldsComment
}
