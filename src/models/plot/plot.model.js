import { pool } from '../../lib/db.js'
import {
  validFieldsRegisterPlot,
  validateLocationPlot,
  validateArea
} from '../../middlewares/index.js'
import {
  ValidationError,
  ConflictError,
  NotFoundError,
  InternalServerError
} from '../../lib/api.errors.js'
import { logger } from '../../utils/logger.utils.js'

// Función auxiliar para parsear coordenadas de diferentes formatos
function parseCoordinate (coord) {
  if (coord === null || coord === undefined) return NaN

  let coordStr = coord.toString().trim()

  // Reemplazar comas por puntos para formato europeo
  coordStr = coordStr.replace(',', '.')

  // Limpiar caracteres no numéricos excepto punto y signo negativo
  coordStr = coordStr.replace(/[^\d.-]/g, '')

  // Manejar múltiples puntos (como "12..345" o "12.34.56")
  const parts = coordStr.split('.')
  if (parts.length > 2) {
    // Tomar primera parte + punto + resto unido
    coordStr = parts[0] + '.' + parts.slice(1).join('')
  }

  // Eliminar puntos duplicados
  coordStr = coordStr.replace(/\.\.+/g, '.')

  // Si empieza o termina con punto, limpiar
  coordStr = coordStr.replace(/^\.|\.$/g, '')

  const parsed = parseFloat(coordStr)
  logger.plots.info('Coordenada parseada', { original: coord, parsed, coordStr })
  return parsed
}

