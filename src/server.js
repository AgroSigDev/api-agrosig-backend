import express from 'express'
import cors from 'cors'
import http from 'http'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { Server } from 'socket.io'
import { setupSwagger } from '../swagger.config.js'
import { config } from '../config.js'
import userRouter from './routes/users/users.routes.js'
import authRouter from './routes/auth/auth.routes.js'
import plotRouter from './routes/plots/plots.routes.js'
import weatherPlotRouter from './routes/weather/weather.routes.js'
import cropRouter from './routes/crop/crop.routes.js'
import activityRouter from './routes/activitys/activity.routes.js'
import reportRouter from './routes/report/report.routes.js'
import productionRouter from './routes/production_batch/production_batch.routes.js'
import { setupChatNameSpace, socketNotifications } from './sockets/index.js'
import path from 'path'
import { fileURLToPath } from 'url'

const app = express()

// Configuracion del servidor http
const httpServer = http.createServer(app)

// Seguridad y Middlewares
app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true })) // Permitir el análisis de datos de formularios

// CORS
app.use(cors()) // Permitir solicitudes desde cualquier origen

// Rate limiter general para los endpoints REST
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 250
})
app.use('/api/', apiLimiter)

// Configuracion de Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
})

io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado al namespace raíz', socket.id)
})

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuracion de Swagger
setupSwagger(app)

app.use('/images', express.static(path.join(__dirname, 'src/uploads/profile')))

// Rutas - Endpoints
app.use('/users', userRouter)
app.use('/auth', authRouter)
app.use('/plots', plotRouter)
app.use('/weather', weatherPlotRouter)
app.use('/crop', cropRouter)
app.use('/activity', activityRouter)
app.use('/report', reportRouter)
app.use('/production', productionRouter)

// Ruta Raiz
app.get('/test-sockets', (request, response) => {
  response.json({
    description: 'Proyecto INTEGRADOR - API AGROSIG BACKEND - DAVIDCH',
    version: '1.0.0',
    author: [
      {
        name: 'David Chavarria',
        userGit: '@davidch'
      }
    ],
    documentation: `${config.docs.baseUrl || 'http://localhost:' + config.port}/api-docs`
  })
})

app.get('/test-sockets', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// Configurar namespace (chat, notifications)
setupChatNameSpace(io)
socketNotifications(io)

// Manejar errores globales para sockets
io.on('error', (err) => {
  console.error('Socket.IO error', err)
})

export { httpServer }
