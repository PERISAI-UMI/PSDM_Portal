import type { UserRole, TingkatJabatan } from '../db/schema/users.ts';
import type { AttendanceStatus } from '../db/schema/attendances.ts';
import type { PermissionStatus } from '../db/schema/permissions.ts';

export type { UserRole, TingkatJabatan, AttendanceStatus, PermissionStatus };

export interface AuthUser {
  id: string;
  prn: string;
  role: UserRole;
  generasi: number;
  departmentId: string;
  departmentName?: string;
  jabatan: string;
  tingkatJabatan: TingkatJabatan;
  namaLengkap: string;
  email: string;
  nim: string;
  programStudiId: string;
  programStudiName?: string;
  angkatan: number;
  noTelp: string;
  alamat?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  linkedinUrl?: string | null;
  instagramUsername?: string | null;
  pjDepartments?: {
    adminId: string;
    departmentId: string;
    assignedAt?: string | Date;
  }[];
}

export interface ActivityItem {
  id: string;
  nama: string;
  deskripsi?: string | null;
  jenis: string;
  startDate: string | Date;
  endDate: string | Date;
  isPublished: boolean;
  createdBy: string;
  creatorName?: string;
  attendanceSummary?: {
    HADIR: number;
    IZIN: number;
    SAKIT: number;
    ALPHA: number;
    TOTAL: number;
  };
}

export interface AttendanceRecord {
  id: string;
  activityId: string;
  activityName?: string;
  activityDate?: string | Date;
  userId: string;
  userName?: string;
  userPrn?: string;
  userDepartmentId?: string;
  userDepartmentName?: string;
  status: AttendanceStatus;
  recordedBy: string;
  recordedAt: string | Date;
}

export interface PermissionRecord {
  id: string;
  userId: string;
  userName?: string;
  userPrn?: string;
  userDepartmentId?: string;
  userDepartmentName?: string;
  activityId: string;
  activityName?: string;
  activityDate?: string | Date;
  jenisIzin: string;
  alasan: string;
  evidenceUrl?: string | null;
  status: PermissionStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | Date | null;
  createdAt: string | Date;
}

export interface DepartmentItem {
  id: string;
  nama: string;
}

export interface FakultasItem {
  id: string;
  nama: string;
}

export interface ProgramStudiItem {
  id: string;
  fakultasId: string;
  nama: string;
}

export interface PjMappingItem {
  adminId: string;
  adminName?: string;
  adminPrn?: string;
  departmentId: string;
  departmentName?: string;
  assignedAt?: string | Date;
}
