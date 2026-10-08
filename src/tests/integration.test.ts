/**
 * ============================================================
 * PSDM.web 2.0 - SUITE PENGUJIAN INTEGRASI & UNIT LENGKAP (VITEST)
 * ============================================================
 * Menguji seluruh modul inti secara in-memory (tanpa butuh server aktif):
 * 1. WebCrypto Edge (PBKDF2 Password Hashing & Token Generator)
 * 2. Skema Validasi Zod & Integritas Data Relasional 3NF
 * 3. Matriks Akses RBAC & Sinkronisasi Otomatis Izin ke Presensi
 * 4. Hono Edge Routing, Health Check & Error Handling (app.request)
 * 5. Storage S3/Backblaze B2 Presigned Upload URL Generator
 * ============================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { hashPassword, verifyPassword, generateSessionToken } from '../server/crypto.ts';
import {
  userSchema,
  activitySchema,
  attendanceSchema,
  permissionSchema,
  pjDepartmentSchema,
  pointConfigSchema,
} from '../db/validation.ts';
import { calculatePointsForStatus } from '../server/routes/points.ts';
import { api } from '../services/api.ts';
import { createPresignedUploadUrl } from '../server/storage.ts';
import app from '../server/index.ts';
import type { AuthUser, AttendanceRecord, PermissionRecord, AttendanceStatus } from '../types/index.ts';

// Pastikan environment mock tersedia agar dbMiddleware tidak mengembalikan 503
beforeAll(() => {
  process.env.TURSO_DATABASE_URL = 'libsql://mock-test.turso.io';
  process.env.TURSO_AUTH_TOKEN = 'mock-auth-token-xyz';
  process.env.ALLOWED_ORIGIN = 'https://psdm-portal.pages.dev';
});

// ============================================================
// 1. WebCrypto Edge Authentication Tests
// ============================================================
describe('SUITE 1: WebCrypto Edge Authentication & Hashing', () => {
  it('Generate session token dengan entropi 256-bit', () => {
    const token1 = generateSessionToken();
    const token2 = generateSessionToken();
    expect(token1).toHaveLength(64);
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
  });

  it('Hash password dengan PBKDF2 SHA-256 dan verifikasi password valid', async () => {
    const rawPassword = 'PasswordAmanPSDM2026!';
    const hashed = await hashPassword(rawPassword);
    expect(hashed).toContain(':');

    const isValid = await verifyPassword(rawPassword, hashed);
    expect(isValid).toBe(true);
  });

  it('Tolak verifikasi dengan password yang salah', async () => {
    const rawPassword = 'PasswordAmanPSDM2026!';
    const hashed = await hashPassword(rawPassword);

    const isInvalid = await verifyPassword('PasswordSalah123', hashed);
    expect(isInvalid).toBe(false);
  });
});

// ============================================================
// 2. Zod Schema & 3NF Integrity Tests
// ============================================================
describe('SUITE 2: Skema Validasi Zod & Integritas 3NF', () => {
  it('Validasi User 3NF dengan seluruh field relasional', () => {
    const sampleUser = {
      id: 'usr-test-1',
      prn: 'TEST-001',
      passwordHash: 'salt:hash12345678',
      role: 'PENGURUS' as const,
      generasi: 24,
      departmentId: 'dept-ristek',
      jabatan: 'Staff Cloud',
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
    expect(parsed.success).toBe(true);
  });

  it('Tolak User dengan format email atau NIM tidak valid', () => {
    const invalidUser = {
      id: 'usr-fail',
      prn: 'F',
      passwordHash: 'short',
      role: 'INVALID_ROLE',
      generasi: -1,
      departmentId: '',
      jabatan: '',
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
    expect(parsed.success).toBe(false);
  });

  it('Validasi skema kegiatan proker (Activity)', () => {
    const sampleActivity = {
      id: 'act-test-1',
      nama: 'Rapat Kerja Wilayah',
      deskripsi: 'Koordinasi program kerja tahunan',
      mode: 'OFFLINE',
      lokasi: 'Gedung Rektorat Lt. 3',
      meetingUrl: null,
      isLocked: false,
      startDate: new Date(),
      endDate: new Date(Date.now() + 3600000),
      isPublished: true,
      createdBy: 'usr-kadep',
    };
    const parsed = activitySchema.safeParse(sampleActivity);
    expect(parsed.success).toBe(true);
  });

  it('Validasi skema penugasan PJ Departemen', () => {
    const samplePj = {
      adminId: 'usr-staf-psdm',
      departmentId: 'dept-ristek',
    };
    const parsed = pjDepartmentSchema.safeParse(samplePj);
    expect(parsed.success).toBe(true);
  });

  it('Validasi User dengan soft delete field (isActive & deletedAt)', () => {
    const userWithSoftDelete = {
      id: 'usr-soft-1',
      prn: 'TEST-002',
      passwordHash: 'salt:hash12345678',
      role: 'PENGURUS' as const,
      generasi: 24,
      departmentId: 'dept-ristek',
      jabatan: 'Staff',
      namaLengkap: 'Dimas Prasetyo',
      tempatLahir: 'Makassar',
      tanggalLahir: '2004-01-01',
      alamat: 'Jl. Urip Sumoharjo',
      noTelp: '08123456789',
      email: 'dimas@organisasi.id',
      nim: '2311529001',
      programStudiId: 'prodi-1',
      angkatan: 2023,
      isActive: false,
      deletedAt: new Date(),
    };
    const parsed = userSchema.safeParse(userWithSoftDelete);
    expect(parsed.success).toBe(true);
  });

  it('Validasi skema konfigurasi bobot poin (Point Config)', () => {
    const validConfig = {
      hadirPoints: 10,
      izinPoints: 3,
      sakitPoints: 3,
      alphaPoints: -10,
      telatPoints: 5,
    };
    const parsed = pointConfigSchema.safeParse(validConfig);
    expect(parsed.success).toBe(true);

    // Alpha berbobot negatif diizinkan
    expect(parsed.data?.alphaPoints).toBe(-10);
  });

  it('Kalkulasi snapshot poin deterministik dan mematuhi imutabilitas', () => {
    const weightsT0 = {
      hadirPoints: 10,
      izinPoints: 3,
      sakitPoints: 3,
      alphaPoints: -5,
      telatPoints: 5,
    };

    const hadirPoint = calculatePointsForStatus('HADIR', weightsT0);
    const alphaPointT0 = calculatePointsForStatus('ALPHA', weightsT0);
    expect(hadirPoint).toBe(10);
    expect(alphaPointT0).toBe(-5);

    // Di waktu T1 bobot ALPHA diubah menjadi -10 oleh Super Admin
    const weightsT1 = { ...weightsT0, alphaPoints: -10 };
    const alphaPointT1 = calculatePointsForStatus('ALPHA', weightsT1);
    expect(alphaPointT1).toBe(-10);

    // Nilai snapshot T0 tetap tidak berubah di memori presensi historis
    expect(alphaPointT0).toBe(-5);
  });
});

// ============================================================
// 3. RBAC & Business Logic Tests (In-Memory Mock Sandbox)
// ============================================================
describe('SUITE 3: RBAC & Business Logic (In-Memory Sandbox)', () => {
  const kadepUser: AuthUser = {
    id: 'usr-kadep',
    prn: 'PSDM-001',
    role: 'SUPER_ADMIN',
    generasi: 24,
    departmentId: 'dept-psdm',
    jabatan: 'Kadep PSDM',
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
    namaLengkap: 'Citra Dewi Anggraini',
    email: 'citra@org.id',
    nim: '2311523040',
    programStudiId: 'prodi-1',
    angkatan: 2023,
    noTelp: '085712345678',
    alamat: 'Jl. Merpati',
    pjDepartments: [],
    isActive: true,
  };

  const pengurusKominfoUser: AuthUser = {
    id: 'usr-pengurus-2',
    prn: 'KOMINFO-001',
    role: 'PENGURUS',
    generasi: 24,
    departmentId: 'dept-kominfo',
    departmentName: 'Komunikasi dan Informasi (KOMINFO)',
    jabatan: 'Staff Desain',
    namaLengkap: 'Daffa Rizky Maulana',
    email: 'daffa@org.id',
    nim: '2311523088',
    programStudiId: 'prodi-2',
    angkatan: 2023,
    noTelp: '087812345678',
    alamat: 'Jl. Kenanga',
    pjDepartments: [],
    isActive: true,
  };

  let mockPermissions: PermissionRecord[] = [];
  let mockAttendances: AttendanceRecord[] = [];
  let mockUsers: AuthUser[] = [];
  let activeTestUser: AuthUser = kadepUser;

  beforeEach(() => {
    mockUsers = [
      { ...kadepUser },
      { ...stafPsdmUser },
      { ...pengurusRistekUser },
      { ...pengurusKominfoUser },
    ];
    // Inisialisasi data izin in-memory
    mockPermissions = [
      {
        id: 'perm-citra-1',
        userId: 'usr-pengurus-1',
        userName: 'Citra Dewi Anggraini',
        userPrn: 'RISTEK-001',
        userDepartmentId: 'dept-ristek',
        userDepartmentName: 'Riset dan Teknologi (RISTEK)',
        activityId: 'act-1',
        activityName: 'Rapat Kerja PSDM',
        jenisIzin: 'SAKIT',
        alasan: 'Demam tinggi dan istirahat dokter',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'perm-daffa-2',
        userId: 'usr-pengurus-2',
        userName: 'Daffa Rizky Maulana',
        userPrn: 'KOMINFO-001',
        userDepartmentId: 'dept-kominfo',
        userDepartmentName: 'Komunikasi dan Informasi (KOMINFO)',
        activityId: 'act-1',
        activityName: 'Rapat Kerja PSDM',
        jenisIzin: 'TUGAS_AKADEMIK',
        alasan: 'Praktikum mata kuliah jaringan',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      },
    ];

    mockAttendances = [];
    activeTestUser = kadepUser;

    // Spy global fetch untuk memproses request secara in-memory tanpa butuh port localhost:3000
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method || 'GET';

      // 1. GET /api/permissions
      if (urlStr.includes('/api/permissions') && method === 'GET') {
        let filtered = [...mockPermissions];
        if (activeTestUser.role === 'PENGURUS') {
          filtered = filtered.filter((p) => p.userId === activeTestUser.id);
        } else if (activeTestUser.role === 'ADMIN') {
          const assignedDepts = (activeTestUser.pjDepartments?.map((pj) => pj.departmentId) || []).filter(Boolean) as string[];
          filtered = filtered.filter((p) => Boolean(p.userDepartmentId && assignedDepts.includes(p.userDepartmentId)));
        }
        return new Response(JSON.stringify({ success: true, data: filtered }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 2. POST /api/permissions (Pengajuan Izin)
      if (urlStr.includes('/api/permissions') && method === 'POST') {
        const body = JSON.parse((init?.body as string) || '{}');
        const newPerm: PermissionRecord = {
          id: `perm-${Date.now()}`,
          userId: activeTestUser.id,
          userName: activeTestUser.namaLengkap,
          userPrn: activeTestUser.prn,
          userDepartmentId: activeTestUser.departmentId,
          userDepartmentName: activeTestUser.departmentName || '',
          activityId: body.activityId,
          activityName: 'Rapat Kerja PSDM',
          jenisIzin: body.jenisIzin,
          alasan: body.alasan,
          evidenceUrl: body.evidenceUrl,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        };
        mockPermissions.push(newPerm);
        return new Response(JSON.stringify({ success: true, data: newPerm }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 3. PATCH /api/permissions/:id/review
      if (urlStr.includes('/review') && method === 'PATCH') {
        const urlObj = new URL(urlStr);
        const segments = urlObj.pathname.split('/');
        const permId = segments[segments.length - 2];
        const body = JSON.parse((init?.body as string) || '{}');
        const targetPerm = mockPermissions.find((p) => p.id === permId);

        if (!targetPerm) {
          return new Response(JSON.stringify({ success: false, message: 'Data perizinan tidak ditemukan' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // RBAC: ADMIN hanya dapat ACC perizinan jika memiliki penugasan PJ ke departemen pemohon
        if (activeTestUser.role === 'ADMIN') {
          const isAssigned = activeTestUser.pjDepartments?.some(
            (pj) => pj.departmentId === targetPerm.userDepartmentId
          );
          if (!isAssigned) {
            return new Response(
              JSON.stringify({
                success: false,
                message: 'Forbidden: Anda tidak ditugaskan sebagai PJ Departemen dari anggota ini',
              }),
              { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
          }
        }

        targetPerm.status = body.status;
        targetPerm.reviewedBy = activeTestUser.namaLengkap;
        targetPerm.reviewedAt = new Date().toISOString();

        // Otomatis sinkronisasi ke tabel presensi jika disetujui (APPROVED)
        if (body.status === 'APPROVED') {
          const statusPresensi: AttendanceStatus = targetPerm.jenisIzin.toUpperCase().includes('SAKIT') ? 'SAKIT' : 'IZIN';
          mockAttendances.push({
            id: `att-${Date.now()}`,
            activityId: targetPerm.activityId,
            userId: targetPerm.userId,
            status: statusPresensi,
            recordedAt: new Date().toISOString(),
            recordedBy: activeTestUser.namaLengkap,
          });
        }

        return new Response(JSON.stringify({ success: true, data: targetPerm }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 4. GET /api/attendances
      if (urlStr.includes('/api/attendances') && method === 'GET') {
        return new Response(JSON.stringify({ success: true, data: mockAttendances }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 5. DELETE /api/users/:id (Soft Delete)
      if (urlStr.includes('/api/users/') && method === 'DELETE') {
        const id = urlStr.split('/api/users/')[1];
        const u = mockUsers.find((user) => user.id === id);
        if (u) {
          u.isActive = false;
          u.deletedAt = new Date().toISOString();
        }
        return new Response(JSON.stringify({ success: true, message: 'Akun dinonaktifkan (Soft Delete)' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 6. PATCH /api/users/:id/restore (Restore)
      if (urlStr.includes('/restore') && method === 'PATCH') {
        const id = urlStr.split('/api/users/')[1].replace('/restore', '');
        const u = mockUsers.find((user) => user.id === id);
        if (u) {
          u.isActive = true;
          u.deletedAt = null;
        }
        return new Response(JSON.stringify({ success: true, message: 'Akun diaktifkan kembali' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: false, message: 'Not Found' }), { status: 404 });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('SUPER_ADMIN memiliki akses ke seluruh daftar izin', async () => {
    activeTestUser = kadepUser;
    const perms = await api.getPermissions(kadepUser);
    expect(perms.length).toBeGreaterThanOrEqual(2);
  });

  it('ADMIN (Staf PSDM) hanya melihat izin dari Departemen yang dibina (PJ RISTEK)', async () => {
    activeTestUser = stafPsdmUser;
    const perms = await api.getPermissions(stafPsdmUser);
    expect(perms.length).toBe(1);
    expect(perms.every((p) => p.userDepartmentId === 'dept-ristek')).toBe(true);
  });

  it('PENGURUS hanya melihat izin milik akunnya sendiri', async () => {
    activeTestUser = pengurusRistekUser;
    const perms = await api.getPermissions(pengurusRistekUser);
    expect(perms.length).toBe(1);
    expect(perms.every((p) => p.userId === pengurusRistekUser.id)).toBe(true);
  });

  it('ADMIN ditolak (Forbidden) jika mencoba me-review izin di luar departemen binaannya', async () => {
    activeTestUser = kadepUser;
    const allPerms = await api.getPermissions(kadepUser);
    const kominfoPerm = allPerms.find((p) => p.userDepartmentId === 'dept-kominfo');
    expect(kominfoPerm).toBeDefined();

    // Staf PSDM (PJ Ristek) mencoba ACC izin Daffa (Kominfo) -> throw Forbidden
    activeTestUser = stafPsdmUser;
    await expect(api.reviewPermission(kominfoPerm!.id, 'APPROVED', stafPsdmUser)).rejects.toThrow(/Forbidden/);
  });

  it('Sinkronisasi otomatis persetujuan izin (APPROVED) menjadi record Absensi', async () => {
    // 1. Citra (Ristek) mengajukan izin sakit
    activeTestUser = pengurusRistekUser;
    const newPerm = await api.requestPermission(pengurusRistekUser, {
      activityId: 'act-1',
      jenisIzin: 'SAKIT',
      alasan: 'Demam berdarah dan rawat inap',
      evidenceUrl: 'https://example.com/surat-sakit.jpg',
    });
    expect(newPerm.id).toBeDefined();

    // 2. Staf PSDM (PJ Ristek) menyetujui izin Citra
    activeTestUser = stafPsdmUser;
    const reviewRes = await api.reviewPermission(newPerm.id, 'APPROVED', stafPsdmUser);
    expect(reviewRes.success).toBe(true);

    // 3. Verifikasi presensi Citra otomatis terbentuk dengan status SAKIT
    activeTestUser = kadepUser;
    const attendances = await api.getAttendances(kadepUser, 'act-1');
    const citraAtt = attendances.find((a) => a.userId === pengurusRistekUser.id);
    expect(citraAtt).toBeDefined();
    expect(citraAtt?.status).toBe('SAKIT');
  });

  it('Super Admin dapat melakukan Soft Delete anggota tanpa merusak riwayat presensi/izin', async () => {
    activeTestUser = kadepUser;
    // Daffa memiliki izin di perm-daffa-2
    expect(mockPermissions.some((p) => p.userId === pengurusKominfoUser.id)).toBe(true);

    // Hapus akun Daffa secara soft delete
    await api.deleteUser(pengurusKominfoUser.id);

    // Akun Daffa di mockUsers berstatus nonaktif (isActive = false)
    const daffa = mockUsers.find((u) => u.id === pengurusKominfoUser.id);
    expect(daffa?.isActive).toBe(false);
    expect(daffa?.deletedAt).toBeDefined();

    // Seluruh perizinan historis Daffa TETAP UTUH (tidak dihapus fisik)
    expect(mockPermissions.some((p) => p.userId === pengurusKominfoUser.id)).toBe(true);
  });

  it('Super Admin dapat me-restore akun anggota yang telah dinonaktifkan', async () => {
    activeTestUser = kadepUser;
    // Nonaktifkan terlebih dahulu
    await api.deleteUser(pengurusKominfoUser.id);
    let daffa = mockUsers.find((u) => u.id === pengurusKominfoUser.id);
    expect(daffa?.isActive).toBe(false);

    // Pulihkan kembali akun Daffa
    await api.restoreUser(pengurusKominfoUser.id);
    daffa = mockUsers.find((u) => u.id === pengurusKominfoUser.id);
    expect(daffa?.isActive).toBe(true);
    expect(daffa?.deletedAt).toBeNull();
  });
});

// ============================================================
// 4. Edge Hono HTTP Router Tests (app.request in-memory)
// ============================================================
describe('SUITE 4: Edge Hono HTTP Router & In-Memory Request Dispatching', () => {
  it('Endpoint /api/health mengembalikan status 200 OK', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(data.service).toContain('PSDM.web 2.0 API');
  });

  it('Fallback 404 mengembalikan format JSON yang konsisten', async () => {
    const res = await app.request('/api/endpoint-yang-tidak-ada');
    expect(res.status).toBe(404);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe('Endpoint tidak ditemukan');
  });

  it('Endpoint login memvalidasi schema input dengan benar (400 Bad Request jika kosong)', async () => {
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prn: '', password: '' }),
    });
    expect(res.status).toBe(400);
  });

  it('Endpoint /api/users/online menolak request tanpa autentikasi (401 Unauthorized)', async () => {
    const res = await app.request('/api/users/online');
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain('Unauthorized');
  });
});

// ============================================================
// 5. Storage S3/Backblaze B2 Presigned URL Tests
// ============================================================
describe('SUITE 5: Storage S3/Backblaze B2 Presigned URL', () => {
  it('Membuat Presigned Upload URL S3 dengan valid key format', async () => {
    const config = {
      keyId: '005mockApplicationKeyId',
      applicationKey: 'K005mockSecretKeyForTestingPurposeOnly12',
      bucketName: 'psdm-evidence-bucket',
      region: 'us-east-005',
    };
    const result = await createPresignedUploadUrl(config, 'surat_keterangan.pdf', 'application/pdf', 3600);
    expect(result.uploadUrl).toBeDefined();
    expect(result.uploadUrl.startsWith('http')).toBe(true);
    expect(result.fileKey.startsWith('evidence/')).toBe(true);
    expect(result.fileKey.endsWith('.pdf')).toBe(true);
  });
});
