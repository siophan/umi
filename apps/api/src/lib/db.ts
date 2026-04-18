import mysql from 'mysql2/promise';

import { env } from '../env';

let pool: mysql.Pool | null = null;

function assertDatabaseConfig() {
  if (!env.dbHost || !env.dbUser || !env.dbName) {
    throw new Error('数据库未配置，请设置 DB_HOST / DB_USER / DB_PASSWORD / DB_NAME');
  }
}

export function getDbPool() {
  if (pool) {
    return pool;
  }

  assertDatabaseConfig();

  pool = mysql.createPool({
    host: env.dbHost,
    port: env.dbPort,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
  });

  return pool;
}
