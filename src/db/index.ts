import { createClient, type Client } from '@libsql/client/web';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from './schema/index.ts';

export interface DatabaseEnv {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN?: string;
}

let cachedDb: { key: string; instance: LibSQLDatabase<typeof schema> } | null = null;

/**
 * Factory to create edge-safe Turso client and Drizzle instance
 * Optimized for Cloudflare Workers / Edge runtimes with isolate-level instance reuse.
 */
export function createDb(env: DatabaseEnv): LibSQLDatabase<typeof schema> {
  const cacheKey = `${env.TURSO_DATABASE_URL}:${env.TURSO_AUTH_TOKEN || ''}`;
  if (cachedDb && cachedDb.key === cacheKey) {
    return cachedDb.instance;
  }

  const client: Client = createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });

  const instance = drizzle(client, { schema });
  cachedDb = { key: cacheKey, instance };
  return instance;
}

export type AppDatabase = LibSQLDatabase<typeof schema>;
export * from './schema/index.ts';
