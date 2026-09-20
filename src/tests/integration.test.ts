/**
 * ============================================================
 * PSDM.web 2.0 - TAHAP 6: SUITE PENGUJIAN INTEGRASI LENGKAP
 * ============================================================
 * Menguji seluruh modul inti:
 * 1. WebCrypto Edge (PBKDF2 Password Hashing & Verification, Token Generator)
 * 2. Skema Validasi Zod & Integritas Data Relasional 3NF
 * 3. Hono Edge Routing & Health Check
 * 4. Matriks Akses RBAC (SUPER_ADMIN, ADMIN/PJ PSDM, PENGURUS)
 * 5. Sinkronisasi Otomatis Approval Perizinan ke Presensi Proker
 * 6. Presigned URL Generator Backblaze B2 / Cloudflare R2
 * ============================================================
 */

import { hashPassword, verifyPassword, generateSessionToken } from '../server/crypto.ts';
import {
  userSchema,
  activitySchema,
  attendanceSchema,
  permissionSchema,
  pjDepartmentSchema,
} from '../db/validation.ts';
import { api } from '../services/api.ts';
import { createPresignedUploadUrl } from '../server/storage.ts';
import app from '../server/index.ts';
import type { AuthUser, AttendanceStatus, PermissionStatus } from '../types/index.ts';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

const testResults: TestResult[] = [];

