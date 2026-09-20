import { createClient, type Client } from '@libsql/client/web';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from './schema/index.ts';

export interface DatabaseEnv {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN?: string;
}

/**
 * Factory to create edge-safe Turso client and Drizzle instance
 * Optimized for Cloudflare Workers / Edge runtimes with per-request or global reuse.
 */
export function createDb(env: DatabaseEnv): LibSQLDatabase<typeof schema> {
  const client: Client = createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });

  return drizzle(client, { schema });
}

export type AppDatabase = LibSQLDatabase<typeof schema>;
export * from './schema/index.ts';
