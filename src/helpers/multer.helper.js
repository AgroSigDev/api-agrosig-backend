import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Asegurarse de que el directorio existe
const profileDir = 'src/uploads/profile'
if (!fs.existsSync(profileDir)) {
  fs.mkdirSync(profileDir, { recursive: true })
}

/**
 * Multer disk storage configuration for profile image uploads.
 * Saves files to the 'src/uploads/profile' directory with unique filenames.
 * @type {multer.StorageEngine}
 */
const storageProfile = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profileDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname))
  }
})

/**
 * File filter function for multer to validate image file types.
 * Only allows PNG, JPG, JPEG, and WebP image formats.
 * @param {object} req - The Express request object.
 * @param {object} file - The file object being uploaded.
 * @param {function} cb - Callback function to indicate acceptance or rejection.
 */
const multerFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(png|jpg|jpeg|webp)$/)) {
    return cb(new Error('Por favor, cargue una imagen (PNG, JPG, JPEG)'))
  }
  cb(null, true)
}

/**
 * Multer middleware for handling single profile image uploads.
 * Configured with disk storage, file type filtering, and a 5MB size limit.
 * Expects a single file field named 'image_user'.
 * @type {multer.Multer}
 */
export const uploadProfile = multer({
  storage: storageProfile,
  fileFilter: multerFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB límite
  }
}).single('image_user')
