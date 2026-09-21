/**
 * Seed Script — PSDM.web 2.0
 * Insert 1 user per role: SUPER_ADMIN, ADMIN, PENGURUS
 * Juga meng-insert data prerequisite: fakultas, program studi, department
 *
 * Jalankan: npm run seed
 * Password semua user: password123
 */

import 'dotenv/config';
import { createDb } from './index.ts';
import { fakultas, programStudi, departments, users } from './schema/index.ts';
import { hashPassword } from '../server/crypto.ts';

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL) {
  console.error('❌  TURSO_DATABASE_URL belum di-set di .env');
  process.exit(1);
}

const db = createDb({ TURSO_DATABASE_URL, TURSO_AUTH_TOKEN });

// ── IDs yang digunakan seed (idempotent: onConflictDoNothing) ──
const FAK_ID    = 'fak-seed-001';
const PRODI_ID  = 'prodi-seed-001';
const DEPT_ID   = 'dept-seed-001';
const PASSWORD  = 'password123';

async function seed() {
  console.log('🌱  Seeding database Turso...\n');

  // ── 1. Fakultas ───────────────────────────────────────────
  await db
    .insert(fakultas)
    .values({ id: FAK_ID, nama: 'Fakultas Ilmu Komputer' })
    .onConflictDoNothing();
  console.log('✓  Fakultas      : Fakultas Ilmu Komputer');

  // ── 2. Program Studi ──────────────────────────────────────
  await db
    .insert(programStudi)
    .values({ id: PRODI_ID, fakultasId: FAK_ID, nama: 'Teknik Informatika' })
    .onConflictDoNothing();
  console.log('✓  Program Studi : Teknik Informatika');

  // ── 3. Department ─────────────────────────────────────────
  await db
    .insert(departments)
    .values({ id: DEPT_ID, nama: 'PSDM' })
    .onConflictDoNothing();
  console.log('✓  Department    : PSDM\n');

  // ── 4. Hash password (Web Crypto PBKDF2 — sama seperti production) ─
  const passwordHash = await hashPassword(PASSWORD);

  // ── 5. Seed Users ─────────────────────────────────────────
  const seedUsers = [
    {
      id:               'usr-superadmin-001',
      prn:              'PSDM-SA-001',
      passwordHash,
      role:             'SUPER_ADMIN' as const,
      generasi:         24,
      departmentId:     DEPT_ID,
      jabatan:          'Kepala Departemen PSDM',
      tingkatJabatan:   'BPH_INTI' as const,
      namaLengkap:      'Super Admin PSDM',
      tempatLahir:      'Jakarta',
      tanggalLahir:     '2000-01-01',
      alamat:           'Jl. Kampus No. 1',
      noTelp:           '081234560001',
      email:            'superadmin@psdm.org',
      nim:              '2200000001',
      programStudiId:   PRODI_ID,
      angkatan:         2022,
    },
    {
      id:               'usr-admin-001',
      prn:              'PSDM-AD-001',
      passwordHash,
      role:             'ADMIN' as const,
      generasi:         24,
      departmentId:     DEPT_ID,
      jabatan:          'Staf PSDM',
      tingkatJabatan:   'STAFF' as const,
      namaLengkap:      'Admin Staf PSDM',
      tempatLahir:      'Bandung',
      tanggalLahir:     '2001-06-15',
      alamat:           'Jl. Kampus No. 2',
      noTelp:           '081234560002',
      email:            'admin@psdm.org',
      nim:              '2200000002',
      programStudiId:   PRODI_ID,
      angkatan:         2022,
    },
    {
      id:               'usr-pengurus-001',
      prn:              'PSDM-PG-001',
      passwordHash,
      role:             'PENGURUS' as const,
      generasi:         24,
      departmentId:     DEPT_ID,
      jabatan:          'Pengurus Aktif',
      tingkatJabatan:   'STAFF' as const,
      namaLengkap:      'Pengurus PSDM',
      tempatLahir:      'Surabaya',
      tanggalLahir:     '2002-03-20',
      alamat:           'Jl. Kampus No. 3',
      noTelp:           '081234560003',
      email:            'pengurus@psdm.org',
      nim:              '2200000003',
      programStudiId:   PRODI_ID,
      angkatan:         2022,
    },
  ] as const;

  for (const u of seedUsers) {
    await db.insert(users).values(u).onConflictDoNothing();
    console.log(`✓  [${u.role.padEnd(11)}]  ${u.namaLengkap.padEnd(20)}  PRN: ${u.prn}`);
  }

  console.log('\n✅  Seed selesai!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Password    : password123');
  console.log('  SUPER_ADMIN : PSDM-SA-001');
  console.log('  ADMIN       : PSDM-AD-001');
  console.log('  PENGURUS    : PSDM-PG-001');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌  Seed error:', err?.message ?? err);
  process.exit(1);
});
