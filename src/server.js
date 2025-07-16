import express from 'express'
import cors from 'cors'
import http from 'http'

const app = express()

// Configuracion del servidor http
const httpServer = http.createServer(app)

// Middlewares
app.use(express.json())
app.use(cors()) // Permitir solicitudes desde cualquier origen

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
    ]
  })
})

export { httpServer }
