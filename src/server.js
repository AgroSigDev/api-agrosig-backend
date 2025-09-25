import express from 'express'
import cors from 'cors'
import http from 'http'
import { setupSwagger } from '../swagger.config.js'
import { config } from '../config.js'
import userRouter from './routes/users/users.routes.js'
import authRouter from './routes/auth/auth.routes.js'
import plotRouter from './routes/plots/plots.routes.js'
import weatherPlotRouter from './routes/weather/weather.routes.js'
import cropRouter from './routes/crop/crop.routes.js'
import activityRouter from './routes/activitys/activity.routes.js'
import reportRouter from './routes/report/report.routes.js'
import path from 'path'
import { fileURLToPath } from 'url'

const app = express()

// Configuracion del servidor http
const httpServer = http.createServer(app)

// Middlewares
app.use(express.json())
app.use(cors()) // Permitir solicitudes desde cualquier origen
app.use(express.urlencoded({ extended: true })) // Permitir el análisis de datos de formularios

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

// Ruta Raiz
app.get('/', (request, response) => {
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

export { httpServer }
