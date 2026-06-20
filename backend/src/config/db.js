

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

function getEnv(name) {

  const v = process.env[name];
  return v && v.trim().length ? v : undefined;
}

const databaseUrl = getEnv('DATABASE_URL');
const host = getEnv('DB_HOST');
const port = getEnv('DB_PORT');
const database = getEnv('DB_NAME');
const user = getEnv('DB_USER');
const password = getEnv('DB_PASSWORD');

const connectionString =
  databaseUrl ||
  (host && port && database && user && password
    ? `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`
    : undefined);

// Helpful debug when DATABASE_URL is unexpectedly undefined
if (!connectionString) {
  console.error('ENV DEBUG (db.js):', {
    DATABASE_URL_present: Boolean(process.env.DATABASE_URL),
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    // avoid printing DB_PASSWORD/DATABASE_URL itself
    DATABASE_URL_length: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0,
  });

  throw new Error(
    'Missing database connection config. Provide DATABASE_URL or set DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD in backend/.env.'
  );
}

// end debug / validation

export const sequelize = new Sequelize(connectionString, {

  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});


