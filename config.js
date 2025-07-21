import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

/**
 * Application configuration object.
 * @namespace config
 * @property {number|string} port - The port number the server listens on. Defaults to 4000.
 * @property {Object} db - Database connection configuration.
 * @property {string} db.host - Database host. Defaults to 'localhost'.
 * @property {number|string} db.port - Database port. Defaults to 5432.
 * @property {string} db.user - Database user. Defaults to 'postgres'.
 * @property {string} db.password - Database password. Defaults to 'root'.
 * @property {string} db.name - Database name. Defaults to 'survey_db'.
 * @property {Object} jwt - JWT authentication configuration.
 * @property {string} jwt.secret - JWT secret key. Defaults to 'secret'.
 * @property {string} jwt.expireIn - JWT expiration time. Defaults to '12h'.
 * @property {string} jwt.refreshSecret - JWT refresh secret key. Defaults to 'refreshSecret'.
 * @property {string} env - Application environment. Defaults to 'development'.
 */

export const config = {
  port: process.env.PORT || 4000,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
    name: process.env.DB_NAME || 'agrosig_db'
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expireIn: process.env.JWT_EXPIRE_IN,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refresTokenExpireIn: process.env.JWT_REFRESH_EXPIRE_IN
  },
  env: process.env.NODE_ENV || 'development'
}