async function runTest(suite: string, name: string, fn: () => Promise<void> | void) {
  const start = performance.now();
  try {
    await fn();
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    testResults.push({ suite, name, passed: true, durationMs });
    console.log(`  â [PASS] ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    testResults.push({ suite, name, passed: false, durationMs, error: err?.message || String(err) });
    console.error(`  â [FAIL] ${name} (${durationMs}ms):`, err?.message || err);
  }
}

export async function runAllIntegrationTests(): Promise<{
  total: number;
  passed: number;
  failed: number;
  results: TestResult[];
}> {
  console.log('\n======================================================');
  console.log('ð MEMULAI PENGUJIAN INTEGRASI SISTEM PSDM.web 2.0');
  console.log('======================================================\n');

  // ------------------------------------------------------------
  // 1. WebCrypto Edge Authentication Tests
  // ------------------------------------------------------------
  console.log('ð SUITE 1: WebCrypto Edge Authentication & Hashing');

  await runTest('WebCrypto', 'Generate session token dengan entropi 256-bit', () => {
    const token1 = generateSessionToken();
    const token2 = generateSessionToken();
    if (!token1 || token1.length !== 64) throw new Error('Token length harus 64 hex characters (256-bit)');
    if (token1 === token2) throw new Error('Token tidak boleh duplikat (entropi collision)');
  });

  await runTest('WebCrypto', 'Hash password dengan PBKDF2 SHA-256 dan verifikasi password valid', async () => {
    const rawPassword = 'PasswordAmanPSDM2026!';
    const hashed = await hashPassword(rawPassword);
    if (!hashed.includes(':')) throw new Error('Format hash harus "saltHex:hashHex"');

    const isValid = await verifyPassword(rawPassword, hashed);
    if (!isValid) throw new Error('Password asli gagal diverifikasi');
  });

  await runTest('WebCrypto', 'Tolak verifikasi dengan password yang salah', async () => {
    const rawPassword = 'PasswordAmanPSDM2026!';
    const hashed = await hashPassword(rawPassword);

    const isInvalid = await verifyPassword('PasswordSalah123', hashed);
    if (isInvalid) throw new Error('Password salah seharusnya ditolak (false)');
  });

  // ------------------------------------------------------------
  // 2. Zod Schema & 3NF Integrity Tests
  // ------------------------------------------------------------
  console.log('\nð SUITE 2: Skema Validasi Zod & Integritas 3NF');

  await runTest('Validation', 'Validasi User 3NF dengan seluruh field relasional', () => {
    const sampleUser = {
      id: 'usr-test-1',
      prn: 'TEST-001',
      passwordHash: 'salt:hash12345678',
      role: 'PENGURUS' as const,
      generasi: 24,
      departmentId: 'dept-ristek',
      jabatan: 'Staff Cloud',
      tingkatJabatan: 'STAFF' as const,
      namaLengkap: 'Budi Santoso',
      tempatLahir: 'Jakarta',
      tanggalLahir: '2004-05-12',
      alamat: 'Jl. Kampus No. 10',
      noTelp: '08123456789',
      email: 'budi@organisasi.id',
      nim: '2311529999',
      programStudiId: 'prodi-1',
      angkatan: 2023,
    };
    const parsed = userSchema.safeParse(sampleUser);
    if (!parsed.success) throw new Error(parsed.error.message);
  });

  await runTest('Validation', 'Tolak User dengan format email atau NIM tidak valid', () => {
    const invalidUser = {
      id: 'usr-fail',
      prn: 'F',
      passwordHash: 'short',
      role: 'INVALID_ROLE',
      generasi: -1,
      departmentId: '',
      jabatan: '',
      tingkatJabatan: 'UNKNOWN',
      namaLengkap: '',
      tempatLahir: '',
      tanggalLahir: 'invalid-date',
      alamat: '',
      noTelp: '123',
      email: 'bukan-email',
      nim: '12',
      programStudiId: '',
      angkatan: 1990,
    };
    const parsed = userSchema.safeParse(invalidUser);
    if (parsed.success) throw new Error('User tidak valid seharusnya gagal diverifikasi');
  });

  await runTest('Validation', 'Validasi skema kegiatan proker (Activity)', () => {
    const sampleActivity = {
      id: 'act-test-1',
      nama: 'Rapat Kerja Wilayah',
      deskripsi: 'Koordinasi program kerja tahunan',
      jenis: 'RAPAT_PLENO',
      startDate: new Date(),
      endDate: new Date(Date.now() + 3600000),
      isPublished: true,
      createdBy: 'usr-kadep',
    };
    const parsed = activitySchema.safeParse(sampleActivity);
    if (!parsed.success) throw new Error(parsed.error.message);
  });

  await runTest('Validation', 'Validasi skema penugasan PJ Departemen', () => {
    const samplePj = {
      adminId: 'usr-staf-psdm',
      departmentId: 'dept-ristek',
    };
    const parsed = pjDepartmentSchema.safeParse(samplePj);
    if (!parsed.success) throw new Error(parsed.error.message);
  });

  // ------------------------------------------------------------
  // 3. RBAC & Business Logic Tests
  // ------------------------------------------------------------
  console.log('\nð¡ï¸ SUITE 3: RBAC (Role-Based Access Control) & Business Logic');

  const kadepUser: AuthUser = {
    id: 'usr-kadep',
    prn: 'PSDM-001',
    role: 'SUPER_ADMIN',
    generasi: 24,
    departmentId: 'dept-psdm',
    jabatan: 'Kadep PSDM',
    tingkatJabatan: 'KADEP',
    namaLengkap: 'Arya Wiranata',
    email: 'kadep@org.id',
    nim: '2111521001',
    programStudiId: 'prodi-1',
    angkatan: 2021,
    noTelp: '081234567890',
    alamat: 'Jl. Kampus',
    pjDepartments: [],
  };

  const stafPsdmUser: AuthUser = {
    id: 'usr-staf-psdm',
    prn: 'PSDM-002',
    role: 'ADMIN',
    generasi: 24,
    departmentId: 'dept-psdm',
    jabatan: 'Staf PSDM (PJ RISTEK)',
    tingkatJabatan: 'STAFF',
    namaLengkap: 'Bagas Pratama',
    email: 'bagas@org.id',
    nim: '2211522015',
    programStudiId: 'prodi-2',
    angkatan: 2022,
    noTelp: '081298765432',
    alamat: 'Jl. Asrama',
    pjDepartments: [{ adminId: 'usr-staf-psdm', departmentId: 'dept-ristek', assignedAt: new Date() }],
  };

  const pengurusRistekUser: AuthUser = {
    id: 'usr-pengurus-1',
    prn: 'RISTEK-001',
    role: 'PENGURUS',
    generasi: 24,
    departmentId: 'dept-ristek',
    departmentName: 'Riset dan Teknologi (RISTEK)',
    jabatan: 'Staff Web',
    tingkatJabatan: 'STAFF',
    namaLengkap: 'Citra Dewi Anggraini',
    email: 'citra@org.id',
    nim: '2311523040',
    programStudiId: 'prodi-1',
    angkatan: 2023,
    noTelp: '085712345678',
    alamat: 'Jl. Merpati',
    pjDepartments: [],
  };

  const pengurusKominfoUser: AuthUser = {
    id: 'usr-pengurus-2',
    prn: 'KOMINFO-001',
    role: 'PENGURUS',
    generasi: 24,
    departmentId: 'dept-kominfo',
    departmentName: 'Komunikasi dan Informasi (KOMINFO)',
    jabatan: 'Staff Desain',
    tingkatJabatan: 'STAFF',
    namaLengkap: 'Daffa Rizky Maulana',
    email: 'daffa@org.id',
    nim: '2311523088',
    programStudiId: 'prodi-2',
    angkatan: 2023,
    noTelp: '087812345678',
    alamat: 'Jl. Kenanga',
    pjDepartments: [],
  };

  await runTest('RBAC', 'SUPER_ADMIN memiliki akses ke seluruh daftar izin', async () => {
    const perms = await api.getPermissions(kadepUser);
    if (!perms || perms.length === 0) throw new Error('SUPER_ADMIN harus dapat melihat izin');
  });

  await runTest('RBAC', 'ADMIN (Staf PSDM) hanya melihat izin dari Departemen yang dibina (PJ RISTEK)', async () => {
    const perms = await api.getPermissions(stafPsdmUser);
    const hasOtherDept = perms.some((p) => p.userDepartmentId !== 'dept-ristek');
    if (hasOtherDept) {
      throw new Error('ADMIN tidak boleh melihat izin dari departemen di luar penugasan PJ!');
    }
  });

  await runTest('RBAC', 'PENGURUS hanya melihat izin milik akunnya sendiri', async () => {
    const perms = await api.getPermissions(pengurusRistekUser);
    const hasOtherUser = perms.some((p) => p.userId !== pengurusRistekUser.id);
    if (hasOtherUser) {
      throw new Error('PENGURUS tidak boleh melihat izin milik pengurus lain!');
    }
  });

  await runTest('RBAC', 'ADMIN ditolak (Forbidden) jika mencoba me-review izin di luar departemen binaannya', async () => {
    // Daffa dari KOMINFO (bukan binaan Bagas yang memegang RISTEK)
    const kominfoPerm = (await api.getPermissions(kadepUser)).find((p) => p.userDepartmentId === 'dept-kominfo');
    if (!kominfoPerm) throw new Error('Data uji izin KOMINFO tidak ditemukan');

    const reviewRes = await api.reviewPermission(kominfoPerm.id, 'APPROVED', stafPsdmUser);
    if (reviewRes.success) {
      throw new Error('ADMIN seharusnya ditolak saat mereview izin di luar departemen PJ binaannya!');
    }
  });

  await runTest('Business Logic', 'Sinkronisasi otomatis persetujuan izin (APPROVED) menjadi record Absensi', async () => {
    // Citra dari RISTEK mengajukan izin sakit
    const newPerm = await api.requestPermission(pengurusRistekUser, {
      activityId: 'act-1',
      jenisIzin: 'SAKIT',
      alasan: 'Demam berdarah dan rawat inap',
      evidenceUrl: 'https://example.com/surat-sakit.jpg',
    });

    // PJ RISTEK menyetujui izin Citra
    const reviewRes = await api.reviewPermission(newPerm.id, 'APPROVED', stafPsdmUser);
    if (!reviewRes.success) throw new Error('Review persetujuan gagal: ' + reviewRes.message);

    // Cek apakah presensi Citra otomatis tercatat SAKIT
    const attendances = await api.getAttendances(kadepUser, 'act-1');
    const citraAtt = attendances.find((a) => a.userId === pengurusRistekUser.id);
    if (!citraAtt) throw new Error('Presensi tidak otomatis terbentuk setelah izin di-ACC');
    if (citraAtt.status !== 'SAKIT') throw new Error(`Status absensi harus SAKIT, tetapi didapat: ${citraAtt.status}`);
  });

  // ------------------------------------------------------------
  // 4. Edge Hono Router Tests
  // ------------------------------------------------------------
  console.log('\nâ¡ SUITE 4: Edge Hono HTTP Router & Health Check');

  await runTest('Hono Edge', 'Endpoint /api/health mengembalikan status 200 OK', async () => {
    const res = await app.request('/api/health');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error('Response payload harus status: "ok"');
  });

  // ------------------------------------------------------------
  // 5. Backblaze B2 / R2 Storage Presigned URL Tests
  // ------------------------------------------------------------
  console.log('\nâï¸ SUITE 5: Storage S3/Backblaze B2 Presigned URL');

  await runTest('Storage', 'Membuat Presigned Upload URL S3 dengan valid key format', async () => {
    const config = {
      keyId: '005mockApplicationKeyId',
      applicationKey: 'K005mockSecretKeyForTestingPurposeOnly12',
      bucketName: 'psdm-evidence-bucket',
      region: 'us-east-005',
    };
    const result = await createPresignedUploadUrl(config, 'surat_keterangan.pdf', 'application/pdf', 3600);
    if (!result.uploadUrl || !result.uploadUrl.startsWith('http')) {
      throw new Error('Upload URL harus merupakan valid HTTP/HTTPS URL');
    }
    if (!result.fileKey.startsWith('evidence/')) {
      throw new Error('File key harus disimpan di folder evidence/');
    }
    if (!result.fileKey.endsWith('.pdf')) {
      throw new Error('File key harus mempertahankan ekstensi .pdf');
    }
  });

  // Summary
  const passed = testResults.filter((r) => r.passed).length;
  const failed = testResults.filter((r) => !r.passed).length;

  console.log('\n======================================================');
  console.log(`ð¯ HASIL PENGUJIAN INTEGRASI TAHAP 6:`);
  console.log(`   Total Pengujian: ${testResults.length}`);
  console.log(`   â Berhasil: ${passed}`);
  console.log(`   â Gagal: ${failed}`);
  console.log('======================================================\n');

  return {
    total: testResults.length,
    passed,
    failed,
    results: testResults,
  };
}

// Eksekusi jika dijalankan langsung via node/tsx
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllIntegrationTests().then(({ failed }) => {
    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  });
}
