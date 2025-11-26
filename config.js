import * as dotenv from 'dotenv'

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local'
dotenv.config({ path: envFile })

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
  appUrl: process.env.APP_URL || 'https://agrosig-frontend.vercel.app',
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
  docs: {
    urlDocs: process.env.ENDPOINT_SWAGGER,
    baseUrl: process.env.BASE_URL
  },
  weather: {
    appid: process.env.API_CLIMA
  },
  firebase: {
    firebase_type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    clientId: process.env.FIREBASE_CLIENT_ID,
    authUri: process.env.FIREBASE_AUTH_URI,
    tokenUri: process.env.FIREBASE_TOKEN_URI,
    authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    clientX509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universeDomain: process.env.FIREBASE_UNIVERSE_DOMAIN
  },
  env: process.env.NODE_ENV || 'development'
}
