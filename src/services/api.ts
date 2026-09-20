import type {
  AuthUser,
  ActivityItem,
  AttendanceRecord,
  PermissionRecord,
  DepartmentItem,
  FakultasItem,
  ProgramStudiItem,
  PjMappingItem,
  AttendanceStatus,
  PermissionStatus,
} from '../types/index.ts';
import {
  INITIAL_FAKULTAS,
  INITIAL_PRODI,
  INITIAL_DEPTS,
  INITIAL_USERS,
  INITIAL_ACTIVITIES,
  INITIAL_ATTENDANCES,
  INITIAL_PERMISSIONS,
} from './store.ts';

// State in-memory client yang tersinkronisasi
let currentFakultas: FakultasItem[] = [...INITIAL_FAKULTAS];
let currentProdi: ProgramStudiItem[] = [...INITIAL_PRODI];
let currentDepts: DepartmentItem[] = [...INITIAL_DEPTS];
let currentUsers: AuthUser[] = [...INITIAL_USERS];
let currentActivities: ActivityItem[] = [...INITIAL_ACTIVITIES];
let currentAttendances: AttendanceRecord[] = [...INITIAL_ATTENDANCES];
let currentPermissions: PermissionRecord[] = [...INITIAL_PERMISSIONS];

// In-memory credentials store (default password: 'password123')
const userPasswords: Record<string, string> = {
  'usr-kadep': 'password123',
  'usr-staf-psdm': 'password123',
  'usr-pengurus-1': 'password123',
};

