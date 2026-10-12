/**
 * Migration: Tambah tabel wa_broadcasts dan wa_broadcast_recipients
 * untuk fitur Semi-Automatic WhatsApp Broadcast.
 *
 * Jalankan: npx tsx src/db/migrate-wa-broadcast.ts
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

  console.log('🚀 Memulai migrasi WA Broadcast tables...');

  // Tabel 1: wa_broadcasts
  await client.execute(`
    CREATE TABLE IF NOT EXISTS wa_broadcasts (
      id TEXT PRIMARY KEY,
      activity_id TEXT NOT NULL UNIQUE,
      message_template TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
    );
  `);
  console.log('✅ Tabel wa_broadcasts berhasil dibuat (atau sudah ada)');

  // Index untuk wa_broadcasts
  await client.execute(`
    CREATE INDEX IF NOT EXISTS wa_broadcasts_activity_idx ON wa_broadcasts(activity_id);
  `);
  console.log('✅ Index wa_broadcasts_activity_idx berhasil dibuat');

  // Tabel 2: wa_broadcast_recipients
  await client.execute(`
    CREATE TABLE IF NOT EXISTS wa_broadcast_recipients (
      id TEXT PRIMARY KEY,
      broadcast_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      rendered_message TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      error TEXT,
      sent_at INTEGER,
      sent_by TEXT,
      FOREIGN KEY (broadcast_id) REFERENCES wa_broadcasts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE SET NULL
    );
  `);
  console.log('✅ Tabel wa_broadcast_recipients berhasil dibuat (atau sudah ada)');

  // Pastikan kolom error ada jika tabel sudah pernah dibuat sebelumnya
  try {
    await client.execute(`ALTER TABLE wa_broadcast_recipients ADD COLUMN error TEXT;`);
    console.log('✅ Kolom error berhasil ditambahkan ke wa_broadcast_recipients');
  } catch (_e) {
    // Abaikan jika kolom sudah ada
  }

  // Index untuk wa_broadcast_recipients
  await client.execute(`
    CREATE INDEX IF NOT EXISTS wa_broadcast_recipients_broadcast_idx ON wa_broadcast_recipients(broadcast_id);
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS wa_broadcast_recipients_user_idx ON wa_broadcast_recipients(user_id);
  `);
  await client.execute(`
    CREATE INDEX IF NOT EXISTS wa_broadcast_recipients_status_idx ON wa_broadcast_recipients(status);
  `);
  console.log('✅ Index wa_broadcast_recipients berhasil dibuat');

  console.log('\n🎉 Migrasi selesai! Tabel WA Broadcast sudah siap digunakan.');
  client.close();
}

main().catch((err) => {
  console.error('❌ Migrasi gagal:', err);
  process.exit(1);
});
