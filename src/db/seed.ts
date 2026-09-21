/**
 * Seed Script — PSDM.web 2.0
 * Sinkronisasi penuh ke Database Cloud Turso:
 * - Fakultas & Program Studi
 * - Departemen & Pemetaan PJ Departemen
 * - User per role: PRN0001 (Super Admin), PRN0002 (Admin PJ), PRN0003 (Pengurus)
 * - Program Kerja & Kegiatan Terjadwal
 * - Catatan Presensi Lapangan
 * - Data Perizinan
 *
 * Jalankan: npm run seed
 * Password semua user: password123
 */

import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { createDb } from './index.ts';
import {
  fakultas,
  programStudi,
  departments,
  users,
  pjDepartments,
  activities,
  attendances,
  permissions,
} from './schema/index.ts';
import { hashPassword } from '../server/crypto.ts';

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL) {
  console.error('❌  TURSO_DATABASE_URL belum di-set di .env');
  process.exit(1);
}

const db = createDb({ TURSO_DATABASE_URL, TURSO_AUTH_TOKEN });

// ── Master IDs ──
const FAK_ID_1   = 'fak-seed-001';
const PRODI_ID_1 = 'prodi-seed-001';
const PRODI_ID_2 = 'prodi-seed-002';

const DEPT_PSDM  = 'dept-seed-001';
const DEPT_RISTEK = 'dept-seed-002';
const DEPT_HUMAS = 'dept-seed-003';
const DEPT_MEDKOM = 'dept-seed-004';

const PASSWORD   = 'password123';

