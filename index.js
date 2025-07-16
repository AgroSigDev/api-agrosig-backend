import { config } from './config.js'
import { httpServer } from './src/server.js'

async function startServer () {
  // Conectar nuestra base de datos

  // Iniciar el servidor HTTP
  await new Promise((resolve) => httpServer.listen({ port: config.port }, resolve))
  console.log(`Servidor HTTP corriendo en http://localhost:${config.port}`)
}

startServer()
  .catch(error => console.error('Error al iniciar el servidor:', error))
