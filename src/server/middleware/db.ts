import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../types.ts';
import { createDb } from '../../db/index.ts';

/**
 * Middleware untuk menginisialisasi koneksi libSQL / Turso per-request
 * Menggunakan environment bindings Cloudflare Workers (c.env)
 */
export const dbMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const dbUrl = c.env?.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL;
  const authToken = c.env?.TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

  if (!dbUrl) {
    console.error('TURSO_DATABASE_URL is not set');
    return c.json({ success: false, message: 'Database not configured' }, 503);
  }

  const db = createDb({
    TURSO_DATABASE_URL: dbUrl,
    TURSO_AUTH_TOKEN: authToken,
  });

  c.set('db', db);
  await next();
});