async function seed() {
  console.log('🌱  Sinkronisasi data ke Database Cloud Turso...\n');

  // ── 1. Fakultas & Prodi ────────────────────────────────────
  await db
    .insert(fakultas)
    .values({ id: FAK_ID_1, nama: 'Fakultas Ilmu Komputer' })
    .onConflictDoNothing();

  await db
    .insert(programStudi)
    .values([
      { id: PRODI_ID_1, fakultasId: FAK_ID_1, nama: 'Teknik Informatika' },
      { id: PRODI_ID_2, fakultasId: FAK_ID_1, nama: 'Sistem Informasi' },
    ])
    .onConflictDoNothing();
  console.log('✓  Fakultas & Program Studi tersinkronisasi');

  // ── 2. Departemen ──────────────────────────────────────────
  const deptsData = [
    { id: DEPT_PSDM, nama: 'PSDM' },
    { id: DEPT_RISTEK, nama: 'Riset & Teknologi' },
    { id: DEPT_HUMAS, nama: 'Hubungan Masyarakat' },
    { id: DEPT_MEDKOM, nama: 'Media & Komunikasi' },
  ];

  for (const d of deptsData) {
    await db.insert(departments).values(d).onConflictDoNothing();
  }
  console.log('✓  Departemen organisasi tersinkronisasi');

  // ── 3. Hash password ──────────────────────────────────────
  const passwordHash = await hashPassword(PASSWORD);

  // ── 4. Seed Users ──────────────────────────────────────────
  const seedUsers = [
    {
      id:               'usr-superadmin-001',
      prn:              'PRN0001',
      passwordHash,
      role:             'SUPER_ADMIN' as const,
      generasi:         24,
      departmentId:     DEPT_PSDM,
      jabatan:          'Kepala Departemen PSDM',
      tingkatJabatan:   'BPH_INTI' as const,
      namaLengkap:      'Super Admin PSDM',
      tempatLahir:      'Jakarta',
      tanggalLahir:     '2000-01-01',
      alamat:           'Jl. Kampus No. 1',
      noTelp:           '081234560001',
      email:            'superadmin@psdm.org',
      nim:              '2200000001',
      programStudiId:   PRODI_ID_1,
      angkatan:         2022,
    },
    {
      id:               'usr-admin-001',
      prn:              'PRN0002',
      passwordHash,
      role:             'ADMIN' as const,
      generasi:         24,
      departmentId:     DEPT_PSDM,
      jabatan:          'Staf PSDM (PJ Departemen)',
      tingkatJabatan:   'STAFF' as const,
      namaLengkap:      'Admin Staf PSDM',
      tempatLahir:      'Bandung',
      tanggalLahir:     '2001-06-15',
      alamat:           'Jl. Kampus No. 2',
      noTelp:           '081234560002',
      email:            'admin@psdm.org',
      nim:              '2200000002',
      programStudiId:   PRODI_ID_1,
      angkatan:         2022,
    },
    {
      id:               'usr-pengurus-001',
      prn:              'PRN0003',
      passwordHash,
      role:             'PENGURUS' as const,
      generasi:         24,
      departmentId:     DEPT_RISTEK,
      jabatan:          'Staff Riset & Teknologi',
      tingkatJabatan:   'STAFF' as const,
      namaLengkap:      'Pengurus PSDM',
      tempatLahir:      'Surabaya',
      tanggalLahir:     '2002-03-20',
      alamat:           'Jl. Kampus No. 3',
      noTelp:           '081234560003',
      email:            'pengurus@psdm.org',
      nim:              '2200000003',
      programStudiId:   PRODI_ID_2,
      angkatan:         2022,
    },
  ];

  for (const u of seedUsers) {
    await db.delete(users).where(eq(users.id, u.id));
    await db.insert(users).values(u);
    console.log(`✓  [${u.role.padEnd(11)}] ${u.namaLengkap.padEnd(22)} PRN: ${u.prn}`);
  }

  // ── 5. Penugasan PJ Departemen ─────────────────────────────
  await db.delete(pjDepartments).where(eq(pjDepartments.adminId, 'usr-admin-001'));
  await db.insert(pjDepartments).values([
    {
      adminId: 'usr-admin-001',
      departmentId: DEPT_RISTEK,
      assignedAt: new Date(),
    },
  ]);
  console.log('✓  Penugasan PJ Departemen: Admin PRN0002 -> Riset & Teknologi');

  // ── 6. Activities (Program Kerja Nyata) ─────────────────────
  const act1Id = 'act-seed-001';
  const act2Id = 'act-seed-002';
  const act3Id = 'act-seed-003';

  await db.delete(activities).where(eq(activities.id, act1Id));
  await db.delete(activities).where(eq(activities.id, act2Id));
  await db.delete(activities).where(eq(activities.id, act3Id));

  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  await db.insert(activities).values([
    {
      id: act1Id,
      nama: 'Rapat Pleno Koordinasi Awal Periode',
      deskripsi: 'Evaluasi program kerja semester berjalan dan sinkronisasi lintas divisi.',
      jenis: 'RAPAT_PLENO',
      startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 3 * 3600 * 1000),
      isPublished: true,
      createdBy: 'usr-superadmin-001',
      createdAt: now,
    },
    {
      id: act2Id,
      nama: 'Upgrading Kepemimpinan & Manajemen Organisasi',
      deskripsi: 'Pelatihan pengembangan soft skill, komunikasi efektif, dan tata kelola kepengurusan.',
      jenis: 'UPGRADING',
      startDate: nextWeek,
      endDate: new Date(nextWeek.getTime() + 4 * 3600 * 1000),
      isPublished: true,
      createdBy: 'usr-superadmin-001',
      createdAt: now,
    },
    {
      id: act3Id,
      nama: 'Workshop Riset & Pengembangan Teknologi Cloud',
      deskripsi: 'Pelatihan teknis edge computing, database terdistribusi, dan arsitektur serverless.',
      jenis: 'PROKER',
      startDate: twoWeeks,
      endDate: new Date(twoWeeks.getTime() + 5 * 3600 * 1000),
      isPublished: true,
      createdBy: 'usr-superadmin-001',
      createdAt: now,
    },
  ]);
  console.log('✓  Program kerja / kegiatan terdaftar di database');

  // ── 7. Attendances ─────────────────────────────────────────
  await db.delete(attendances).where(eq(attendances.activityId, act1Id));
  await db.insert(attendances).values([
    {
      id: 'att-seed-001',
      activityId: act1Id,
      userId: 'usr-pengurus-001',
      status: 'HADIR',
      recordedBy: 'usr-admin-001',
      recordedAt: now,
    },
  ]);
  console.log('✓  Presensi kegiatan tersinkronisasi');

  // ── 8. Permissions ─────────────────────────────────────────
  const perm1Id = 'perm-seed-001';
  await db.delete(permissions).where(eq(permissions.id, perm1Id));
  await db.insert(permissions).values([
    {
      id: perm1Id,
      userId: 'usr-pengurus-001',
      activityId: act2Id,
      jenisIzin: 'SAKIT',
      alasan: 'Sedang dalam masa pemulihan demam sesuai surat dokter terlampir.',
      evidenceUrl: 'https://f004.backblazeb2.com/file/PSDM-B2/evidence/surat-keterangan-dokter.pdf',
      status: 'PENDING',
      createdAt: now,
    },
  ]);
  console.log('✓  Permohonan perizinan tersinkronisasi');

  console.log('\n✅  Sinkronisasi Database Turso Selesai 100%!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Password    : password123');
  console.log('  SUPER_ADMIN : PRN0001');
  console.log('  ADMIN       : PRN0002');
  console.log('  PENGURUS    : PRN0003');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌  Seed error:', err?.message ?? err);
  process.exit(1);
});
