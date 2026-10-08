import { Hono } from 'hono';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import type { AppEnv } from '../types.ts';
import {
  activities,
  activityCategories,
  attendances,
  permissions,
  users,
  departments,
} from '../../db/schema/index.ts';
import { authMiddleware } from '../middleware/auth.ts';

export const syncRouter = new Hono<AppEnv>();

syncRouter.use('*', authMiddleware);

interface SyncCacheEntry {
  hash: string;
  data: {
    activities: any[];
    permissions: any[];
    attendances: any[];
  };
  cachedAt: number;
}

// Micro-cache 4 detik per user/role di Cloudflare Worker isolate untuk meredam lonjakan query simultan
const syncMicroCache = new Map<string, SyncCacheEntry>();
const SYNC_CACHE_TTL_MS = 4000;

export function invalidateSyncCache() {
  syncMicroCache.clear();
}

/**
 * GET /api/sync/live
 * Endpoint agregasi real-time untuk sinkronisasi live data (activities, permissions, attendances)
 * Dilengkapi micro-cache dan hash/versioning sehingga jika tidak ada perubahan,
 * response berukuran sangat kecil (~70 byte) tanpa membebani browser atau server.
 */
syncRouter.get('/live', async (c) => {
  const db = c.get('db');
  const user = c.get('user');
  const clientHash = c.req.query('hash');
  const cacheKey = `${user.id}:${user.role}`;
  const nowMs = Date.now();

  // Layani dari micro-cache jika masih valid
  const cached = syncMicroCache.get(cacheKey);
  if (cached && nowMs - cached.cachedAt < SYNC_CACHE_TTL_MS) {
    if (clientHash && clientHash === cached.hash) {
      return c.json({
        success: true,
        changed: false,
        hash: cached.hash,
        serverTime: new Date().toISOString(),
      });
    }

    return c.json({
      success: true,
      changed: true,
      hash: cached.hash,
      serverTime: new Date().toISOString(),
      data: cached.data,
    });
  }

  try {
    // 1. Ambil Activities sesuai RBAC
    const actConditions = [];
    if (user.role === 'PENGURUS') {
      actConditions.push(eq(activities.isPublished, true));
    }

    const actQuery = db
      .select({
        id: activities.id,
        nama: activities.nama,
        categoryId: activities.categoryId,
        categoryName: activityCategories.nama,
        deskripsi: activities.deskripsi,
        mode: activities.mode,
        lokasi: activities.lokasi,
        meetingUrl: activities.meetingUrl,
        isLocked: activities.isLocked,
        startDate: activities.startDate,
        endDate: activities.endDate,
        isPublished: activities.isPublished,
        createdBy: activities.createdBy,
        creatorName: users.namaLengkap,
        createdAt: activities.createdAt,
      })
      .from(activities)
      .innerJoin(users, eq(activities.createdBy, users.id))
      .leftJoin(activityCategories, eq(activities.categoryId, activityCategories.id))
      .orderBy(desc(activities.startDate));

    const actList = actConditions.length > 0
      ? await actQuery.where(and(...actConditions)).all()
      : await actQuery.all();

    // Summary kehadiran per activity
    let activitiesWithSummary = actList.map((a) => ({
      ...a,
      attendanceSummary: { HADIR: 0, IZIN: 0, SAKIT: 0, ALPHA: 0, TELAT: 0, TOTAL: 0 },
    }));

    if (actList.length > 0) {
      const actIds = actList.map((a) => a.id);
      const stats = await db
        .select({
          activityId: attendances.activityId,
          status: attendances.status,
          count: sql<number>`count(*)`.as('count'),
        })
        .from(attendances)
        .where(inArray(attendances.activityId, actIds))
        .groupBy(attendances.activityId, attendances.status)
        .all();

      const summaryMap: Record<string, { HADIR: number; IZIN: number; SAKIT: number; ALPHA: number; TELAT: number; TOTAL: number }> = {};
      for (const s of stats) {
        if (!summaryMap[s.activityId]) {
          summaryMap[s.activityId] = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPHA: 0, TELAT: 0, TOTAL: 0 };
        }
        const cnt = Number(s.count) || 0;
        if (s.status in summaryMap[s.activityId]) {
          summaryMap[s.activityId][s.status as 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPHA' | 'TELAT'] = cnt;
          summaryMap[s.activityId].TOTAL += cnt;
        }
      }

      activitiesWithSummary = actList.map((act) => ({
        ...act,
        attendanceSummary: summaryMap[act.id] || { HADIR: 0, IZIN: 0, SAKIT: 0, ALPHA: 0, TELAT: 0, TOTAL: 0 },
      }));
    }

    // 2. Ambil Permissions sesuai RBAC
    const permQuery = db
      .select({
        id: permissions.id,
        userId: permissions.userId,
        userName: users.namaLengkap,
        userPrn: users.prn,
        userDepartmentId: users.departmentId,
        userDepartmentName: departments.nama,
        activityId: permissions.activityId,
        activityName: activities.nama,
        jenisIzin: permissions.jenisIzin,
        alasan: permissions.alasan,
        evidenceUrl: permissions.evidenceUrl,
        status: permissions.status,
        reviewedBy: permissions.reviewedBy,
        reviewedAt: permissions.reviewedAt,
        createdAt: permissions.createdAt,
      })
      .from(permissions)
      .innerJoin(users, eq(permissions.userId, users.id))
      .innerJoin(departments, eq(users.departmentId, departments.id))
      .innerJoin(activities, eq(permissions.activityId, activities.id))
      .orderBy(desc(permissions.createdAt));

    let permList: any[] = [];
    if (user.role === 'PENGURUS') {
      // PENGURUS: Hanya melihat perizinannya sendiri
      permList = await permQuery.where(eq(permissions.userId, user.id)).all();
    } else if (user.role === 'ADMIN') {
      // ADMIN: HANYA melihat izin dari departemen binaan yang ditugaskan (pj_departments)
      const assignedDepts = user.pjDepartments?.map((pj) => pj.departmentId) || [];
      if (assignedDepts.length > 0) {
        permList = await permQuery.where(inArray(users.departmentId, assignedDepts)).all();
      } else {
        permList = [];
      }
    } else {
      // SUPER_ADMIN & INTI: Akses penuh tanpa filter userId maupun departemen
      permList = await permQuery.all();
    }

    // 3. Ambil Attendances sesuai RBAC
    const attQuery = db
      .select({
        id: attendances.id,
        activityId: attendances.activityId,
        activityName: activities.nama,
        activityDate: activities.startDate,
        userId: attendances.userId,
        userName: users.namaLengkap,
        userPrn: users.prn,
        userDepartmentId: users.departmentId,
        userDepartmentName: departments.nama,
        status: attendances.status,
        recordedBy: attendances.recordedBy,
        recordedAt: attendances.recordedAt,
      })
      .from(attendances)
      .innerJoin(activities, eq(attendances.activityId, activities.id))
      .innerJoin(users, eq(attendances.userId, users.id))
      .innerJoin(departments, eq(users.departmentId, departments.id))
      .orderBy(desc(attendances.recordedAt));

    let attList: any[] = [];
    if (user.role === 'PENGURUS') {
      attList = await attQuery.where(eq(attendances.userId, user.id)).all();
    } else {
      attList = await attQuery.all();
    }

    // 4. Hitung lightweight hash untuk deteksi perubahan
    const actHashStr = activitiesWithSummary.map((a) => `${a.id}:${a.attendanceSummary.TOTAL}:${a.isPublished}`).join('|');
    const permHashStr = permList.map((p) => `${p.id}:${p.status}`).join('|');
    const attHashStr = attList.map((at) => `${at.id}:${at.status}`).join('|');
    const combinedHash = `${actList.length}_${permList.length}_${attList.length}_${actHashStr.length}_${permHashStr}_${attHashStr.slice(0, 80)}`;

    const payloadData = {
      activities: activitiesWithSummary,
      permissions: permList,
      attendances: attList,
    };

    // Simpan ke in-memory micro-cache
    syncMicroCache.set(cacheKey, {
      hash: combinedHash,
      data: payloadData,
      cachedAt: nowMs,
    });

    if (clientHash && clientHash === combinedHash) {
      return c.json({
        success: true,
        changed: false,
        hash: combinedHash,
        serverTime: new Date().toISOString(),
      });
    }

    return c.json({
      success: true,
      changed: true,
      hash: combinedHash,
      serverTime: new Date().toISOString(),
      data: payloadData,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Kesalahan sinkronisasi real-time';
    return c.json({ success: false, message: errorMsg }, 500);
  }
});
