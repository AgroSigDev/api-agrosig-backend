import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'

function generateUniqueBatchCode () {
  const timestamp = Date.now()
  const uniqueId = uuidv4().substring(0, 8).toUpperCase()
  return `BATCH-${timestamp}-${uniqueId}`
}

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
    throw new Error(`Error generando código QR: ${error.message}`)
  }
}

export {
  generateUniqueBatchCode,
  generateQRCodeDataURL
}
