import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'
import { config } from './config.js'

// Obtener __dirname equivalente en ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const swaggerDefinition = {
  openapi: '3.1.0',
  info: {
    title: 'API AGROSIG BACKEND',
    version: '1.0.0',
    description: 'Documentación para la API REST de un proyecto INTEGRADOR - API AGROSIG BACKEND - DAVIDCH',
    contact: {
      name: 'David Chavarria',
      url: 'https://github.com/Dave0097-hdz'
    }
  },
  servers: [
    {
      url: config.docs.urlDocs,
      description: 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
}

// Cargar el archivo YAML con la documentación
const swaggerDocument = YAML.load(resolve(__dirname, './src/docs/index.yaml'))

// Configuración del tema
const theme = new SwaggerTheme()

export const setupSwagger = (app) => {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      customCss: theme.getBuffer(SwaggerThemeNameEnum.DARK),
      explorer: true,
      customSiteTitle: 'API AGROSIG BACKEND - Documentation'
    })
  )
}
