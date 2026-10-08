import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, sql, desc, and } from 'drizzle-orm';
import type { AppEnv } from '../types.ts';
import {
  pointConfigs,
  activityCategories,
  attendances,
  activities,
  users,
  departments,
  type AttendanceStatus,
} from '../../db/schema/index.ts';
import { authMiddleware, requireRole } from '../middleware/auth.ts';
import { updatePointConfigSchema } from '../../db/validation.ts';
import { invalidateSyncCache } from './sync.ts';

export const pointsRouter = new Hono<AppEnv>();

pointsRouter.use('*', authMiddleware);

export async function getPointWeightsForActivity(
  db: any,
  activityId: string
): Promise<{
  hadirPoints: number;
  izinPoints: number;
  sakitPoints: number;
  alphaPoints: number;
  telatPoints: number;
}> {
  try {
    const act = await db
      .select({
        hadirPoints: activityCategories.hadirPoints,
        izinPoints: activityCategories.izinPoints,
        sakitPoints: activityCategories.sakitPoints,
        alphaPoints: activityCategories.alphaPoints,
        telatPoints: activityCategories.telatPoints,
      })
      .from(activities)
      .leftJoin(activityCategories, eq(activities.categoryId, activityCategories.id))
      .where(eq(activities.id, activityId))
      .limit(1);

    if (act.length > 0 && act[0] && act[0].hadirPoints !== null && act[0].hadirPoints !== undefined) {
      return {
        hadirPoints: Number(act[0].hadirPoints),
        izinPoints: Number(act[0].izinPoints),
        sakitPoints: Number(act[0].sakitPoints),
        alphaPoints: Number(act[0].alphaPoints),
        telatPoints: Number(act[0].telatPoints),
      };
    }
  } catch (err) {
    console.warn('Gagal memuat point weights per kategori kegiatan:', err);
  }

  // Fallback default Lingkup Internal (hadir: 3, izin: 0, sakit: 0, alpha: -5, telat: -1)
  return {
    hadirPoints: 3,
    izinPoints: 0,
    sakitPoints: 0,
    alphaPoints: -5,
    telatPoints: -1,
  };
}

// Cache in-memory micro-cache per isolate worker (TTL 60s)
let cachedConfig: {
  hadirPoints: number;
  izinPoints: number;
  sakitPoints: number;
  alphaPoints: number;
  telatPoints: number;
} | null = null;
let cacheExpireAt = 0;

export function invalidatePointConfigCache() {
  cachedConfig = null;
  cacheExpireAt = 0;
}

export async function getActivePointWeights(db: any): Promise<{
  hadirPoints: number;
  izinPoints: number;
  sakitPoints: number;
  alphaPoints: number;
  telatPoints: number;
}> {
  const now = Date.now();
  if (cachedConfig && now < cacheExpireAt) {
    return cachedConfig;
  }

  try {
    const records = await db
      .select({
        hadirPoints: pointConfigs.hadirPoints,
        izinPoints: pointConfigs.izinPoints,
        sakitPoints: pointConfigs.sakitPoints,
        alphaPoints: pointConfigs.alphaPoints,
        telatPoints: pointConfigs.telatPoints,
      })
      .from(pointConfigs)
      .where(eq(pointConfigs.id, 'default_config'))
      .limit(1);

    if (records.length > 0 && records[0]) {
      const config = {
        hadirPoints: Number(records[0].hadirPoints),
        izinPoints: Number(records[0].izinPoints),
        sakitPoints: Number(records[0].sakitPoints),
        alphaPoints: Number(records[0].alphaPoints),
        telatPoints: Number(records[0].telatPoints),
      };
      cachedConfig = config;
      cacheExpireAt = now + 60000;
      return config;
    }
  } catch (err) {
    // Fallback jika tabel belum termigrasi di environment tertentu
    console.warn('Gagal memuat point_configs dari DB, menggunakan fallback:', err);
  }

  const fallback = {
    hadirPoints: 10,
    izinPoints: 3,
    sakitPoints: 3,
    alphaPoints: -10,
    telatPoints: 5,
  };
  cachedConfig = fallback;
  cacheExpireAt = now + 10000;
  return fallback;
}

export function calculatePointsForStatus(
  status: AttendanceStatus,
  weights: {
    hadirPoints: number;
    izinPoints: number;
    sakitPoints: number;
    alphaPoints: number;
    telatPoints: number;
  }
): number {
  switch (status) {
    case 'HADIR':
      return weights.hadirPoints;
    case 'IZIN':
      return weights.izinPoints;
    case 'SAKIT':
      return weights.sakitPoints;
    case 'ALPHA':
      return weights.alphaPoints;
    case 'TELAT':
      return weights.telatPoints;
    default:
      return 0;
  }
}

// GET /api/points/config (Ambil Bobot Poin Aktif - Semua Role)
pointsRouter.get('/config', async (c) => {
  const db = c.get('db');
  const weights = await getActivePointWeights(db);
  return c.json({
    success: true,
    data: weights,
  });
});

