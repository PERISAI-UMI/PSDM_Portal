/**
 * Migration: Tambah tabel app_settings dan inisialisasi default settings
 * Jalankan: npx tsx src/db/migrate-app-settings.ts
 */

import { createClient } from '@libsql/client/web';
import 'dotenv/config';

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error('TURSO_DATABASE_URL tidak ditemukan di environment variables');
  }

  const client = createClient({ url, authToken });

  console.log('🚀 Memulai migrasi tabel app_settings...');

  // 1. Buat tabel app_settings
  await client.execute(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT '',
      updated_at INTEGER NOT NULL
    );
  `);
  console.log('✅ Tabel app_settings berhasil dibuat (atau sudah ada)');

  // 2. Insert default keys jika belum ada
  const now = Date.now();
  await client.execute({
    sql: `INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?);`,
    args: ['wa_bot_url', '', now],
  });
  await client.execute({
    sql: `INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?);`,
    args: ['wa_api_key', '', now],
  });

  console.log('✅ Default settings (wa_bot_url, wa_api_key) berhasil diinisialisasi');

  console.log('\n🎉 Migrasi app_settings selesai!');
  client.close();
}

main().catch((err) => {
  console.error('❌ Migrasi gagal:', err);
  process.exit(1);
});
