import { pool } from '../../lib/db.js'
import {
  validFieldsRegisterPlot,
  validateLocationPlot,
  validateArea
} from '../../middlewares/index.js'

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
    await validFieldsRegisterPlot(plot)

    const existingUserPlot = await getPlotByUserId(userId)
    if (existingUserPlot) {
      throw new Error('User already has a plot')
    }
    await validateLocationPlot(plot.location)
    await validateArea(plot.area)

    if (!plot.lat || !plot.long) {
      throw new Error('Latitude and Longitude are required')
    }

    let lat, long
    if (plot.lat && plot.long) {
      lat = plot.lat
      long = plot.long
    } else if (plot.location && plot.location.includes(',')) {
      [lat, long] = plot.location.split(',').map(coord => coord.trim())
    } else {
      throw new Error('Latitude and Longitude are required in format "lat,long"')
    }

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
    return result.rows[0]
  } catch (error) {
    console.error('Error creating plot:', error)
    throw error
  }
}

async function findUserPlotUser (userId) {
  try {
    const query = {
      text: 'SELECT plot_id FROM plots WHERE user_id = $1 ORDER BY created_At DESC LIMIT 1',
      values: [userId]
    }
    const result = await pool.query(query)
    return result.rows[0]
  } catch (error) {
    console.error('Error finding user plot:', error)
    throw error
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
    const query = {
      text: 'SELECT u.*, p.plot_id FROM users u JOIN plots p ON u.user_id = p.user_id WHERE u.user_id = $1',
      values: [userId]
    }
    const result = await pool.query(query)
    return result.rows[0]
  } catch (error) {
    console.error('Error getting plot by user ID:', error)
    throw error
  }
}

async function getPlotbyId (plotId) {
  try {
    const query = {
      text: 'SELECT * FROM plots WHERE plot_id = $1',
      values: [plotId]
    }
    const result = await pool.query(query)
    return result.rows[0]
  } catch (error) {
    console.error('Error getting plot by ID:', error)
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
    const query = {
      text: 'SELECT * FROM plots'
    }
    const result = await pool.query(query)
    return result.rows
  } catch (error) {
    console.error('Error getting all plots:', error)
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
    const query = {
      text: `SELECT plot_id, user_id, plot_name,location, ST_X(geom) as lat, ST_Y(geom) as long, area FROM plots 
      WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      values: [userId]
    }
    const result = await pool.query(query)
    return result.rows
  } catch (error) {
    console.error('Error getting ubication', error)
    throw error
  }
}

async function updatePlotById (userId, plotId, plotData) {
  try {
    await validFieldsRegisterPlot(plotData)
    await validateLocationPlot(plotData.location)
    await validateArea(plotData.area)

    // Validate that the user has a plot and that the plot exists
    const existingPlot = await getPlotbyId(plotId)
    if (!existingPlot) {
      throw new Error('Plot not found')
    }

    if (existingPlot.user_id !== userId) {
      throw new Error('User does not own this plot')
    }

    let lat, long
    if (plotData.lat && plotData.long) {
      lat = plotData.lat
      long = plotData.long
    } else if (plotData.location && plotData.location.includes(',')) {
      [lat, long] = plotData.location.split(',').map(coord => coord.trim())
    } else {
      throw new Error('Latitude and Longitude are required in format "lat,long"')
    }

    const query = {
      text: 'UPDATE plots SET plot_name = $1, location = $2, area = $3, geom = ST_SetSRID(ST_MakePoint($4, $5), 4326) WHERE plot_id = $6 AND user_id = $7 RETURNING *',
      values: [
        plotData.plot_name,
        plotData.location,
        plotData.area,
        lat,
        long,
        plotId,
        userId
      ]
    }
    const result = await pool.query(query)
    return result.rows[0]
  } catch (error) {
    console.error('Error updating plot by ID:', error)
    throw error
  }
}

async function detelePlotById (userId, plotId) {
  try {
    const existingPlot = await getPlotbyId(plotId)
    if (!existingPlot) {
      throw new Error('Plot not found')
    }

    if (existingPlot.user_id !== userId) {
      throw new Error('User does not own this plot')
    }

    const query = {
      text: 'CALL soft_delete_user_plot($1, $2)',
      values: [userId, plotId]
    }
    await pool.query(query)
  } catch (error) {
    console.error('Error deleting plot by ID:', error)
    throw error
  }
}

export const Plot = {
  createPlot,
  findUserPlotUser,
  getPlotByUserId,
  getPlotbyId,
  getAllPlots,
  getUbicationCoords,
  updatePlotById,
  detelePlotById
}
