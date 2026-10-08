/**
 * Script Migrasi & Backfill Kategori Kegiatan & Bobot Poin Dinamis
 * 
 * 1. Membuat tabel `activity_categories` jika belum ada.
 * 2. Menambahkan kolom `category_id` ke tabel `activities` jika belum ada.
 * 3. Melakukan seed untuk 3 kategori default sesuai SOP PSDM:
 *    - "Lingkup Eksternal"   -> hadir: 5, izin: 0, sakit: 0, alpha: -7, telat: -2
 *    - "Lingkup Internal"    -> hadir: 3, izin: 0, sakit: 0, alpha: -5, telat: -1
 *    - "Lingkup Kepanitiaan" -> hadir: 2, izin: 0, sakit: 0, alpha: -3, telat: -1
 * 4. Melakukan backfill pada kegiatan yang belum memiliki `category_id`
 *    dengan ID kategori "Lingkup Internal" (Zero-Downtime & Relational Integrity).
 * 
 * Jalankan dengan:
 * npx tsx src/db/migrate-activity-categories.ts
 */

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq, sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import { activityCategories, activities } from './schema/index.ts';

dotenv.config();

const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

async function runMigrateActivityCategories() {
  console.log('=== MEMULAI MIGRASI KATEGORI KEGIATAN & BOBOT POIN DINAMIS ===');
  console.log(`Database Target: ${url}`);

  const client = createClient({ url, authToken });
  const db = drizzle(client);

  try {
    // 1. DDL: Buat tabel activity_categories jika belum ada
    console.log('\n[1/4] Membuat tabel activity_categories...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS activity_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        hadir_points INTEGER NOT NULL DEFAULT 3,
        izin_points INTEGER NOT NULL DEFAULT 0,
        sakit_points INTEGER NOT NULL DEFAULT 0,
        alpha_points INTEGER NOT NULL DEFAULT -5,
        telat_points INTEGER NOT NULL DEFAULT -1,
        created_by TEXT,
        updated_by TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
      );
    `);
    console.log('   ✓ Tabel activity_categories siap.');

    // 2. DDL: Pastikan kolom category_id ada di tabel activities
    console.log('\n[2/4] Memeriksa kolom category_id di tabel activities...');
    try {
      await client.execute(`
        ALTER TABLE activities ADD COLUMN category_id TEXT REFERENCES activity_categories(id) ON DELETE RESTRICT;
      `);
      console.log('   ✓ Kolom category_id berhasil ditambahkan ke tabel activities.');
    } catch (err: any) {
      if (err.message?.includes('duplicate column') || err.message?.includes('already exists')) {
        console.log('   ✓ Kolom category_id sudah ada sebelumnya.');
      } else {
        console.warn('   Info DDL activities.category_id:', err.message);
      }
    }

    // 3. Seed Default Categories
    console.log('\n[3/4] Melakukan seeding 3 kategori default SOP PSDM...');
    const now = new Date();

    const defaultCategories = [
      {
        id: 'cat-eksternal-default',
        name: 'Lingkup Eksternal',
        description: 'Kegiatan di luar lingkup internal organisasi (kolaborasi luar, delegasi, lomba, dll)',
        hadirPoints: 5,
        izinPoints: 0,
        sakitPoints: 0,
        alphaPoints: -7,
        telatPoints: -2,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'cat-internal-default',
        name: 'Lingkup Internal',
        description: 'Kegiatan rutin dan agenda internal pengurus PSDM (rapat pleno, evaluasi, dll)',
        hadirPoints: 3,
        izinPoints: 0,
        sakitPoints: 0,
        alphaPoints: -5,
        telatPoints: -1,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'cat-kepanitiaan-default',
        name: 'Lingkup Kepanitiaan',
        description: 'Kegiatan dalam kepanitiaan program kerja ad-hoc atau event organisasi',
        hadirPoints: 2,
        izinPoints: 0,
        sakitPoints: 0,
        alphaPoints: -3,
        telatPoints: -1,
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const cat of defaultCategories) {
      const existing = await db
        .select({ id: activityCategories.id })
        .from(activityCategories)
        .where(eq(activityCategories.name, cat.name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(activityCategories).values(cat);
        console.log(`   + Menambahkan kategori: "${cat.name}" [Hadir: ${cat.hadirPoints}, Alpha: ${cat.alphaPoints}, Telat: ${cat.telatPoints}]`);
      } else {
        console.log(`   = Kategori "${cat.name}" sudah ada (ID: ${existing[0].id}).`);
      }
    }

    // 4. Backfill existing activities with Default Category (Lingkup Internal)
    console.log('\n[4/4] Memeriksa kegiatan yang belum memiliki category_id...');
    const internalCat = await db
      .select({ id: activityCategories.id })
      .from(activityCategories)
      .where(eq(activityCategories.name, 'Lingkup Internal'))
      .limit(1);

    const defaultCategoryId = internalCat.length > 0 ? internalCat[0].id : 'cat-internal-default';

    const unassignedActivitiesResult = await client.execute(`
      SELECT count(*) as count FROM activities WHERE category_id IS NULL OR category_id = '';
    `);
    const unassignedCount = Number(unassignedActivitiesResult.rows[0]?.count || 0);

    if (unassignedCount > 0) {
      console.log(`   Ditemukan ${unassignedCount} kegiatan tanpa kategori. Mengisi dengan ID '${defaultCategoryId}'...`);
      await client.execute({
        sql: `UPDATE activities SET category_id = ? WHERE category_id IS NULL OR category_id = '';`,
        args: [defaultCategoryId],
      });
      console.log(`   ✓ Berhasil mengaitkan ${unassignedCount} kegiatan ke kategori "Lingkup Internal".`);
    } else {
      console.log('   ✓ Seluruh kegiatan telah memiliki category_id yang valid.');
    }

    console.log('\n=== MIGRASI SELESAI DENGAN SUKSES ===\n');
  } catch (error) {
    console.error('\n❌ Terjadi kesalahan saat migrasi:', error);
    process.exit(1);
  } finally {
    client.close();
  }
}

runMigrateActivityCategories();
