import type { UserRole } from '../db/schema/users.ts';
import type { AttendanceStatus } from '../db/schema/attendances.ts';
import type { PermissionStatus } from '../db/schema/permissions.ts';

export type { UserRole, AttendanceStatus, PermissionStatus };

export interface AuthUser {
  id: string;
  prn: string;
  role: UserRole;
  generasi: number;
  departmentId: string;
  departmentName?: string;
  jabatan: string;
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
  avatarUrl?: string | null;
  isActive?: boolean;
  deletedAt?: string | Date | null;
  pjDepartments?: {
    adminId: string;
    departmentId: string;
    assignedAt?: string | Date;
  }[];
}

export interface ActivityCategory {
  id: string;
  nama: string;
  deskripsi?: string | null;
  name?: string;
  description?: string | null;
  hadirPoints: number;
  izinPoints: number;
  sakitPoints: number;
  alphaPoints: number;
  telatPoints: number;
  activityCount?: number;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ActivityItem {
  id: string;
  nama: string;
  deskripsi?: string | null;
  categoryId?: string;
  categoryName?: string;
  category?: ActivityCategory;
  mode: 'OFFLINE' | 'ONLINE';
  lokasi?: string | null;
  meetingUrl?: string | null;
  isLocked?: boolean;
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
    TELAT: number;
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
  awardedPoints?: number;
  recordedBy: string;
  recordedAt: string | Date;
}

export interface PointConfig {
  hadirPoints: number;
  izinPoints: number;
  sakitPoints: number;
  alphaPoints: number;
  telatPoints: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  namaLengkap: string;
  prn: string;
  nim: string | null;
  avatarUrl?: string | null;
  generasi: number;
  departmentId: string | null;
  departmentName: string | null;
  jabatan: string;
  totalPoints: number;
  hadirCount: number;
  izinCount: number;
  sakitCount: number;
  alphaCount: number;
  telatCount: number;
  totalActivities: number;
}

export interface MemberPointHistoryItem {
  id: string;
  activityId: string;
  activityName: string;
  activityDate: string | Date;
  status: AttendanceStatus;
  awardedPoints: number;
  recordedAt: string | Date;
}

export interface MemberPointsHistoryData {
  userId: string;
  totalPoints: number;
  history: MemberPointHistoryItem[];
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

export interface OnlineUserDevice {
  ipAddress: string | null;
  userAgent: string | null;
  lastActiveAt: string | Date;
}

export interface OnlineUserItem {
  id: string;
  namaLengkap: string;
  prn: string;
  role: UserRole;
  jabatan: string;
  departmentId: string | null;
  departmentName: string | null;
  avatarUrl?: string | null;
  lastActiveAt: string | Date;
  sessionCount: number;
  devices: OnlineUserDevice[];
}

export interface OnlinePresenceData {
  success: boolean;
  onlineCount: number;
  activeSessionsCount: number;
  timestamp: string;
  users: OnlineUserItem[];
}

export interface PointsLogRow {
  id: string;
  tanggal: string; // YYYY-MM-DD
  nama: string; // nama_lengkap
  prn?: string;
  jenis: 'Reward' | 'Punishment';
  nominal: number; // Math.abs(points)
  keterangan: string; // "${Status} Pada Kegiatan ${ActivityName}"
  status?: AttendanceStatus;
  activityName?: string;
  awardedPoints?: number;
  activityDate?: string | Date;
}

export interface PointsLogImportResult {
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  errors: { row: number; nama?: string; reason: string }[];
}

// ================= WA BROADCAST =================
export type WaBroadcastStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';

export interface WaBroadcastRecipient {
  id: string;
  broadcastId: string;
  userId: string;
  namaLengkap: string;
  prn: string;
  departmentNama: string;
  jabatan: string;
  phoneNumber: string;
  renderedMessage: string;
  status: WaBroadcastStatus;
  error?: string | null;
  sentAt?: string | Date | null;
  sentBy?: string | null;
}

export interface WaBroadcastSummary {
  total: number;
  sent: number;
  pending: number;
  failed: number;
}

export interface WaBroadcastData {
  id: string;
  activityId: string;
  messageTemplate: string;
  createdAt: string | Date;
  summary: WaBroadcastSummary;
}

export interface WaBroadcastResponse {
  broadcast: WaBroadcastData | null;
  activity: {
    id: string;
    nama: string;
    startDate: string | Date;
    lokasi?: string | null;
    mode: 'OFFLINE' | 'ONLINE';
    categoryNama?: string | null;
  };
  recipients: WaBroadcastRecipient[];
}

// ================= APP SETTINGS & BOT PROXY =================
export interface AppSettings {
  wa_bot_url: string;
  wa_api_key: string;
  [key: string]: string;
}

export type WaBotConnectionStatus =
  | 'CONNECTED'
  | 'QR_READY'
  | 'CONNECTING'
  | 'DISCONNECTED'
  | 'NOT_CONFIGURED'
  | 'OFFLINE'
  | 'ERROR';

export interface WaBotStatusResponse {
  success: boolean;
  status: WaBotConnectionStatus;
  qr: string | null;
  message?: string;
}


