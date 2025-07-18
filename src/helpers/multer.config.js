import multer from 'multer'
import path from 'path'

// Configuración base de almacenamiento
const storageProfile = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'src/uploads/profile')
  },
  filename: (req, file, cb) => {
    cb(null, `image-${Date.now()}` + path.extname(file.originalname))
    // path.extname obtiene la extensión del archivo cargado
  }
})

const multerFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(png|jpg)$/)) {
    // cargar solo formatos png y jpg
    return cb(new Error('Por favor, cargue una imagen'))
  }
  cb(null, true)
}

export const uploadProfile = multer({
  storage: storageProfile,
  fileFilter: multerFilter
}).single('image_user') // 'image_user' es el nombre del campo en el formulario
