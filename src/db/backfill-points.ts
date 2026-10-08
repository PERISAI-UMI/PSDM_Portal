/**
 * Script Migrasi & Backfill Poin Historis (One-Time Execution)
 * Digunakan untuk:
 * 1. Memastikan tabel `point_configs` terbuat dan memiliki nilai default.
 * 2. Memastikan kolom `awarded_points` ada di tabel `attendances`.
 * 3. Mengisi (backfill) nilai `awarded_points` pada data presensi lama (yang masih bernilai 0 / null)
 *    berdasarkan status presensi dan default bobot konfigurasi.
 *
 * Jalankan dengan:
 * npx tsx src/db/backfill-points.ts
 */

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq, sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import { attendances, pointConfigs } from './schema/index.ts';

dotenv.config();

const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

async function runBackfill() {
  console.log('--- Memulai Migrasi & Backfill Poin PSDM.web 2.0 ---');
  console.log(`Menghubungkan ke database: ${url}`);

  const client = createClient({ url, authToken });
  const db = drizzle(client);

  try {
    // 0. DDL: Pastikan kolom is_active dan deleted_at ada di tabel users (Soft Delete)
    console.log('0. Memastikan kolom Soft Delete di tabel users...');
    try {
      await client.execute(`
        ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;
      `);
      console.log('   Kolom is_active berhasil ditambahkan.');
    } catch (err: any) {
      if (err.message?.includes('duplicate column') || err.message?.includes('already exists')) {
        console.log('   Kolom is_active sudah ada sebelumnya.');
      } else {
        console.warn('   Catatan DDL is_active:', err.message);
      }
    }

    try {
      await client.execute(`
        ALTER TABLE users ADD COLUMN deleted_at INTEGER;
      `);
      console.log('   Kolom deleted_at berhasil ditambahkan.');
    } catch (err: any) {
      if (err.message?.includes('duplicate column') || err.message?.includes('already exists')) {
        console.log('   Kolom deleted_at sudah ada sebelumnya.');
      } else {
        console.warn('   Catatan DDL deleted_at:', err.message);
      }
    }

    // 1. DDL: Pastikan tabel point_configs ada
    console.log('1. Memastikan tabel point_configs...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS point_configs (
        id TEXT PRIMARY KEY,
        hadir_points INTEGER NOT NULL DEFAULT 10,
        izin_points INTEGER NOT NULL DEFAULT 3,
        sakit_points INTEGER NOT NULL DEFAULT 3,
        alpha_points INTEGER NOT NULL DEFAULT -10,
        telat_points INTEGER NOT NULL DEFAULT 5,
        updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // 2. DDL: Pastikan kolom awarded_points ada di tabel attendances
    console.log('2. Memastikan kolom awarded_points di tabel attendances...');
    try {
      await client.execute(`
        ALTER TABLE attendances ADD COLUMN awarded_points INTEGER NOT NULL DEFAULT 0;
      `);
      console.log('   Kolom awarded_points berhasil ditambahkan.');
    } catch (err: any) {
      if (err.message?.includes('duplicate column') || err.message?.includes('already exists')) {
        console.log('   Kolom awarded_points sudah ada sebelumnya.');
      } else {
        console.warn('   Catatan DDL kolom:', err.message);
      }
    }

    // 3. Pastikan konfigurasi default tersimpan di point_configs
    console.log('3. Inisialisasi default point config...');
    const now = new Date();
    await db
      .insert(pointConfigs)
      .values({
        id: 'default_config',
        hadirPoints: 10,
        izinPoints: 3,
        sakitPoints: 3,
        alphaPoints: -10,
        telatPoints: 5,
        updatedAt: now,
      })
      .onConflictDoNothing();

    // Ambil bobot aktif
    const configs = await db
      .select()
      .from(pointConfigs)
      .where(eq(pointConfigs.id, 'default_config'))
      .limit(1);

    const activeConfig = configs[0] || {
      hadirPoints: 10,
      izinPoints: 3,
      sakitPoints: 3,
      alphaPoints: -10,
      telatPoints: 5,
    };

    console.log('   Bobot aktif yang digunakan untuk backfill:', {
      HADIR: activeConfig.hadirPoints,
      IZIN: activeConfig.izinPoints,
      SAKIT: activeConfig.sakitPoints,
      ALPHA: activeConfig.alphaPoints,
      TELAT: activeConfig.telatPoints,
    });

    // 4. Backfill data attendances lama yang masih bernilai 0
    console.log('4. Memperbarui poin data presensi historis...');
    const resultHadir = await client.execute({
      sql: `UPDATE attendances SET awarded_points = ? WHERE status = 'HADIR' AND (awarded_points IS NULL OR awarded_points = 0)`,
      args: [activeConfig.hadirPoints],
    });
    const resultIzin = await client.execute({
      sql: `UPDATE attendances SET awarded_points = ? WHERE status = 'IZIN' AND (awarded_points IS NULL OR awarded_points = 0)`,
      args: [activeConfig.izinPoints],
    });
    const resultSakit = await client.execute({
      sql: `UPDATE attendances SET awarded_points = ? WHERE status = 'SAKIT' AND (awarded_points IS NULL OR awarded_points = 0)`,
      args: [activeConfig.sakitPoints],
    });
    const resultAlpha = await client.execute({
      sql: `UPDATE attendances SET awarded_points = ? WHERE status = 'ALPHA' AND (awarded_points IS NULL OR awarded_points = 0)`,
      args: [activeConfig.alphaPoints],
    });
    const resultTelat = await client.execute({
      sql: `UPDATE attendances SET awarded_points = ? WHERE status = 'TELAT' AND (awarded_points IS NULL OR awarded_points = 0)`,
      args: [activeConfig.telatPoints],
    });

    const totalUpdated =
      Number(resultHadir.rowsAffected || 0) +
      Number(resultIzin.rowsAffected || 0) +
      Number(resultSakit.rowsAffected || 0) +
      Number(resultAlpha.rowsAffected || 0) +
      Number(resultTelat.rowsAffected || 0);

    console.log(`\n✅ Berhasil melakukan backfill pada ${totalUpdated} baris riwayat presensi!`);
    console.log('--- Migrasi Selesai ---');
  } catch (error) {
    console.error('❌ Gagal menjalankan migrasi/backfill:', error);
    process.exit(1);
  }
}

runBackfill();

export { runBackfill };
