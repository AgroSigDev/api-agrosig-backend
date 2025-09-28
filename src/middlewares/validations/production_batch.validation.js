async function validateProductionBatch (batchData) {
  if (
    !batchData.name ||
    batchData.name.trim().length === 0
  ) {
    console.error('Missing fields in production batch registration:', batchData)
    throw new Error('Name is required')
  }
}

async function validateActivityIds (activityIds) {
  if (!Array.isArray(activityIds)) {
    throw new Error('activity_ids debe ser un array')
  }

  if (activityIds.length === 0) {
    throw new Error('Se requiere al menos una actividad')
  }

  // Validar que todos los IDs sean números positivos
  for (const id of activityIds) {
    if (isNaN(parseInt(id)) || parseInt(id) <= 0) {
      throw new Error(`ID de actividad inválido: ${id}`)
    }
  }

  // Validar que no haya duplicados
  const uniqueIds = [...new Set(activityIds)]
  if (uniqueIds.length !== activityIds.length) {
    throw new Error('Hay IDs de actividad duplicados')
  }
}

export {
  validateProductionBatch,
  validateActivityIds
}
