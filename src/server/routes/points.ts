import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, sql, desc, and, gte, lte } from 'drizzle-orm';
import * as XLSX from 'xlsx';
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

// POST /api/points/recalculate (SUPER_ADMIN ONLY - Sinkronisasi Ulang Poin Seluruh Presensi)
pointsRouter.post(
  '/recalculate',
  requireRole(['SUPER_ADMIN']),
  async (c) => {
    const db = c.get('db');
    try {
      await db.run(sql`
        UPDATE attendances
        SET awarded_points = (
          SELECT CASE attendances.status
            WHEN 'HADIR' THEN COALESCE(ac.hadir_points, 3)
            WHEN 'IZIN' THEN COALESCE(ac.izin_points, 0)
            WHEN 'SAKIT' THEN COALESCE(ac.sakit_points, 0)
            WHEN 'ALPHA' THEN COALESCE(ac.alpha_points, -5)
            WHEN 'TELAT' THEN COALESCE(ac.telat_points, -1)
            ELSE 0
          END
          FROM activities a
          LEFT JOIN activity_categories ac ON a.category_id = ac.id
          WHERE a.id = attendances.activity_id
        )
        WHERE EXISTS (
          SELECT 1 FROM activities a WHERE a.id = attendances.activity_id
        );
      `);

      invalidateSyncCache();

      return c.json({
        success: true,
        message: 'Seluruh poin riwayat presensi berhasil disesuaikan ulang berdasarkan kategori kegiatan!',
      });
    } catch (err: any) {
      return c.json(
        {
          success: false,
          message: err?.message || 'Gagal melakukan kalkulasi ulang poin',
        },
        500
      );
    }
  }
);

// GET /api/points/leaderboard (Monitoring Poin Anggota - SUPER_ADMIN, ADMIN, INTI)
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
      return c.json({ success: false, message: 'Gagal memuat data poin anggota' }, 500);
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

// ============================================================================
// SUPER ADMIN POINTS LOG (BUKU BESAR POIN)
// ============================================================================

// GET /api/points/log (Lihat & Filter Buku Besar Poin Organisasi)
pointsRouter.get(
  '/log',
  requireRole(['SUPER_ADMIN']),
  async (c) => {
    const db = c.get('db');
    const startDateParam = c.req.query('startDate');
    const endDateParam = c.req.query('endDate');

    try {
      const conditions = [];

      if (startDateParam) {
        const start = new Date(startDateParam.includes('T') ? startDateParam : `${startDateParam}T00:00:00.000Z`);
        if (!isNaN(start.getTime())) {
          conditions.push(gte(activities.startDate, start));
        }
      }

      if (endDateParam) {
        const end = new Date(endDateParam.includes('T') ? endDateParam : `${endDateParam}T23:59:59.999Z`);
        if (!isNaN(end.getTime())) {
          conditions.push(lte(activities.startDate, end));
        }
      }

      const query = db
        .select({
          id: attendances.id,
          activityId: attendances.activityId,
          activityName: activities.nama,
          activityDate: activities.startDate,
          userId: attendances.userId,
          namaLengkap: users.namaLengkap,
          prn: users.prn,
          status: attendances.status,
          awardedPoints: attendances.awardedPoints,
          recordedAt: attendances.recordedAt,
        })
        .from(attendances)
        .innerJoin(activities, eq(attendances.activityId, activities.id))
        .innerJoin(users, eq(attendances.userId, users.id))
        .orderBy(desc(activities.startDate), desc(attendances.recordedAt));

      const rows = conditions.length > 0 ? await query.where(and(...conditions)).all() : await query.all();

      const formatStatusTitle = (st: string) => {
        switch (st?.toUpperCase()) {
          case 'HADIR': return 'Hadir';
          case 'IZIN': return 'Izin';
          case 'SAKIT': return 'Sakit';
          case 'ALPHA': return 'Alpha';
          case 'TELAT': return 'Telat';
          default: return st || 'Hadir';
        }
      };

      const logData = rows.map((r: any) => {
        const pts = Number(r.awardedPoints || 0);
        const jenis = pts < 0 ? 'Punishment' : 'Reward';
        const nominal = Math.abs(pts);
        const dateObj = new Date(r.activityDate);
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        const tanggal = `${y}-${m}-${d}`;
        const keterangan = `${formatStatusTitle(r.status)} Pada Kegiatan ${r.activityName}`;

        return {
          id: r.id,
          tanggal,
          nama: r.namaLengkap,
          prn: r.prn,
          jenis,
          nominal,
          keterangan,
          status: r.status,
          activityName: r.activityName,
          awardedPoints: pts,
          activityDate: r.activityDate,
        };
      });

      return c.json({
        success: true,
        data: logData,
      });
    } catch (err: any) {
      console.error('Error fetching points log:', err);
      return c.json({ success: false, message: 'Gagal memuat buku besar poin' }, 500);
    }
  }
);

