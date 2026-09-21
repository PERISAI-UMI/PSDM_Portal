import { z } from 'zod';
import { userRoleEnum } from './schema/users.ts';
import { attendanceStatusEnum } from './schema/attendances.ts';
import { permissionStatusEnum } from './schema/permissions.ts';

// Academic Validation
export const fakultasSchema = z.object({
  id: z.string().min(1, 'ID Fakultas wajib diisi'),
  nama: z.string().min(2, 'Nama Fakultas minimal 2 karakter'),
});

export const programStudiSchema = z.object({
  id: z.string().min(1, 'ID Program Studi wajib diisi'),
  fakultasId: z.string().min(1, 'ID Fakultas wajib diisi'),
  nama: z.string().min(2, 'Nama Program Studi minimal 2 karakter'),
});

// Department Validation
export const departmentSchema = z.object({
  id: z.string().min(1, 'ID Departemen wajib diisi'),
  nama: z.string().min(2, 'Nama Departemen minimal 2 karakter'),
});

// User Validation
export const userSchema = z.object({
  id: z.string().min(1),
  prn: z.string().min(3, 'PRN / Username minimal 3 karakter').max(50),
  passwordHash: z.string().min(8),
  role: z.enum(userRoleEnum),
  generasi: z.number().int().positive(),
  departmentId: z.string().min(1, 'Departemen wajib dipilih'),
  jabatan: z.string().min(2, 'Jabatan wajib diisi'),
  namaLengkap: z.string().min(2, 'Nama lengkap wajib diisi'),
  tempatLahir: z.string().min(2, 'Tempat lahir wajib diisi'),
  tanggalLahir: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  alamat: z.string().min(5, 'Alamat minimal 5 karakter'),
  noTelp: z.string().regex(/^[0-9+]{9,15}$/, 'Nomor telepon tidak valid'),
  email: z.string().email('Format email tidak valid'),
  nim: z.string().min(5, 'NIM minimal 5 karakter'),
  programStudiId: z.string().min(1, 'Program studi wajib dipilih'),
  angkatan: z.number().int().min(2000).max(2100),
  linkedinUrl: z.string().url('URL LinkedIn tidak valid').optional().nullable(),
  instagramUsername: z.string().optional().nullable(),
});

export const createUserSchema = userSchema.omit({ id: true });
export const updateUserSchema = userSchema.partial().omit({ id: true, prn: true });

// Activities Validation
export const activitySchema = z.object({
  id: z.string().min(1),
  nama: z.string().min(3, 'Nama kegiatan minimal 3 karakter'),
  deskripsi: z.string().optional().nullable(),
  jenis: z.string().min(2, 'Jenis kegiatan wajib diisi'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isPublished: z.boolean().default(false),
  createdBy: z.string().min(1),
});

export const createActivitySchema = activitySchema.omit({ id: true, createdBy: true });

// Attendance Validation
export const attendanceSchema = z.object({
  id: z.string().min(1),
  activityId: z.string().min(1, 'Activity ID wajib diisi'),
  userId: z.string().min(1, 'User ID wajib diisi'),
  status: z.enum(attendanceStatusEnum),
  recordedBy: z.string().min(1, 'Admin pencatat wajib diisi'),
  recordedAt: z.coerce.date().optional(),
});

export const recordAttendanceBatchSchema = z.object({
  activityId: z.string().min(1),
  records: z.array(
    z.object({
      userId: z.string().min(1),
      status: z.enum(attendanceStatusEnum),
    })
  ).min(1, 'Minimal satu data absensi harus disertakan'),
});

// Permission Validation
export const permissionSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  activityId: z.string().min(1, 'Kegiatan wajib dipilih'),
  jenisIzin: z.string().min(2, 'Jenis izin wajib diisi'),
  alasan: z.string().min(5, 'Alasan izin minimal 5 karakter'),
  evidenceUrl: z.string().url('URL bukti izin tidak valid').optional().nullable(),
  status: z.enum(permissionStatusEnum).default('PENDING'),
  reviewedBy: z.string().optional().nullable(),
  reviewedAt: z.coerce.date().optional().nullable(),
});

export const requestPermissionSchema = permissionSchema.pick({
  activityId: true,
  jenisIzin: true,
  alasan: true,
  evidenceUrl: true,
});

export const reviewPermissionSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'] as const),
});

// PJ Department Assignment Validation
export const pjDepartmentSchema = z.object({
  adminId: z.string().min(1, 'ID Admin wajib diisi'),
  departmentId: z.string().min(1, 'ID Departemen wajib diisi'),
});
