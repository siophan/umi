import { existsSync } from 'node:fs';
import path from 'node:path';

import dotenv from 'dotenv';

const workspaceRoot = path.resolve(process.cwd(), '../..');

for (const envFile of ['.env.local', '.env']) {
  const envPath = path.join(workspaceRoot, envFile);
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

const databaseUrl = process.env.DATABASE_URL ?? '';
const parsedDatabaseUrl = databaseUrl ? new URL(databaseUrl) : null;

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  logLevel: process.env.LOG_LEVEL ?? 'info',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  dbHost: process.env.DB_HOST ?? parsedDatabaseUrl?.hostname ?? '',
  dbPort: Number(process.env.DB_PORT ?? parsedDatabaseUrl?.port ?? 3306),
  dbUser: process.env.DB_USER ?? parsedDatabaseUrl?.username ?? '',
  dbPassword: process.env.DB_PASSWORD ?? parsedDatabaseUrl?.password ?? '',
  dbName: process.env.DB_NAME ?? parsedDatabaseUrl?.pathname.replace(/^\//, '') ?? '',
};