// PUT /api/points/config (Update Bobot Poin - SUPER_ADMIN ONLY)
pointsRouter.put(
  '/config',
  requireRole(['SUPER_ADMIN']),
  zValidator('json', updatePointConfigSchema),
  async (c) => {
    const data = c.req.valid('json');
    const currentAdmin = c.get('user');
    const db = c.get('db');
    const now = new Date();

    await db
      .insert(pointConfigs)
      .values({
        id: 'default_config',
        ...data,
        updatedBy: currentAdmin.id,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: pointConfigs.id,
        set: {
          ...data,
          updatedBy: currentAdmin.id,
          updatedAt: now,
        },
      });

    invalidatePointConfigCache();
    invalidateSyncCache();

    return c.json({
      success: true,
      message: 'Bobot konfigurasi poin berhasil diperbarui',
      data,
    });
  }
);

// GET /api/points/leaderboard (Klasemen Poin Anggota - SUPER_ADMIN, ADMIN, INTI)
pointsRouter.get(
  '/leaderboard',
  requireRole(['SUPER_ADMIN', 'ADMIN', 'INTI']),
  async (c) => {
    const db = c.get('db');
    const departmentId = c.req.query('departmentId');
    const generasiQuery = c.req.query('generasi');
    const limitQuery = c.req.query('limit');
    const limit = limitQuery ? Math.max(1, Math.min(200, parseInt(limitQuery, 10))) : 100;

    try {
      // Ambil rekap agregasi per user aktif
      const baseQuery = db
        .select({
          userId: users.id,
          namaLengkap: users.namaLengkap,
          prn: users.prn,
          nim: users.nim,
          avatarUrl: users.avatarUrl,
          generasi: users.generasi,
          departmentId: users.departmentId,
          departmentName: departments.nama,
          jabatan: users.jabatan,
          totalPoints: sql<number>`COALESCE(SUM(${attendances.awardedPoints}), 0)`,
          hadirCount: sql<number>`COALESCE(SUM(CASE WHEN ${attendances.status} = 'HADIR' THEN 1 ELSE 0 END), 0)`,
          izinCount: sql<number>`COALESCE(SUM(CASE WHEN ${attendances.status} = 'IZIN' THEN 1 ELSE 0 END), 0)`,
          sakitCount: sql<number>`COALESCE(SUM(CASE WHEN ${attendances.status} = 'SAKIT' THEN 1 ELSE 0 END), 0)`,
          alphaCount: sql<number>`COALESCE(SUM(CASE WHEN ${attendances.status} = 'ALPHA' THEN 1 ELSE 0 END), 0)`,
          telatCount: sql<number>`COALESCE(SUM(CASE WHEN ${attendances.status} = 'TELAT' THEN 1 ELSE 0 END), 0)`,
          totalActivities: sql<number>`COALESCE(COUNT(${attendances.id}), 0)`,
        })
        .from(users)
        .leftJoin(departments, eq(users.departmentId, departments.id))
        .leftJoin(attendances, eq(users.id, attendances.userId))
        .where(eq(users.isActive, true))
        .groupBy(users.id)
        .orderBy(desc(sql`COALESCE(SUM(${attendances.awardedPoints}), 0)`), desc(users.namaLengkap))
        .limit(limit);

      const rows = await baseQuery.all();

      // Saring jika ada filter query params
      let filtered = rows;
      if (departmentId) {
        filtered = filtered.filter((r: any) => r.departmentId === departmentId);
      }
      if (generasiQuery) {
        const genNum = parseInt(generasiQuery, 10);
        if (!isNaN(genNum)) {
          filtered = filtered.filter((r: any) => r.generasi === genNum);
        }
      }

      // Berikan peringkat (Rank)
      const rankedData = filtered.map((row: any, index: number) => ({
        ...row,
        rank: index + 1,
        totalPoints: Number(row.totalPoints || 0),
        hadirCount: Number(row.hadirCount || 0),
        izinCount: Number(row.izinCount || 0),
        sakitCount: Number(row.sakitCount || 0),
        alphaCount: Number(row.alphaCount || 0),
        telatCount: Number(row.telatCount || 0),
        totalActivities: Number(row.totalActivities || 0),
      }));

      return c.json({
        success: true,
        data: rankedData,
      });
    } catch (err: any) {
      console.error('Error fetching points leaderboard:', err);
      return c.json({ success: false, message: 'Gagal memuat data klasemen poin' }, 500);
    }
  }
);

// GET /api/points/history/:userId (Buku Besar/Riwayat Perolehan Poin Per Anggota - SUPER_ADMIN & ADMIN ONLY)
pointsRouter.get(
  '/history/:userId',
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  async (c) => {
    const db = c.get('db');
    const targetUserId = c.req.param('userId');

  try {
    const historyRows = await db
      .select({
        id: attendances.id,
        activityId: attendances.activityId,
        activityName: activities.nama,
        activityDate: activities.startDate,
        status: attendances.status,
        awardedPoints: attendances.awardedPoints,
        recordedAt: attendances.recordedAt,
      })
      .from(attendances)
      .innerJoin(activities, eq(attendances.activityId, activities.id))
      .where(eq(attendances.userId, targetUserId))
      .orderBy(desc(activities.startDate), desc(attendances.recordedAt))
      .all();

    const totalPoints = historyRows.reduce((sum: number, r: any) => sum + (r.awardedPoints || 0), 0);

    return c.json({
      success: true,
      data: {
        userId: targetUserId,
        totalPoints,
        history: historyRows,
      },
    });
  } catch (err: any) {
    console.error('Error fetching points history:', err);
    return c.json({ success: false, message: 'Gagal memuat riwayat poin anggota' }, 500);
  }
});
