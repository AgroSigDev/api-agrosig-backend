import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Asegurarse de que el directorio existe
const profileDir = 'src/uploads/profile'
if (!fs.existsSync(profileDir)) {
  fs.mkdirSync(profileDir, { recursive: true })
}

// Configuración base de almacenamiento
const storageProfile = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profileDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const multerFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(png|jpg|jpeg|webp)$/)) {
    return cb(new Error('Por favor, cargue una imagen (PNG, JPG, JPEG)'))
  }
  cb(null, true)
}

export const uploadProfile = multer({
  storage: storageProfile,
  fileFilter: multerFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB límite
  }
}).single('image_user')
