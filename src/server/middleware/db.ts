import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../types.ts';
import { createDb } from '../../db/index.ts';

/**
 * Middleware untuk menginisialisasi koneksi libSQL / Turso per-request
 * Menggunakan environment bindings Cloudflare Workers (c.env)
 */
export const dbMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  let dbUrl = c.env?.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL;
  const authToken = c.env?.TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

  // Web-client requires libsql:, https:, wss:, ws: or http: protocol
  if (!dbUrl || dbUrl.startsWith('file:')) {
    dbUrl = 'https://psdm-edge-db-demo.turso.io';
  }

  const db = createDb({
    TURSO_DATABASE_URL: dbUrl,
    TURSO_AUTH_TOKEN: authToken,
  });

  c.set('db', db);
  await next();
});
