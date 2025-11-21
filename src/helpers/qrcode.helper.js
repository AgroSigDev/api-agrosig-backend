import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'
import { logger } from '../utils/logger.utils.js'

/**
 * Generates a unique batch code combining timestamp and UUID.
 * Creates a standardized batch identifier in the format: BATCH-{timestamp}-{shortUUID}
 * @returns {string} A unique batch code string.
 */
function generateUniqueBatchCode () {
  const timestamp = Date.now()
  const uniqueId = uuidv4().substring(0, 8).toUpperCase()
  return `BATCH-${timestamp}-${uniqueId}`
}

/**
 * Generates a QR code as a data URL from the provided URL with customizable options.
 * Uses the qrcode library to create a QR code image encoded as a base64 data URL.
 * @param {string} url - The URL to encode in the QR code.
 * @param {object} [options={}] - Optional configuration object for QR code generation.
 * @param {number} [options.width=400] - Width of the QR code in pixels.
 * @param {number} [options.margin=3] - Margin around the QR code.
 * @param {string} [options.darkColor='#1a365d'] - Color of the dark modules (foreground).
 * @param {string} [options.lightColor='#FFFFFF'] - Color of the light modules (background).
 * @param {string} [options.errorCorrectionLevel='Q'] - Error correction level ('L', 'M', 'Q', 'H').
 * @returns {Promise<string>} A promise that resolves to the QR code as a data URL string.
 * @throws {Error} If QR code generation fails, with details about the error.
 */
async function generateQRCodeDataURL (url, options = {}) {
  try {
    const qrOptions = {
      width: options.width || 400,
      margin: options.margin || 3,
      color: {
        dark: options.darkColor || '#1a365d',
        light: options.lightColor || '#FFFFFF'
      },
      errorCorrectionLevel: options.errorCorrectionLevel || 'Q'
    }
    const qrDataURL = await QRCode.toDataURL(url, qrOptions)
    return qrDataURL
  } catch (error) {
    logger.production.error('Error generando código QR', {
      url,
      error: error.message
    })
    throw new Error(`Error generando código QR: ${error.message}`)
  }
}

export {
  generateUniqueBatchCode,
  generateQRCodeDataURL
}
