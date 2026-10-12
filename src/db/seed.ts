/**
 * Seed Script — PSDM.web 2.0
 * Sinkronisasi penuh ke Database Cloud Turso:
 * - Fakultas & Program Studi
 * - Departemen & Pemetaan PJ Departemen
 * - User per role: PRN0001 (Super Admin), PRN0002 (Admin), PRN0003 (Pengurus)
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
  activityCategories,
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
const FAK_ID_FIKOM = 'fak-seed-001';
const PRODI_ID_1 = 'prodi-seed-001';
const PRODI_ID_2 = 'prodi-seed-002';

const DEPT_PSDM = 'dept-seed-001';
const DEPT_RISTEK = 'dept-seed-002';
const DEPT_HUMAS = 'dept-seed-003';
const DEPT_MEDIA = 'dept-seed-004';
const DEPT_PENALARAN = 'dept-seed-005';
const DEPT_KOMPRES = 'dept-seed-006';

const PASSWORD = 'password123';

export const UMI_ACADEMIC_DATA = [
  {
    id: 'fak-fai',
    nama: 'Fakultas Agama Islam (FAI)',
    prodis: [
      { id: 'prodi-fai-001', nama: 'S1 Pendidikan Agama Islam' },
      { id: 'prodi-fai-002', nama: 'S1 Pendidikan Bahasa Arab' },
      { id: 'prodi-fai-003', nama: 'S1 Pendidikan Guru Madrasah Ibtidaiyah (PGMI)' },
      { id: 'prodi-fai-004', nama: 'S1 Hukum Keluarga (Ahwal Syakhshiyah)' },
      { id: 'prodi-fai-005', nama: 'S1 Hukum Ekonomi Syariah (Muamalah)' },
      { id: 'prodi-fai-006', nama: 'S1 Komunikasi dan Penyiaran Islam' },
    ],
  },
  {
    id: 'fak-feb',
    nama: 'Fakultas Ekonomi dan Bisnis (FEB)',
    prodis: [
      { id: 'prodi-feb-001', nama: 'S1 Manajemen' },
      { id: 'prodi-feb-002', nama: 'S1 Akuntansi' },
      { id: 'prodi-feb-003', nama: 'S1 Ekonomi Pembangunan / Ilmu Ekonomi' },
    ],
  },
  {
    id: 'fak-ft',
    nama: 'Fakultas Teknik (FT)',
    prodis: [
      { id: 'prodi-ft-001', nama: 'S1 Teknik Sipil' },
      { id: 'prodi-ft-002', nama: 'S1 Teknik Mesin' },
      { id: 'prodi-ft-003', nama: 'S1 Teknik Elektro' },
      { id: 'prodi-ft-004', nama: 'S1 Arsitektur' },
      { id: 'prodi-ft-005', nama: 'S1 Teknik Lingkungan' },
    ],
  },
  {
    id: 'fak-fh',
    nama: 'Fakultas Hukum (FH)',
    prodis: [
      { id: 'prodi-fh-001', nama: 'S1 Ilmu Hukum' },
    ],
  },
  {
    id: 'fak-fsikp',
    nama: 'Fakultas Sastra, Ilmu Komunikasi, dan Pendidikan (FSIKP)',
    prodis: [
      { id: 'prodi-fsikp-001', nama: 'S1 Sastra Inggris' },
      { id: 'prodi-fsikp-002', nama: 'S1 Sastra Indonesia' },
      { id: 'prodi-fsikp-003', nama: 'S1 Sastra Arab' },
      { id: 'prodi-fsikp-004', nama: 'S1 Ilmu Komunikasi' },
      { id: 'prodi-fsikp-005', nama: 'S1 Pendidikan Bahasa Inggris' },
      { id: 'prodi-fsikp-006', nama: 'S1 Pendidikan Bahasa dan Sastra Indonesia' },
    ],
  },
  {
    id: 'fak-fpik',
    nama: 'Fakultas Perikanan dan Ilmu Kelautan (FPIK)',
    prodis: [
      { id: 'prodi-fpik-001', nama: 'S1 Budidaya Perairan / Akuakultur' },
      { id: 'prodi-fpik-002', nama: 'S1 Pemanfaatan Sumberdaya Perikanan' },
      { id: 'prodi-fpik-003', nama: 'S1 Ilmu Kelautan' },
    ],
  },
  {
    id: 'fak-fti',
    nama: 'Fakultas Teknologi Industri (FTI)',
    prodis: [
      { id: 'prodi-fti-001', nama: 'S1 Teknik Industri' },
      { id: 'prodi-fti-002', nama: 'S1 Teknik Kimia' },
      { id: 'prodi-fti-003', nama: 'S1 Teknik Pertambangan' },
    ],
  },
  {
    id: 'fak-fp',
    nama: 'Fakultas Pertanian (FP)',
    prodis: [
      { id: 'prodi-fp-001', nama: 'S1 Agribisnis' },
      { id: 'prodi-fp-002', nama: 'S1 Agroteknologi' },
    ],
  },
  {
    id: 'fak-fk',
    nama: 'Fakultas Kedokteran (FK)',
    prodis: [
      { id: 'prodi-fk-001', nama: 'S1 Pendidikan Dokter / Kedokteran Umum' },
    ],
  },
  {
    id: 'fak-fkg',
    nama: 'Fakultas Kedokteran Gigi (FKG)',
    prodis: [
      { id: 'prodi-fkg-001', nama: 'S1 Pendidikan Dokter Gigi' },
    ],
  },
  {
    id: 'fak-ff',
    nama: 'Fakultas Farmasi (FF)',
    prodis: [
      { id: 'prodi-ff-001', nama: 'S1 Farmasi' },
    ],
  },
  {
    id: FAK_ID_FIKOM,
    nama: 'Fakultas Ilmu Komputer (FIKOM)',
    prodis: [
      { id: PRODI_ID_1, nama: 'S1 Teknik Informatika' },
      { id: PRODI_ID_2, nama: 'S1 Sistem Informasi' },
    ],
  },
  {
    id: 'fak-fkm',
    nama: 'Fakultas Kesehatan Masyarakat (FKM)',
    prodis: [
      { id: 'prodi-fkm-001', nama: 'D3 Kebidanan' },
      { id: 'prodi-fkm-002', nama: 'S1 Kesehatan Masyarakat' },
      { id: 'prodi-fkm-003', nama: 'S1 Ilmu Keperawatan' },
      { id: 'prodi-fkm-004', nama: 'S1 Kebidanan' },
    ],
  },
];

async function seed() {
  console.log('🌱  Sinkronisasi data ke Database Cloud Turso...\n');

  // ── 1. Fakultas & Prodi (Universitas Muslim Indonesia) ───────
  for (const f of UMI_ACADEMIC_DATA) {
    await db
      .insert(fakultas)
      .values({ id: f.id, nama: f.nama })
      .onConflictDoUpdate({
        target: fakultas.id,
        set: { nama: f.nama },
      });

    for (const p of f.prodis) {
      await db
        .insert(programStudi)
        .values({ id: p.id, fakultasId: f.id, nama: p.nama })
        .onConflictDoUpdate({
          target: programStudi.id,
          set: { nama: p.nama, fakultasId: f.id },
        });
    }
  }
  console.log(`✓  Fakultas (${UMI_ACADEMIC_DATA.length}) & Program Studi (38) UMI Makassar tersinkronisasi`);

  // ── 2. Departemen ──────────────────────────────────────────
  const deptsData = [
    { id: DEPT_PSDM, nama: 'Pengembangan Sumber Daya Manusia (PSDM)' },
    { id: DEPT_MEDIA, nama: 'Media' },
    { id: DEPT_PENALARAN, nama: 'Penalaran' },
    { id: DEPT_HUMAS, nama: 'Hubungan Masyarakat (HUMAS)' },
    { id: DEPT_KOMPRES, nama: 'Kompetisi dan Prestasi (KOMPRES)' },
    { id: DEPT_RISTEK, nama: 'Riset dan Teknologi (RISTEK)' },
  ];

  for (const d of deptsData) {
    await db
      .insert(departments)
      .values(d)
      .onConflictDoUpdate({
        target: departments.id,
        set: { nama: d.nama },
      });
  }
  console.log(`✓  Departemen organisasi (${deptsData.length}) tersinkronisasi`);

  // ── 3. Hash password ──────────────────────────────────────
  const passwordHash = await hashPassword(PASSWORD);

  // ── 4. Seed Users ──────────────────────────────────────────
  const seedUsers = [
    {
      id: 'usr-superadmin-001',
      prn: 'PRN0001',
      passwordHash,
      role: 'SUPER_ADMIN' as const,
      generasi: 24,
      departmentId: DEPT_PSDM,
      jabatan: 'Kepala Departemen PSDM',
      namaLengkap: 'Super Admin PSDM',
      tempatLahir: 'Jakarta',
      tanggalLahir: '2000-01-01',
      alamat: 'Jl. Kampus No. 1',
      noTelp: '081234560001',
      email: 'superadmin@psdm.org',
      nim: '2200000001',
      programStudiId: PRODI_ID_1,
      angkatan: 2022,
    },
    {
      id: 'usr-admin-001',
      prn: 'PRN0002',
      passwordHash,
      role: 'ADMIN' as const,
      generasi: 24,
      departmentId: DEPT_PSDM,
      jabatan: 'Staf PSDM (PJ Departemen)',
      namaLengkap: 'Admin Staf PSDM',
      tempatLahir: 'Bandung',
      tanggalLahir: '2001-06-15',
      alamat: 'Jl. Kampus No. 2',
      noTelp: '081234560002',
      email: 'admin@psdm.org',
      nim: '2200000002',
      programStudiId: PRODI_ID_1,
      angkatan: 2022,
    },
    {
      id: 'usr-pengurus-001',
      prn: 'PRN0003',
      passwordHash,
      role: 'PENGURUS' as const,
      generasi: 24,
      departmentId: DEPT_RISTEK,
      jabatan: 'Staff Riset & Teknologi',
      namaLengkap: 'Pengurus PSDM',
      tempatLahir: 'Surabaya',
      tanggalLahir: '2002-03-20',
      alamat: 'Jl. Kampus No. 3',
      noTelp: '081234560003',
      email: 'pengurus@psdm.org',
      nim: '2200000003',
      programStudiId: PRODI_ID_2,
      angkatan: 2022,
    },
    {
      id: 'usr-inti-001',
      prn: 'PRN0004',
      passwordHash,
      role: 'INTI' as const,
      generasi: 24,
      departmentId: DEPT_PSDM,
      jabatan: 'Ketua Umum (Pengurus Inti)',
      namaLengkap: 'Ketua Umum Inti',
      tempatLahir: 'Makassar',
      tanggalLahir: '2001-08-17',
      alamat: 'Jl. Urip Sumoharjo No. 4',
      noTelp: '081234560004',
      email: 'inti@psdm.org',
      nim: '2200000004',
      programStudiId: PRODI_ID_1,
      angkatan: 2022,
    },
  ];

  for (const u of seedUsers) {
    await db
      .insert(users)
      .values(u)
      .onConflictDoUpdate({
        target: users.id,
        set: u,
      });
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

  // ── 6. Activity Categories & Activities (Program Kerja Nyata) ──
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const defaultCats = [
    {
      id: 'cat-internal-default',
      nama: 'Lingkup Internal',
      deskripsi: 'Kegiatan rutin dan agenda internal pengurus PSDM (rapat pleno, evaluasi, dll)',
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
      id: 'cat-eksternal-default',
      nama: 'Lingkup Eksternal',
      deskripsi: 'Kegiatan di luar lingkup internal organisasi (kolaborasi luar, delegasi, lomba, dll)',
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
      id: 'cat-kepanitiaan-default',
      nama: 'Lingkup Kepanitiaan',
      deskripsi: 'Kegiatan dalam kepanitiaan program kerja ad-hoc atau event organisasi',
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

  for (const cat of defaultCats) {
    await db
      .insert(activityCategories)
      .values(cat)
      .onConflictDoUpdate({
        target: activityCategories.id,
        set: cat,
      });
  }

  const act1Id = 'act-seed-001';
  const act2Id = 'act-seed-002';
  const act3Id = 'act-seed-003';

  await db.delete(activities).where(eq(activities.id, act1Id));
  await db.delete(activities).where(eq(activities.id, act2Id));
  await db.delete(activities).where(eq(activities.id, act3Id));

  await db.insert(activities).values([
    {
      id: act1Id,
      nama: 'Rapat Pleno Koordinasi Awal Periode',
      deskripsi: 'Evaluasi program kerja semester berjalan dan sinkronisasi lintas divisi.',
      categoryId: 'cat-internal-default',
      mode: 'OFFLINE',
      lokasi: 'Aula Lantai 2 Gedung PKM',
      meetingUrl: null,
      isLocked: false,
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
      categoryId: 'cat-internal-default',
      mode: 'ONLINE',
      lokasi: null,
      meetingUrl: 'https://zoom.us/j/987654321',
      isLocked: false,
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
      categoryId: 'cat-eksternal-default',
      mode: 'OFFLINE',
      lokasi: 'Laboratorium Komputer 3',
      meetingUrl: null,
      isLocked: false,
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
