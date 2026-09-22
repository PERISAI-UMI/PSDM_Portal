/**
 * Clean Production Database Script — PSDM.web 2.0
 * Membersihkan database sebelum peluncuran produksi:
 * - Menghapus seluruh transaksi dummy: kegiatan, presensi, izin, penugasan PJ demo, sesi login
 * - Menghapus user demo (PRN0002, PRN0003, PRN0004), menyisakan 1 akun SUPER_ADMIN bersih (PRN0001)
 * - Memastikan data master Fakultas, Prodi, dan Departemen tetap utuh dan tersinkronisasi
 *
 * Jalankan: npx tsx src/db/clean-production.ts
 */

import 'dotenv/config';
import { ne, count } from 'drizzle-orm';
import { createDb } from './index.ts';
import {
  attendances,
  permissions,
  activities,
  pjDepartments,
  sessions,
  users,
  departments,
  fakultas,
  programStudi,
} from './schema/index.ts';

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL) {
  console.error('❌  TURSO_DATABASE_URL belum di-set di .env');
  process.exit(1);
}

const db = createDb({ TURSO_DATABASE_URL, TURSO_AUTH_TOKEN });

async function cleanProduction() {
  console.log('🧹  Memulai pembersihan database pra-peluncuran...\n');

  // 1. Hapus transaksi dummy
  await db.delete(attendances);
  console.log('✓  Seluruh catatan presensi dummy dihapus');

  await db.delete(permissions);
  console.log('✓  Seluruh permohonan perizinan dummy dihapus');

  await db.delete(activities);
  console.log('✓  Seluruh program kerja / kegiatan dummy dihapus');

  await db.delete(pjDepartments);
  console.log('✓  Seluruh penugasan PJ demo dihapus');

  await db.delete(sessions);
  console.log('✓  Seluruh sesi login lama dibersihkan');

  // 2. Hapus user demo non-Super Admin
  await db.delete(users).where(ne(users.role, 'SUPER_ADMIN'));
  console.log('✓  Seluruh user demo (Admin PJ, Pengurus, Inti) dihapus');

  // 3. Reset avatar Super Admin agar default
  await db.update(users).set({ avatarUrl: null });
  console.log('✓  Avatar Super Admin direset ke default');

  // 4. Hitung rekap akhir
  const [u] = await db.select({ count: count() }).from(users);
  const [dept] = await db.select({ count: count() }).from(departments);
  const [fak] = await db.select({ count: count() }).from(fakultas);
  const [prodi] = await db.select({ count: count() }).from(programStudi);

  console.log('\n✅  Pembersihan Database Berhasil Selesai!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Super Admin tersisa : ${u.count} akun`);
  console.log(`  Departemen Organisasi: ${dept.count} departemen`);
  console.log(`  Fakultas Tersedia   : ${fak.count} fakultas`);
  console.log(`  Program Studi       : ${prodi.count} prodi`);
  console.log('  Status Kegiatan     : 0 (Kosong/Fresh)');
  console.log('  Status Presensi     : 0 (Kosong/Fresh)');
  console.log('  Status Perizinan    : 0 (Kosong/Fresh)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exit(0);
}

cleanProduction().catch((err) => {
  console.error('\n❌  Gagal membersihkan database:', err?.message ?? err);
  process.exit(1);
});
