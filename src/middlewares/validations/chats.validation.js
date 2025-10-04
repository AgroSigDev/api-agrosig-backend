async function validFieldsRegisterComment (comment) {
  if (!comment.message || comment.message.trim() === '') {
    console.error('Missing or empty message in comment registration:', comment)
    throw new Error('Message is required and cannot be empty')
  }
}

export {
  validFieldsRegisterComment
}
