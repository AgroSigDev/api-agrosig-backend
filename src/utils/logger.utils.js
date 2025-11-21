import { createLogger, format, transports } from 'winston'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    // 🚨 Solo errores
    new transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error'
    }),

    // ⚠️ Advertencias
    new transports.File({
      filename: path.join(__dirname, '../logs/warn.log'),
      level: 'warn'
    }),

    // ℹ️ Solo info
    new transports.File({
      filename: path.join(__dirname, '../logs/info.log'),
      level: 'info'
    }),

    // 📝 Todos los logs combinados
    new transports.File({
      filename: path.join(__dirname, '../logs/combined.log')
    }),

    // 🖥️ Consola (solo en desarrollo)
    ...(process.env.NODE_ENV !== 'production'
      ? [new transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple()
          )
        })]
      : [])
  ]
})

// 🎭 Métodos helper por contexto
logger.auth = {
  info: (message, meta = {}) => logger.info({ ...meta, context: 'AUTH', message }),
  error: (message, meta = {}) => logger.error({ ...meta, context: 'AUTH', message }),
  warn: (message, meta = {}) => logger.warn({ ...meta, context: 'AUTH', message })
}

logger.database = {
  info: (message, meta = {}) => logger.info({ ...meta, context: 'DATABASE', message }),
  error: (message, meta = {}) => logger.error({ ...meta, context: 'DATABASE', message }),
  warn: (message, meta = {}) => logger.warn({ ...meta, context: 'DATABASE', message })
}

logger.api = {
  info: (message, meta = {}) => logger.info({ ...meta, context: 'API', message }),
  error: (message, meta = {}) => logger.error({ ...meta, context: 'API', message }),
  warn: (message, meta = {}) => logger.warn({ ...meta, context: 'API', message })
}

logger.validation = {
  info: (message, meta = {}) => logger.info({ ...meta, context: 'VALIDATION', message }),
  error: (message, meta = {}) => logger.error({ ...meta, context: 'VALIDATION', message }),
  warn: (message, meta = {}) => logger.warn({ ...meta, context: 'VALIDATION', message })
}

logger.users = {
  info: (message, meta = {}) => logger.info({ ...meta, context: 'USERS', message }),
  error: (message, meta = {}) => logger.error({ ...meta, context: 'USERS', message }),
  warn: (message, meta = {}) => logger.warn({ ...meta, context: 'USERS', message })
}

logger.plots = {
  info: (message, meta = {}) => logger.info({ ...meta, context: 'PLOTS', message }),
  error: (message, meta = {}) => logger.error({ ...meta, context: 'PLOTS', message }),
  warn: (message, meta = {}) => logger.warn({ ...meta, context: 'PLOTS', message })
}
logger.weather = {
  info: (message, meta = {}) => logger.info({ ...meta, context: 'WEATHER', message }),
  error: (message, meta = {}) => logger.error({ ...meta, context: 'WEATHER', message }),
  warn: (message, meta = {}) => logger.warn({ ...meta, context: 'WEATHER', message })
}

logger.crops = {
  info: (message, meta = {}) => logger.info({ ...meta, context: 'CROPS', message }),
  error: (message, meta = {}) => logger.error({ ...meta, context: 'CROPS', message }),
  warn: (message, meta = {}) => logger.warn({ ...meta, context: 'CROPS', message })
}

export { logger }