// POST /api/points/import-log (Impor Buku Besar Poin dari Excel/CSV - Match strictly nama_lengkap)
pointsRouter.post(
  '/import-log',
  requireRole(['SUPER_ADMIN']),
  async (c) => {
    const db = c.get('db');
    const currentUser = c.get('user');

    try {
      const body = await c.req.parseBody();
      const file = body['file'];

      if (!file || !(file instanceof File)) {
        return c.json({ success: false, message: 'Berkas file (.xlsx, .xls, .csv) tidak ditemukan' }, 400);
      }

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        return c.json({ success: false, message: 'Lembar kerja (sheet) kosong' }, 400);
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

      if (rawRows.length === 0) {
        return c.json({ success: false, message: 'Tidak ada baris data dalam berkas yang diunggah' }, 400);
      }

      // Ambil seluruh users untuk exact match nama_lengkap
      const allUsers = await db
        .select({
          id: users.id,
          namaLengkap: users.namaLengkap,
          prn: users.prn,
        })
        .from(users)
        .all();

      const userMap = new Map<string, typeof allUsers[0]>();
      for (const u of allUsers) {
        userMap.set(u.namaLengkap.trim().toLowerCase(), u);
      }

      // Ambil seluruh activities dan categories
      const allActivities = await db.select().from(activities).all();
      const allCategories = await db.select().from(activityCategories).all();
      const defaultCategory = allCategories.find((cat: any) => cat.nama.includes('Internal')) || allCategories[0];

      let importedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      const errors: { row: number; nama?: string; reason: string }[] = [];

      for (let i = 0; i < rawRows.length; i++) {
        const row = rawRows[i];
        const rowNum = i + 2; // Row number in Excel

        // Cari nama lengkap
        const rawNama = String(
          row['NAMA'] ||
          row['Nama'] ||
          row['Nama Lengkap'] ||
          row['NAMA LENGKAP'] ||
          row['Name'] ||
          row['nama'] ||
          ''
        ).trim();

        if (!rawNama) {
          skippedCount++;
          errors.push({ row: rowNum, reason: 'Kolom Nama kosong' });
          continue;
        }

        // Strict matching by nama_lengkap
        const matchedUser = userMap.get(rawNama.toLowerCase());
        if (!matchedUser) {
          skippedCount++;
          errors.push({
            row: rowNum,
            nama: rawNama,
            reason: `Pengurus "${rawNama}" tidak ditemukan dalam database`,
          });
          continue;
        }

        // Ekstraksi Status & Nama Kegiatan
        const rawKeterangan = String(
          row['KETERANGAN'] ||
          row['Keterangan'] ||
          row['Description'] ||
          row['keterangan'] ||
          ''
        ).trim();

        const explicitStatus = String(
          row['STATUS'] ||
          row['Status'] ||
          row['Status Presensi'] ||
          row['Absensi'] ||
          ''
        ).trim().toUpperCase();

        const explicitActivity = String(
          row['KEGIATAN'] ||
          row['Kegiatan'] ||
          row['Activity'] ||
          row['Nama Kegiatan'] ||
          ''
        ).trim();

        const explicitJenis = String(row['JENIS'] || row['Jenis'] || '').trim();

        let parsedStatus: AttendanceStatus = 'HADIR';
        let parsedActivityName = 'Kegiatan Organisasi';

        // Format SOP: "${Status} Pada Kegiatan ${ActivityName}"
        const match = rawKeterangan.match(/^(Hadir|Izin|Sakit|Alpha|Telat)\s+Pada\s+Kegiatan\s+(.+)$/i);
        if (match) {
          const matchedSt = match[1].toUpperCase();
          if (['HADIR', 'IZIN', 'SAKIT', 'ALPHA', 'TELAT'].includes(matchedSt)) {
            parsedStatus = matchedSt as AttendanceStatus;
          }
          parsedActivityName = match[2].trim();
        } else {
          // Fallback parsing
          if (['HADIR', 'IZIN', 'SAKIT', 'ALPHA', 'TELAT'].includes(explicitStatus)) {
            parsedStatus = explicitStatus as AttendanceStatus;
          } else if (explicitStatus === 'ALPA') {
            parsedStatus = 'ALPHA';
          } else if (explicitJenis.toLowerCase() === 'punishment') {
            parsedStatus = 'ALPHA';
          }

          if (explicitActivity) {
            parsedActivityName = explicitActivity;
          } else if (rawKeterangan) {
            parsedActivityName = rawKeterangan;
          }
        }

        // Parse tanggal
        const rawTanggal = row['TANGGAL'] || row['Tanggal'] || row['Date'] || row['tanggal'];
        let activityDate = new Date();
        if (rawTanggal) {
          if (typeof rawTanggal === 'number') {
            // Excel serial date format
            activityDate = new Date((rawTanggal - 25569) * 86400 * 1000);
          } else {
            const parsedD = new Date(rawTanggal);
            if (!isNaN(parsedD.getTime())) {
              activityDate = parsedD;
            }
          }
        }

        // Cari atau buat kegiatan
        let targetAct = allActivities.find(
          (a: any) => a.nama.trim().toLowerCase() === parsedActivityName.toLowerCase()
        );

        if (!targetAct) {
          const newActId = crypto.randomUUID();
          const newActData = {
            id: newActId,
            nama: parsedActivityName,
            categoryId: defaultCategory ? defaultCategory.id : 'default',
            mode: 'OFFLINE' as const,
            isLocked: false,
            isPublished: true,
            startDate: activityDate,
            endDate: activityDate,
            createdBy: currentUser.id,
            createdAt: new Date(),
          };
          await db.insert(activities).values(newActData);
          targetAct = newActData as any;
          allActivities.push(targetAct);
        }

        // Hitung bobot poin berdasarkan kategori kegiatan
        const weights = await getPointWeightsForActivity(db, targetAct.id);
        const awardedPoints = calculatePointsForStatus(parsedStatus, weights);

        // Cek apakah presensi sudah ada
        const existingAtt = await db
          .select()
          .from(attendances)
          .where(and(eq(attendances.activityId, targetAct.id), eq(attendances.userId, matchedUser.id)))
          .limit(1);

        if (existingAtt.length > 0) {
          await db
            .update(attendances)
            .set({
              status: parsedStatus,
              awardedPoints,
              recordedBy: currentUser.id,
              recordedAt: new Date(),
            })
            .where(eq(attendances.id, existingAtt[0].id));
          updatedCount++;
        } else {
          await db.insert(attendances).values({
            id: crypto.randomUUID(),
            activityId: targetAct.id,
            userId: matchedUser.id,
            status: parsedStatus,
            awardedPoints,
            recordedBy: currentUser.id,
            recordedAt: new Date(),
          });
          importedCount++;
        }
      }

      invalidateSyncCache();

      return c.json({
        success: true,
        message: `Import selesai: ${importedCount} data baru, ${updatedCount} diperbarui${
          skippedCount > 0 ? `, ${skippedCount} dilewati` : ''
        }`,
        data: {
          importedCount,
          updatedCount,
          skippedCount,
          errors,
        },
      });
    } catch (err: any) {
      console.error('Error importing points log:', err);
      return c.json({ success: false, message: err?.message || 'Gagal mengimpor buku besar poin' }, 500);
    }
  }
);
