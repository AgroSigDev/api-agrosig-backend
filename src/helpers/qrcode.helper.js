import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'

function generateUniqueBatchCode () {
  const timestamp = Date.now()
  const uniqueId = uuidv4().substring(0, 8).toUpperCase()
  return `BATCH-${timestamp}-${uniqueId}`
}

async function generateQRCodeDataURL (url) {
  try {
    return await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
  } catch (error) {
    throw new Error(`Error generando código QR: ${error.message}`)
  }
}

export {
  generateUniqueBatchCode,
  generateQRCodeDataURL
}
