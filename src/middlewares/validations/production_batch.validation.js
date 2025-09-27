async function validateProductionBatch (batchData) {
  if (
    !batchData.name ||
    batchData.name.trim().lenght === 0
  ) {
    console.error('Missing fields in production batch registration:', batchData)
    throw new Error('Name is required')
  }
}

export {
  validateProductionBatch
}
