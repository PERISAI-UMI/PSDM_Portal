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

const TOKEN_KEY = 'psdm_auth_token';
const USER_KEY = 'psdm_auth_user';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser | null): void {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Jika payload bukan FormData, pastikan Content-Type application/json jika ada body
  if (!(options.body instanceof FormData) && !headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson && typeof errJson === 'object' && 'message' in errJson) {
        errorMsg = errJson.message;
      }
    } catch {
      // Non-JSON error body
    }
    throw new Error(errorMsg);
  }

  const json = await response.json();
  return json as T;
}

export const api = {
  // ================= AUTH =================
  async login(
    prn: string,
    password?: string
  ): Promise<{ success: boolean; user?: AuthUser; message?: string }> {
    const cleanPrn = prn.trim().toUpperCase();

    try {
      const res = await request<{
        success: boolean;
        message?: string;
        data?: { user: AuthUser; token?: string };
      }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ prn: cleanPrn, password: password || '' }),
      });

      if (res.success && res.data?.user) {
        const user = res.data.user;
        if (res.data.token) {
          setStoredToken(res.data.token);
        }
        setStoredUser(user);
        return { success: true, user };
      }

      return { success: false, message: res.message || 'PRN atau kata sandi tidak sesuai' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghubungi server';
      return { success: false, message: msg };
    }
  },

  async getMe(): Promise<{ success: boolean; user?: AuthUser; message?: string }> {
    try {
      const res = await request<{
        success: boolean;
        message?: string;
        data?: { user: AuthUser; expiresAt: string };
      }>('/api/auth/me');

      if (res.success && res.data?.user) {
        setStoredUser(res.data.user);
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.message || 'Sesi tidak valid' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memvalidasi sesi';
      return { success: false, message: msg };
    }
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      setStoredToken(null);
      setStoredUser(null);
    }
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const res = await request<{ success: boolean; message: string }>(
        '/api/auth/change-password',
        {
          method: 'POST',
          body: JSON.stringify({ oldPassword: currentPassword, newPassword }),
        }
      );
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui kata sandi';
      return { success: false, message: msg };
    }
  },

  // ================= USERS =================
  async getUsers(): Promise<AuthUser[]> {
    try {
      const res = await request<{ success: boolean; data: AuthUser[] }>('/api/users');
      return res.data || [];
    } catch (err) {
      console.error('Failed to fetch users from server:', err);
      return [];
    }
  },

  async updateProfile(userId: string, updates: Partial<AuthUser>): Promise<AuthUser> {
    const res = await request<{ success: boolean; data?: AuthUser; message?: string }>(
      '/api/users/profile',
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      }
    );

    if (!res.success || !res.data) {
      throw new Error(res.message || 'Gagal menyimpan pembaruan profil ke database');
    }

    setStoredUser(res.data);
    return res.data;
  },

  async createUser(newUser: Omit<AuthUser, 'id'>): Promise<AuthUser> {
    const res = await request<{ success: boolean; data: AuthUser }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(newUser),
    });
    return res.data;
  },

  async batchImportUsers(userList: Omit<AuthUser, 'id'>[]): Promise<{
    importedCount: number;
    updatedCount?: number;
    skippedCount: number;
    errors: { prn: string; reason: string }[];
  }> {
    const res = await request<{
      success: boolean;
      message: string;
      data: {
        importedCount: number;
        updatedCount?: number;
        skippedCount: number;
        errors: { prn: string; reason: string }[];
      };
    }>('/api/users/batch-import', {
      method: 'POST',
      body: JSON.stringify({ users: userList }),
    });

    return res.data;
  },

  async updateUser(id: string, updates: Partial<AuthUser>): Promise<void> {
    await request(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteUser(id: string): Promise<void> {
    await request(`/api/users/${id}`, {
      method: 'DELETE',
    });
  },

  // ================= MASTER DATA =================
  async getMasterData(): Promise<{
    fakultas: FakultasItem[];
    programStudi: ProgramStudiItem[];
    departments: DepartmentItem[];
    pjMappings: PjMappingItem[];
  }> {
    try {
      const [fakRes, prodiRes, deptRes, pjRes] = await Promise.all([
        request<{ success: boolean; data: FakultasItem[] }>('/api/master/fakultas').catch(() => ({
          success: true,
          data: [],
        })),
        request<{ success: boolean; data: ProgramStudiItem[] }>('/api/master/program-studi').catch(
          () => ({ success: true, data: [] })
        ),
        request<{ success: boolean; data: DepartmentItem[] }>('/api/master/departments').catch(
          () => ({ success: true, data: [] })
        ),
        request<{ success: boolean; data: PjMappingItem[] }>('/api/master/pj-departments').catch(
          () => ({ success: true, data: [] })
        ),
      ]);

      return {
        fakultas: fakRes.data || [],
        programStudi: prodiRes.data || [],
        departments: deptRes.data || [],
        pjMappings: pjRes.data || [],
      };
    } catch (err) {
      console.error('Failed to get master data:', err);
      return {
        fakultas: [],
        programStudi: [],
        departments: [],
        pjMappings: [],
      };
    }
  },

  async addFakultas(nama: string): Promise<FakultasItem> {
    const res = await request<{ success: boolean; data: FakultasItem }>('/api/master/fakultas', {
      method: 'POST',
      body: JSON.stringify({ nama }),
    });
    return res.data;
  },

  async updateFakultas(id: string, nama: string): Promise<void> {
    await request(`/api/master/fakultas/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ nama }),
    });
  },

  async deleteFakultas(id: string): Promise<void> {
    await request(`/api/master/fakultas/${id}`, {
      method: 'DELETE',
    });
  },

  async addProdi(fakultasId: string, nama: string): Promise<ProgramStudiItem> {
    const res = await request<{ success: boolean; data: ProgramStudiItem }>(
      '/api/master/program-studi',
      {
        method: 'POST',
        body: JSON.stringify({ fakultasId, nama }),
      }
    );
    return res.data;
  },

  async updateProdi(id: string, fakultasId: string, nama: string): Promise<void> {
    await request(`/api/master/program-studi/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ fakultasId, nama }),
    });
  },

  async deleteProdi(id: string): Promise<void> {
    await request(`/api/master/program-studi/${id}`, {
      method: 'DELETE',
    });
  },

  async addDepartment(nama: string): Promise<DepartmentItem> {
    const res = await request<{ success: boolean; data: DepartmentItem }>('/api/master/departments', {
      method: 'POST',
      body: JSON.stringify({ nama }),
    });
    return res.data;
  },

  async updateDepartment(id: string, nama: string): Promise<void> {
    await request(`/api/master/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ nama }),
    });
  },

  async deleteDepartment(id: string): Promise<void> {
    await request(`/api/master/departments/${id}`, {
      method: 'DELETE',
    });
  },

  async assignPjDepartment(adminId: string, departmentId: string): Promise<void> {
    await request('/api/master/pj-departments', {
      method: 'POST',
      body: JSON.stringify({ adminId, departmentId }),
    });
  },

  async removePjDepartment(adminId: string, departmentId: string): Promise<void> {
    await request(`/api/master/pj-departments/${adminId}/${departmentId}`, {
      method: 'DELETE',
    });
  },

  // ================= ACTIVITIES =================
  async getActivities(_user?: AuthUser): Promise<ActivityItem[]> {
    try {
      const res = await request<{ success: boolean; data: ActivityItem[] }>('/api/activities');
      return res.data || [];
    } catch (err) {
      console.error('Failed to fetch activities:', err);
      return [];
    }
  },

  async createActivity(
    activity: Omit<ActivityItem, 'id' | 'attendanceSummary'>
  ): Promise<ActivityItem> {
    const res = await request<{ success: boolean; data: ActivityItem }>('/api/activities', {
      method: 'POST',
      body: JSON.stringify({
        ...activity,
        startDate: new Date(activity.startDate).toISOString(),
        endDate: new Date(activity.endDate).toISOString(),
      }),
    });
    return res.data;
  },

  async updateActivity(id: string, updates: Partial<ActivityItem>): Promise<void> {
    const payload: Record<string, unknown> = { ...updates };
    if (updates.startDate) payload.startDate = new Date(updates.startDate).toISOString();
    if (updates.endDate) payload.endDate = new Date(updates.endDate).toISOString();

    await request(`/api/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteActivity(id: string): Promise<void> {
    await request(`/api/activities/${id}`, {
      method: 'DELETE',
    });
  },

  // ================= ATTENDANCES =================
  async getAttendances(_user: AuthUser, activityId?: string): Promise<AttendanceRecord[]> {
    try {
      const qs = activityId ? `?activityId=${encodeURIComponent(activityId)}` : '';
      const res = await request<{ success: boolean; data: AttendanceRecord[] }>(
        `/api/attendances${qs}`
      );
      return res.data || [];
    } catch (err) {
      console.error('Failed to fetch attendances:', err);
      return [];
    }
  },

  async recordAttendance(
    activityId: string,
    userId: string,
    status: AttendanceStatus,
    _recordedBy?: string
  ): Promise<void> {
    await request('/api/attendances', {
      method: 'POST',
      body: JSON.stringify({
        activityId,
        userId,
        status,
      }),
    });
  },

  async recordBatchAttendance(
    activityId: string,
    items: { userId: string; status: AttendanceStatus }[],
    _recordedBy?: string
  ): Promise<void> {
    await request('/api/attendances/batch', {
      method: 'POST',
      body: JSON.stringify({
        activityId,
        items,
      }),
    });
  },

  async resetAttendance(activityId: string, userIds?: string[]): Promise<void> {
    await request('/api/attendances/reset', {
      method: 'POST',
      body: JSON.stringify({
        activityId,
        userIds,
      }),
    });
  },

  // ================= PERMISSIONS =================
  async getPermissions(_user: AuthUser): Promise<PermissionRecord[]> {
    try {
      const res = await request<{ success: boolean; data: PermissionRecord[] }>('/api/permissions');
      return res.data || [];
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
      return [];
    }
  },

  async requestPermission(
    _user: AuthUser,
    data: { activityId: string; jenisIzin: string; alasan: string; evidenceUrl?: string | null }
  ): Promise<PermissionRecord> {
    const res = await request<{ success: boolean; data: PermissionRecord }>('/api/permissions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async reviewPermission(
    permissionId: string,
    status: PermissionStatus,
    _reviewer: AuthUser
  ): Promise<{ success: boolean; message: string }> {
    const res = await request<{ success: boolean; message: string }>(
      `/api/permissions/${permissionId}/review`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    );
    return res;
  },

  // ================= OBJECT STORAGE (BACKBLAZE B2) =================
  /**
   * Mengunggah berkas bukti secara nyata ke Backblaze B2 Object Storage
   * Mengembalikan URL publik berkas di bucket PSDM-B2
   */
  async uploadEvidenceFile(file: File): Promise<{
    url: string;
    fileName: string;
    size: number;
    contentType: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await request<{
      success: boolean;
      message: string;
      data: {
        url: string;
        fileName: string;
        size: number;
        contentType: string;
      };
    }>('/api/storage/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.success || !res.data) {
      throw new Error(res.message || 'Gagal mengunggah berkas ke Object Storage Backblaze B2');
    }

    return res.data;
  },

  // ================= REAL-TIME LIVE SYNC =================
  async getLiveSync(
    lastHash?: string
  ): Promise<{
    success: boolean;
    changed: boolean;
    hash: string;
    serverTime: string;
    data?: {
      activities: ActivityItem[];
      permissions: PermissionRecord[];
      attendances: AttendanceRecord[];
    };
  }> {
    const qs = lastHash ? `?hash=${encodeURIComponent(lastHash)}` : '';
    const res = await request<{
      success: boolean;
      changed: boolean;
      hash: string;
      serverTime: string;
      data?: {
        activities: ActivityItem[];
        permissions: PermissionRecord[];
        attendances: AttendanceRecord[];
      };
    }>(`/api/sync/live${qs}`);
    return res;
  },
};
