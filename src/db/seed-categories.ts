import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

async function seedCategories() {
  console.log('=== MEMULAI SEEDING KATEGORI KEGIATAN & BOBOT POIN (TURSO DB) ===');
  console.log(`Connecting to: ${url}`);

  const client = createClient({ url, authToken });

  // 1. Periksa struktur kolom pada tabel activity_categories
  const tableInfo = await client.execute('PRAGMA table_info(activity_categories);');
  const columnNames = tableInfo.rows.map((r: any) => String(r.name).toLowerCase());
  console.log('Kolom yang ada di tabel activity_categories:', columnNames);

  // Pastikan baik 'nama' maupun 'name' tersedia agar kompatibel secara menyeluruh
  if (!columnNames.includes('nama')) {
    try {
      await client.execute('ALTER TABLE activity_categories ADD COLUMN nama TEXT;');
      console.log('✓ Menambahkan kolom nama ke activity_categories');
    } catch (e: any) {
      console.log('Info alter nama:', e.message);
    }
  }

  if (!columnNames.includes('name')) {
    try {
      await client.execute('ALTER TABLE activity_categories ADD COLUMN name TEXT;');
      console.log('✓ Menambahkan kolom name ke activity_categories');
    } catch (e: any) {
      console.log('Info alter name:', e.message);
    }
  }

  if (!columnNames.includes('deskripsi')) {
    try {
      await client.execute('ALTER TABLE activity_categories ADD COLUMN deskripsi TEXT;');
      console.log('✓ Menambahkan kolom deskripsi ke activity_categories');
    } catch (e: any) {
      console.log('Info alter deskripsi:', e.message);
    }
  }

  if (!columnNames.includes('description')) {
    try {
      await client.execute('ALTER TABLE activity_categories ADD COLUMN description TEXT;');
      console.log('✓ Menambahkan kolom description ke activity_categories');
    } catch (e: any) {
      console.log('Info alter description:', e.message);
    }
  }

  // 2. Daftar 3 Kategori Default sesuai kesepakatan SOP PSDM:
  // 1. "Lingkup Eksternal"   -> hadir: 5, izin: 0, sakit: 0, alpha: -7, telat: -2
  // 2. "Lingkup Internal"    -> hadir: 3, izin: 0, sakit: 0, alpha: -5, telat: -1
  // 3. "Lingkup Kepanitiaan" -> hadir: 2, izin: 0, sakit: 0, alpha: -3, telat: -1
  const targetCategories = [
    {
      id: 'cat-eksternal-default',
      nama: 'Lingkup Eksternal',
      deskripsi: 'Kegiatan di luar lingkup internal organisasi (kolaborasi, delegasi eksternal, dll)',
      hadirPoints: 5,
      izinPoints: 0,
      sakitPoints: 0,
      alphaPoints: -7,
      telatPoints: -2,
    },
    {
      id: 'cat-internal-default',
      nama: 'Lingkup Internal',
      deskripsi: 'Kegiatan rutin internal organisasi (rapat pleno, evaluasi bulanan, agenda internal)',
      hadirPoints: 3,
      izinPoints: 0,
      sakitPoints: 0,
      alphaPoints: -5,
      telatPoints: -1,
    },
    {
      id: 'cat-kepanitiaan-default',
      nama: 'Lingkup Kepanitiaan',
      deskripsi: 'Kegiatan kepanitiaan ad-hoc dan program kerja kepanitiaan',
      hadirPoints: 2,
      izinPoints: 0,
      sakitPoints: 0,
      alphaPoints: -3,
      telatPoints: -1,
    },
  ];

  const now = Date.now();

  for (const cat of targetCategories) {
    const check = await client.execute({
      sql: 'SELECT id FROM activity_categories WHERE id = ?;',
      args: [cat.id],
    });

    if (check.rows.length === 0) {
      await client.execute({
        sql: `INSERT INTO activity_categories (
          id, nama, name, deskripsi, description,
          hadir_points, izin_points, sakit_points, alpha_points, telat_points,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        args: [
          cat.id,
          cat.nama,
          cat.nama,
          cat.deskripsi,
          cat.deskripsi,
          cat.hadirPoints,
          cat.izinPoints,
          cat.sakitPoints,
          cat.alphaPoints,
          cat.telatPoints,
          now,
          now,
        ],
      });
      console.log(`✓ Kategori berhasil di-insert: "${cat.nama}" (Hadir: +${cat.hadirPoints}, Alpha: ${cat.alphaPoints}, Telat: ${cat.telatPoints})`);
    } else {
      await client.execute({
        sql: `UPDATE activity_categories SET
          nama = ?,
          name = ?,
          deskripsi = ?,
          description = ?,
          hadir_points = ?,
          izin_points = ?,
          sakit_points = ?,
          alpha_points = ?,
          telat_points = ?,
          updated_at = ?
        WHERE id = ?;`,
        args: [
          cat.nama,
          cat.nama,
          cat.deskripsi,
          cat.deskripsi,
          cat.hadirPoints,
          cat.izinPoints,
          cat.sakitPoints,
          cat.alphaPoints,
          cat.telatPoints,
          now,
          cat.id,
        ],
      });
      console.log(`✓ Kategori berhasil di-update: "${cat.nama}" (Hadir: +${cat.hadirPoints}, Alpha: ${cat.alphaPoints}, Telat: ${cat.telatPoints})`);
    }
  }

  // 3. Pastikan seluruh kegiatan terhubung ke category_id yang valid
  const unlinked = await client.execute('SELECT COUNT(*) as count FROM activities WHERE category_id IS NULL;');
  const unlinkedCount = Number(unlinked.rows[0]?.count || 0);
  if (unlinkedCount > 0) {
    await client.execute({
      sql: 'UPDATE activities SET category_id = ? WHERE category_id IS NULL;',
      args: ['cat-internal-default'],
    });
    console.log(`✓ Sebanyak ${unlinkedCount} kegiatan yang belum memiliki kategori berhasil di-backfill ke "Lingkup Internal".`);
  }

  // 4. Verifikasi data hasil seed
  const finalCategories = await client.execute('SELECT id, nama, name, hadir_points, izin_points, sakit_points, alpha_points, telat_points FROM activity_categories ORDER BY hadir_points DESC;');
  console.log('\n=== HASIL AKHIR SEEDING KATEGORI KEGIATAN ===');
  console.table(finalCategories.rows);

  console.log('\nSeeding selesai dengan sukses 100%!');
}

seedCategories().catch((err) => {
  console.error('Error saat seeding kategori:', err);
  process.exit(1);
});