export const api = {
  // ================= AUTH =================
  async login(
    prn: string,
    password?: string
  ): Promise<{ success: boolean; user?: AuthUser; message?: string }> {
    const user = currentUsers.find((u) => u.prn.toLowerCase() === prn.trim().toLowerCase());
    if (!user) {
      return { success: false, message: 'PRN atau username tidak ditemukan' };
    }

    if (password) {
      const storedPassword = userPasswords[user.id] || 'password123';
      if (password !== storedPassword) {
        return { success: false, message: 'Kata sandi tidak sesuai' };
      }
    }

    return { success: true, user };
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    const user = currentUsers.find((u) => u.id === userId);
    if (!user) {
      return { success: false, message: 'Pengguna tidak ditemukan' };
    }

    const stored = userPasswords[userId] || 'password123';
    if (currentPassword !== stored) {
      return { success: false, message: 'Kata sandi saat ini tidak sesuai.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'Kata sandi baru minimal 6 karakter.' };
    }

    if (newPassword === currentPassword) {
      return {
        success: false,
        message: 'Kata sandi baru tidak boleh sama dengan kata sandi saat ini.',
      };
    }

    userPasswords[userId] = newPassword;
    return { success: true, message: 'Kata sandi Anda berhasil diperbarui.' };
  },

  // ================= USERS =================
  async getUsers(): Promise<AuthUser[]> {
    return [...currentUsers];
  },

  async updateProfile(userId: string, updates: Partial<AuthUser>): Promise<AuthUser> {
    const user = currentUsers.find((u) => u.id === userId);
    if (!user) throw new Error('Pengguna tidak ditemukan');

    // Hanya field profil/biodata yang diizinkan untuk diubah oleh pengguna mandiri
    const safeUpdates: Partial<AuthUser> = {
      namaLengkap: updates.namaLengkap?.trim() || user.namaLengkap,
      email: updates.email?.trim() || user.email,
      noTelp: updates.noTelp?.trim() || user.noTelp,
      alamat: updates.alamat !== undefined ? updates.alamat : user.alamat,
      tempatLahir: updates.tempatLahir !== undefined ? updates.tempatLahir : user.tempatLahir,
      tanggalLahir: updates.tanggalLahir !== undefined ? updates.tanggalLahir : user.tanggalLahir,
      linkedinUrl: updates.linkedinUrl !== undefined ? updates.linkedinUrl : user.linkedinUrl,
      instagramUsername:
        updates.instagramUsername !== undefined
          ? updates.instagramUsername
          : user.instagramUsername,
      nim: updates.nim?.trim() || user.nim,
      angkatan: updates.angkatan || user.angkatan,
    };

    const updatedUser: AuthUser = { ...user, ...safeUpdates };
    currentUsers = currentUsers.map((u) => (u.id === userId ? updatedUser : u));
    return updatedUser;
  },

  async createUser(newUser: Omit<AuthUser, 'id'>): Promise<AuthUser> {
    const id = `usr-${Date.now()}`;
    const user: AuthUser = { ...newUser, id };
    currentUsers.push(user);
    return user;
  },

  async updateUser(id: string, updates: Partial<AuthUser>): Promise<void> {
    currentUsers = currentUsers.map((u) => (u.id === id ? { ...u, ...updates } : u));
  },

  async deleteUser(id: string): Promise<void> {
    currentUsers = currentUsers.filter((u) => u.id !== id);
  },

  // ================= MASTER DATA =================
  async getMasterData(): Promise<{
    fakultas: FakultasItem[];
    programStudi: ProgramStudiItem[];
    departments: DepartmentItem[];
    pjMappings: PjMappingItem[];
  }> {
    const pjMappings: PjMappingItem[] = [];
    currentUsers
      .filter((u) => u.role === 'ADMIN' && u.pjDepartments)
      .forEach((admin) => {
        admin.pjDepartments?.forEach((pj) => {
          const dept = currentDepts.find((d) => d.id === pj.departmentId);
          pjMappings.push({
            adminId: admin.id,
            adminName: admin.namaLengkap,
            adminPrn: admin.prn,
            departmentId: pj.departmentId,
            departmentName: dept?.nama || pj.departmentId,
            assignedAt: pj.assignedAt,
          });
        });
      });

    return {
      fakultas: [...currentFakultas],
      programStudi: [...currentProdi],
      departments: [...currentDepts],
      pjMappings,
    };
  },

  async addFakultas(nama: string): Promise<FakultasItem> {
    const item: FakultasItem = { id: `fak-${Date.now()}`, nama };
    currentFakultas.push(item);
    return item;
  },

  async addProdi(fakultasId: string, nama: string): Promise<ProgramStudiItem> {
    const item: ProgramStudiItem = { id: `prodi-${Date.now()}`, fakultasId, nama };
    currentProdi.push(item);
    return item;
  },

  async addDepartment(nama: string): Promise<DepartmentItem> {
    const item: DepartmentItem = { id: `dept-${Date.now()}`, nama };
    currentDepts.push(item);
    return item;
  },

  async assignPjDepartment(adminId: string, departmentId: string): Promise<void> {
    currentUsers = currentUsers.map((u) => {
      if (u.id === adminId && u.role === 'ADMIN') {
        const existing = u.pjDepartments || [];
        if (!existing.some((pj) => pj.departmentId === departmentId)) {
          return {
            ...u,
            pjDepartments: [...existing, { adminId, departmentId, assignedAt: new Date() }],
          };
        }
      }
      return u;
    });
  },

  async removePjDepartment(adminId: string, departmentId: string): Promise<void> {
    currentUsers = currentUsers.map((u) => {
      if (u.id === adminId) {
        return {
          ...u,
          pjDepartments: (u.pjDepartments || []).filter((pj) => pj.departmentId !== departmentId),
        };
      }
      return u;
    });
  },

  // ================= ACTIVITIES =================
  async getActivities(user: AuthUser): Promise<ActivityItem[]> {
    // RBAC: Pengurus hanya bisa melihat proker yang sudah dipublikasikan
    if (user.role === 'PENGURUS') {
      return currentActivities.filter((a) => a.isPublished);
    }
    return [...currentActivities];
  },

  async createActivity(activity: Omit<ActivityItem, 'id' | 'attendanceSummary'>): Promise<ActivityItem> {
    const newAct: ActivityItem = {
      ...activity,
      id: `act-${Date.now()}`,
      attendanceSummary: { HADIR: 0, IZIN: 0, SAKIT: 0, ALPHA: 0, TOTAL: 0 },
    };
    currentActivities.unshift(newAct);
    return newAct;
  },

  async updateActivity(id: string, updates: Partial<ActivityItem>): Promise<void> {
    currentActivities = currentActivities.map((a) => (a.id === id ? { ...a, ...updates } : a));
  },

  async deleteActivity(id: string): Promise<void> {
    currentActivities = currentActivities.filter((a) => a.id !== id);
  },

  // ================= ATTENDANCES =================
  async getAttendances(user: AuthUser, activityId?: string): Promise<AttendanceRecord[]> {
    let list = [...currentAttendances];
    if (activityId) {
      list = list.filter((att) => att.activityId === activityId);
    }
    // RBAC: Pengurus hanya bisa melihat riwayat absensinya sendiri
    if (user.role === 'PENGURUS') {
      return list.filter((att) => att.userId === user.id);
    }
    return list;
  },

  async recordAttendance(
    activityId: string,
    userId: string,
    status: AttendanceStatus,
    recordedBy: string
  ): Promise<void> {
    const existingIndex = currentAttendances.findIndex(
      (a) => a.activityId === activityId && a.userId === userId
    );
    const targetUser = currentUsers.find((u) => u.id === userId);
    const targetAct = currentActivities.find((a) => a.id === activityId);

    const record: AttendanceRecord = {
      id: existingIndex >= 0 ? currentAttendances[existingIndex].id : `att-${Date.now()}-${userId}`,
      activityId,
      activityName: targetAct?.nama,
      activityDate: targetAct?.startDate,
      userId,
      userName: targetUser?.namaLengkap,
      userPrn: targetUser?.prn,
      userDepartmentId: targetUser?.departmentId,
      userDepartmentName: targetUser?.departmentName,
      status,
      recordedBy,
      recordedAt: new Date(),
    };

    if (existingIndex >= 0) {
      currentAttendances[existingIndex] = record;
    } else {
      currentAttendances.push(record);
    }

    // Refresh statistik kegiatan
    this.refreshActivitySummary(activityId);
  },

  async recordBatchAttendance(
    activityId: string,
    items: { userId: string; status: AttendanceStatus }[],
    recordedBy: string
  ): Promise<void> {
    for (const item of items) {
      await this.recordAttendance(activityId, item.userId, item.status, recordedBy);
    }
  },

  refreshActivitySummary(activityId: string) {
    const actAtts = currentAttendances.filter((a) => a.activityId === activityId);
    const summary = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPHA: 0, TOTAL: actAtts.length };
    actAtts.forEach((a) => {
      if (a.status in summary) {
        summary[a.status as keyof typeof summary]++;
      }
    });

    currentActivities = currentActivities.map((act) =>
      act.id === activityId ? { ...act, attendanceSummary: summary } : act
    );
  },

  // ================= PERMISSIONS =================
  async getPermissions(user: AuthUser): Promise<PermissionRecord[]> {
    // 1. PENGURUS: Hanya melihat izin pribadi
    if (user.role === 'PENGURUS') {
      return currentPermissions.filter((p) => p.userId === user.id);
    }

    // 2. ADMIN: HANYA melihat izin dari pengurus departemen binaan PJ
    if (user.role === 'ADMIN') {
      const assignedDeptIds = user.pjDepartments?.map((pj) => pj.departmentId) || [];
      return currentPermissions.filter((p) => assignedDeptIds.includes(p.userDepartmentId || ''));
    }

    // 3. SUPER_ADMIN: Akses mutlak semua izin
    return [...currentPermissions];
  },

  async requestPermission(
    user: AuthUser,
    data: { activityId: string; jenisIzin: string; alasan: string; evidenceUrl?: string | null }
  ): Promise<PermissionRecord> {
    const act = currentActivities.find((a) => a.id === data.activityId);
    const newPerm: PermissionRecord = {
      id: `perm-${Date.now()}`,
      userId: user.id,
      userName: user.namaLengkap,
      userPrn: user.prn,
      userDepartmentId: user.departmentId,
      userDepartmentName: user.departmentName,
      activityId: data.activityId,
      activityName: act?.nama,
      activityDate: act?.startDate,
      jenisIzin: data.jenisIzin,
      alasan: data.alasan,
      evidenceUrl: data.evidenceUrl || null,
      status: 'PENDING',
      createdAt: new Date(),
    };

    currentPermissions.unshift(newPerm);
    return newPerm;
  },

  async reviewPermission(
    permissionId: string,
    status: PermissionStatus,
    reviewer: AuthUser
  ): Promise<{ success: boolean; message: string }> {
    const perm = currentPermissions.find((p) => p.id === permissionId);
    if (!perm) {
      return { success: false, message: 'Izin tidak ditemukan' };
    }

    // RBAC: ADMIN hanya bisa ACC/Tolak izin dari anggota departemen binaan PJ
    if (reviewer.role === 'ADMIN') {
      const isAssigned = reviewer.pjDepartments?.some((pj) => pj.departmentId === perm.userDepartmentId);
      if (!isAssigned) {
        return {
          success: false,
          message: 'Forbidden: Anda bukan PJ dari departemen anggota ini!',
        };
      }
    }

    // Update status perizinan
    currentPermissions = currentPermissions.map((p) =>
      p.id === permissionId
        ? {
            ...p,
            status,
            reviewedBy: reviewer.id,
            reviewedAt: new Date(),
          }
        : p
    );

    // Jika disetujui, sinkronisasi otomatis ke status absensi (IZIN atau SAKIT)
    if (status === 'APPROVED') {
      const attStatus: AttendanceStatus = perm.jenisIzin.toUpperCase().includes('SAKIT') ? 'SAKIT' : 'IZIN';
      await this.recordAttendance(perm.activityId, perm.userId, attStatus, reviewer.id);
    }

    return {
      success: true,
      message: `Status izin berhasil diubah menjadi ${status}`,
    };
  },
};