// Función para extraer coordenadas de strings
function extractCoordinatesFromString (locationString) {
  try {
    // Patrones comunes de coordenadas
    const patterns = [
      /(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/, // "lat, long"
      /(-?\d+\.?\d*)\s*(-?\d+\.?\d*)/, // "lat long"
      /lat[itude]?[:\s]*(-?\d+\.?\d*).*?long[itude]?[:\s]*(-?\d+\.?\d*)/i // "lat: 12.34 long: 56.78"
    ]

    for (const pattern of patterns) {
      const match = locationString.match(pattern)
      if (match) {
        const lat = parseCoordinate(match[1])
        const long = parseCoordinate(match[2])

        if (!isNaN(lat) && !isNaN(long)) {
          return { lat, long }
        }
      }
    }

    return null
  } catch (error) {
    logger.plots.warn('Error extrayendo coordenadas de string', {
      locationString,
      error: error.message
    })
    return null
  }
}

function extractAndValidateCoordinates (plotData) {
  let lat, long

  logger.plots.info('Extrayendo coordenadas', { plotData })

  // Campos lat y long
  if (plotData.lat !== undefined && plotData.long !== undefined) {
    lat = parseCoordinate(plotData.lat)
    long = parseCoordinate(plotData.long)
    logger.plots.info('Coordenadas extraídas de campos lat/long', { lat, long })
  } else if (plotData.location && typeof plotData.location === 'string') {
    // String de coordenadas en location
    const coords = extractCoordinatesFromString(plotData.location)
    if (coords) {
      lat = coords.lat
      long = coords.long
      logger.plots.info('Coordenadas extraídas de location string', { lat, long })
    }
  } else if (plotData.latitude !== undefined) {
    // campos de latitude y longitude
    lat = parseCoordinate(plotData.latitude)
    long = parseCoordinate(plotData.longitude)
    logger.plots.info('Coordenadas extraídas de campos latitude/longitude', { lat, long })
  } if (lat === undefined || long === undefined || isNaN(lat) || isNaN(long)) {
    // Validar que se obtuvieron coordenadas válidas
    logger.plots.warn('Coordenadas inválidas o faltantes', { plotData, avaliableFields: Object.keys(plotData) })
    throw new ValidationError('Valid coordinates are required. Provide either: "lat" and "long", "latitude" and "longitude", or coordinates in "location" field')
  }

  // Validar rangos de tolerancia
  if (lat < -90 || lat > 90) {
    logger.plots.warn('Latitud fuera de rango', { lat })
    throw new ValidationError(`Invalid latitude: ${lat}. Must be between -90 and 90.`)
  }
  if (long < -180 || long > 180) {
    logger.plots.warn('Longitud fuera de rango', { long })
    throw new ValidationError(`Invalid longitude: ${long}. Must be between -180 and 180.`)
  }

  logger.plots.info('Coordenadas validadas exitosamente', { lat, long })
  return { lat, long }
}

/**
 * Creates a new plot for a user after validating the input fields.
 *
 * @async
 * @function
 * @param {string|number} userId - The ID of the user for whom the plot is being created.
 * @param {Object} plot - The plot data to register.
 * @param {string} plot.plot_name - The name of the plot.
 * @param {string} plot.location - The location of the plot in "lat,long" format.
 * @param {number} plot.area - The area of the plot.
 * @param {string|number} plot.lat - The latitude of the plot.
 * @param {string|number} plot.long - The longitude of the plot.
 * @returns {Promise<Object>} The registered plot data.
 * @throws {Error} If validation fails or the user already has a plot.
 */

async function createPlot (userId, plot) {
  try {
    logger.plots.info('Creando nueva parcela', { userId, plot })

    await validFieldsRegisterPlot(plot)

    const existingUserPlot = await getPlotByUserId(userId)
    if (existingUserPlot) {
      logger.plots.warn('El usuario ya tiene una parcela registrada', { userId })
      throw new ConflictError('User already has a plot')
    }

    await validateLocationPlot(plot.location)
    await validateArea(plot.area)

    if (!plot.lat || !plot.long) {
      logger.plots.warn('Faltan coordenadas en la parcela', { userId })
      throw new ValidationError('Latitude and Longitude are required')
    }

    const { lat, long } = extractAndValidateCoordinates(plot)

    const registerQuery = {
      text: 'CALL register_user_plot($1, $2, $3, $4, $5)',
      values: [
        userId,
        plot.plot_name,
        plot.location,
        plot.area,
        `${lat},${long}`
      ]
    }

    const result = await pool.query(registerQuery)

    logger.plots.info('Parcela creada exitosamente', {
      userId,
      plotName: plot.plot_name
    })

    return result.rows[0]
  } catch (error) {
    logger.plots.error('Error creando parcela', {
      userId,
      error: error.message,
      plotData: plot
    })

    // Re-lanzar errores personalizados, envolver otros en InternalServerError
    if (error instanceof ValidationError || error instanceof ConflictError) {
      throw error
    }
    throw new InternalServerError('Error creating plot', { original: error.message })
  }
}

/**
 * Retrieves plot information associated with a specific user ID.
 *
 * @async
 * @function getPlotByUserId
 * @param {number|string} userId - The ID of the user whose plot information is to be retrieved.
 * @returns {Promise<Object|undefined>} A promise that resolves to an object containing user and plot information, or undefined if not found.
 */

async function getPlotByUserId (userId) {
  try {
    logger.plots.info('Obteniendo parcela por ID de usuario', { userId })

    const query = {
      text: 'SELECT u.*, p.plot_id FROM users u JOIN plots p ON u.user_id = p.user_id WHERE u.user_id = $1',
      values: [userId]
    }
    const result = await pool.query(query)

    if (result.rows[0]) {
      logger.plots.info('Parcela encontrada para el usuario', { userId })
    } else {
      logger.plots.info('No se encontró parcela para el usuario', { userId })
    }

    return result.rows[0]
  } catch (error) {
    logger.plots.error('Error obteniendo parcela por ID de usuario', {
      userId,
      error: error.message
    })
    throw error
  }
}

/**
 * Retrieves a plot from the database by its ID.
 *
 * @async
 * @param {number|string} plotId - The ID of the plot to retrieve.
 * @returns {Promise<Object|undefined>} A promise that resolves to the plot object if found, or undefined if not found.
 * @throws {Error} If there is an error during the database query.
 */

async function getPlotbyId (plotId) {
  try {
    logger.plots.info('Obteniendo parcela por ID', { plotId })

    const query = {
      text: 'SELECT * FROM plots WHERE plot_id = $1',
      values: [plotId]
    }
    const result = await pool.query(query)

    if (result.rows[0]) {
      logger.plots.info('Parcela encontrada por ID', { plotId })
    } else {
      logger.plots.warn('Parcela no encontrada por ID', { plotId })
    }

    return result.rows[0]
  } catch (error) {
    logger.plots.error('Error obteniendo parcela por ID', {
      plotId,
      error: error.message
    })
    throw error
  }
}

/**
 * Retrieves a plot by its ID and associated user ID, including spatial coordinates.
 *
 * @async
 * @function getPlotbyUserId
 * @param {number|string} userId - The ID of the user who owns the plot.
 * @param {number|string} plotId - The ID of the plot to retrieve.
 * @returns {Promise<Object|undefined>} A promise that resolves to the plot object with longitude, latitude, and other details, or undefined if not found.
 * @throws {Error} If there is an error during the database query.
 */

async function getPlotbyUserId (userId, plotId) {
  try {
    logger.plots.info('Obteniendo parcela por ID de usuario y ID de parcela', { userId, plotId })

    const query = {
      text: `SELECT plot_id, user_id, plot_name, location, area, 
                    ST_X(geom) as longitude, ST_Y(geom) as latitude,
                    geom, is_active, created_at
             FROM plots WHERE plot_id = $1 AND user_id= $2`,
      values: [plotId, userId]
    }
    const result = await pool.query(query)

    if (result.rows[0]) {
      logger.plots.info('Parcela encontrada por ID de usuario y ID de parcela', { userId, plotId })
    } else {
      logger.plots.warn('Parcela no encontrada por ID de usuario y ID de parcela', { userId, plotId })
    }

    return result.rows[0]
  } catch (error) {
    logger.plots.error('Error obteniendo parcela por ID de usuario y ID de parcela', {
      userId,
      plotId,
      error: error.message
    })
    throw error
  }
}

/**
 * Retrieves all plot records from the database.
 *
 * @async
 * @function
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of plot objects.
 * @throws {Error} If there is an error while querying the database.
 */

async function getAllPlots () {
  try {
    logger.plots.info('Obteniendo todas las parcelas')

    const query = {
      text: 'SELECT * FROM plots'
    }
    const result = await pool.query(query)

    logger.plots.info('Todas las parcelas obtenidas exitosamente', {
      total: result.rows.length
    })

    return result.rows
  } catch (error) {
    logger.plots.error('Error obteniendo todas las parcelas', {
      error: error.message
    })
    throw error
  }
}

/**
 * Retrieves the coordinates and details of the most recently created plot for a given user.
 *
 * @async
 * @function getUbicationCoords
 * @param {number|string} userId - The ID of the user whose plot coordinates are to be retrieved.
 * @returns {Promise<Array<Object>>} Resolves with an array of plot objects containing plot_id, user_id, plot_name, lat, long, and area.
 * @throws {Error} Throws an error if the database query fails.
 */

async function getUbicationCoords (userId) {
  try {
    logger.plots.info('Obteniendo coordenadas de ubicación de parcela', { userId })

    const query = {
      text: `SELECT plot_id, user_id, plot_name,location, ST_X(geom) as lat, ST_Y(geom) as long, area FROM plots 
      WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      values: [userId]
    }
    const result = await pool.query(query)

    logger.plots.info('Coordenadas de ubicación obtenidas exitosamente', {
      userId,
      total: result.rows.length
    })

    return result.rows
  } catch (error) {
    logger.plots.error('Error obteniendo coordenadas de ubicación', {
      userId,
      error: error.message
    })
    throw error
  }
}

/**
 * Updates a plot by its ID for a specific user after validating the input data.
 * Ensures the plot exists and belongs to the user, validates fields, and updates the plot in the database.
 *
 * @async
 * @param {number|string} userId - The ID of the user updating the plot.
 * @param {number|string} plotId - The ID of the plot to update.
 * @param {Object} plotData - The updated plot data.
 * @param {string} plotData.plot_name - The new name of the plot.
 * @param {string} plotData.location - The new location of the plot in "lat,long" format.
 * @param {number} plotData.area - The new area of the plot.
 * @param {number|string} [plotData.lat] - The latitude (optional if location is provided).
 * @param {number|string} [plotData.long] - The longitude (optional if location is provided).
 * @returns {Promise<Object>} The updated plot object.
 * @throws {Error} If validation fails, plot not found, user does not own the plot, or database error occurs.
 */

async function updatePlotById (userId, plotId, plotData) {
  try {
    logger.plots.info('Actualizando parcela por ID', { userId, plotId, plotData })

    await validFieldsRegisterPlot(plotData)
    await validateLocationPlot(plotData.location)
    await validateArea(plotData.area)

    // Validate that the user has a plot and that the plot exists
    const existingPlot = await getPlotbyId(plotId)
    if (!existingPlot) {
      logger.plots.warn('Parcela no encontrada para actualizar', { plotId })
      throw new NotFoundError('Plot not found')
    }

    if (existingPlot.user_id !== userId) {
      logger.plots.warn('El usuario no es propietario de la parcela', { userId, plotId })
      throw new ConflictError('User does not own this plot')
    }

    const { lat, long } = extractAndValidateCoordinates(plotData)

    const updateQuery = {
      text: 'CALL update_user_plot($1, $2, $3, $4, $5, $6)',
      values: [
        userId,
        plotId,
        plotData.plot_name,
        plotData.location,
        plotData.area,
        `${lat},${long}`
      ]
    }

    await pool.query(updateQuery)

    const selectQuery = {
      text: `SELECT plot_id, user_id, plot_name, location, area, 
                    ST_X(geom) as longitude, ST_Y(geom) as latitude,
                    geom, is_active, created_at
             FROM plots WHERE plot_id = $1`,
      values: [plotId]
    }
    const result = await pool.query(selectQuery)

    logger.plots.info('Parcela actualizada exitosamente', { userId, plotId })

    return result.rows[0]
  } catch (error) {
    logger.plots.error('Error actualizando parcela por ID', {
      userId,
      plotId,
      error: error.message
    })

    if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof ConflictError) {
      throw error
    }
    throw new InternalServerError('Error updating plot by ID', { original: error.message })
  }
}

/**
 * Soft deletes a plot by its ID for a specific user.
 *
 * This function checks if the plot exists and if it belongs to the given user.
 * If both conditions are met, it performs a soft delete operation on the plot.
 *
 * @async
 * @function detelePlotById
 * @param {number|string} userId - The ID of the user attempting to delete the plot.
 * @param {number|string} plotId - The ID of the plot to be deleted.
 * @throws {Error} If the plot is not found or the user does not own the plot.
 * @throws {Error} If there is an error during the deletion process.
 * @returns {Promise<void>} Resolves when the plot is successfully soft deleted.
 */

async function detelePlotById (userId, plotId) {
  try {
    logger.plots.info('Eliminando parcela por ID', { userId, plotId })

    const existingPlot = await getPlotbyId(plotId)
    if (!existingPlot) {
      logger.plots.warn('Parcela no encontrada para eliminar', { plotId })
      throw new NotFoundError('Plot not found')
    }

    if (existingPlot.user_id !== userId) {
      logger.plots.warn('El usuario no es propietario de la parcela para eliminar', { userId, plotId })
      throw new ConflictError('User does not own this plot')
    }

    const query = {
      text: 'CALL soft_delete_user_plot($1, $2)',
      values: [userId, plotId]
    }
    await pool.query(query)

    logger.plots.info('Parcela eliminada exitosamente', { userId, plotId })
  } catch (error) {
    logger.plots.error('Error eliminando parcela por ID', {
      userId,
      plotId,
      error: error.message
    })

    if (error instanceof NotFoundError || error instanceof ConflictError) {
      throw error
    }
    throw new InternalServerError('Error deleting plot by ID', { original: error.message })
  }
}

export const Plot = {
  createPlot,
  getPlotByUserId,
  getPlotbyId,
  getPlotbyUserId,
  getAllPlots,
  getUbicationCoords,
  updatePlotById,
  detelePlotById
}
