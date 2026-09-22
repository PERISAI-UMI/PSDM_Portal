import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, gte, lte, desc, sql, inArray } from 'drizzle-orm';
import type { AppEnv } from '../types.ts';
import { activities, attendances, users } from '../../db/schema/index.ts';
import { authMiddleware, requireRole } from '../middleware/auth.ts';

export const activitiesRouter = new Hono<AppEnv>();

activitiesRouter.use('*', authMiddleware);

const createActivitySchema = z
  .object({
    nama: z.string().min(3, 'Nama kegiatan minimal 3 karakter'),
    deskripsi: z.string().optional().nullable(),
    mode: z.enum(['OFFLINE', 'ONLINE']).default('OFFLINE'),
    lokasi: z.string().optional().nullable(),
    meetingUrl: z.string().optional().nullable(),
    isLocked: z.boolean().default(false),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    isPublished: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.mode === 'OFFLINE' && (!data.lokasi || data.lokasi.trim().length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: 'Lokasi kegiatan wajib diisi untuk kegiatan offline',
      path: ['lokasi'],
    }
  );

const updateActivitySchema = z.object({
  nama: z.string().min(3).optional(),
  deskripsi: z.string().optional().nullable(),
  mode: z.enum(['OFFLINE', 'ONLINE']).optional(),
  lokasi: z.string().optional().nullable(),
  meetingUrl: z.string().optional().nullable(),
  isLocked: z.boolean().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isPublished: z.boolean().optional(),
});

// GET /api/activities (List Kegiatan / Kalender Proker)
activitiesRouter.get('/', async (c) => {
  const db = c.get('db');
  const user = c.get('user');
  const from = c.req.query('from');
  const to = c.req.query('to');
  const mode = c.req.query('mode');

  const conditions = [];

  // RBAC: Pengurus HANYA bisa melihat kegiatan yang sudah dipublikasikan (isPublished = true)
  if (user.role === 'PENGURUS') {
    conditions.push(eq(activities.isPublished, true));
  }

  if (from) {
    conditions.push(gte(activities.startDate, new Date(from)));
  }
  if (to) {
    conditions.push(lte(activities.endDate, new Date(to)));
  }
  if (mode && (mode === 'OFFLINE' || mode === 'ONLINE')) {
    conditions.push(eq(activities.mode, mode));
  }

  const query = db
    .select({
      id: activities.id,
      nama: activities.nama,
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
    .orderBy(desc(activities.startDate));

  const list = conditions.length > 0 ? await query.where(and(...conditions)).all() : await query.all();

  if (list.length === 0) {
    return c.json({ success: true, data: [] });
  }

  const activityIds = list.map((act) => act.id);
  const stats = await db
    .select({
      activityId: attendances.activityId,
      status: attendances.status,
      count: sql<number>`count(*)`.as('count'),
    })
    .from(attendances)
    .where(inArray(attendances.activityId, activityIds))
    .groupBy(attendances.activityId, attendances.status)
    .all();

  const summaryMap: Record<string, { HADIR: number; IZIN: number; SAKIT: number; ALPHA: number; TELAT: number; TOTAL: number }> = {};
  for (const item of stats) {
    if (!summaryMap[item.activityId]) {
      summaryMap[item.activityId] = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPHA: 0, TELAT: 0, TOTAL: 0 };
    }
    if (item.status in summaryMap[item.activityId]) {
      const cnt = Number(item.count) || 0;
      summaryMap[item.activityId][item.status as 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPHA' | 'TELAT'] = cnt;
      summaryMap[item.activityId].TOTAL += cnt;
    }
  }

  const result = list.map((act) => ({
    ...act,
    attendanceSummary: summaryMap[act.id] || { HADIR: 0, IZIN: 0, SAKIT: 0, ALPHA: 0, TELAT: 0, TOTAL: 0 },
  }));

  return c.json({ success: true, data: result });
});

// GET /api/activities/:id (Detail + Statistik Kehadiran)
activitiesRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');
  const db = c.get('db');

  const activityRecord = await db
    .select({
      id: activities.id,
      nama: activities.nama,
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
    .where(eq(activities.id, id))
    .limit(1);

  if (!activityRecord || activityRecord.length === 0) {
    return c.json({ success: false, message: 'Kegiatan tidak ditemukan' }, 404);
  }

  const activity = activityRecord[0];

  if (user.role === 'PENGURUS' && !activity.isPublished) {
    return c.json({ success: false, message: 'Kegiatan ini belum dipublikasikan' }, 403);
  }

  // Statistik Kehadiran
  const stats = await db
    .select({
      status: attendances.status,
      count: sql<number>`count(*)`.as('count'),
    })
    .from(attendances)
    .where(eq(attendances.activityId, id))
    .groupBy(attendances.status)
    .all();

  const attendanceSummary = {
    HADIR: 0,
    IZIN: 0,
    SAKIT: 0,
    ALPHA: 0,
    TELAT: 0,
    TOTAL: 0,
  };

  for (const item of stats) {
    if (item.status in attendanceSummary) {
      attendanceSummary[item.status as keyof typeof attendanceSummary] = item.count;
      attendanceSummary.TOTAL += item.count;
    }
  }

  return c.json({
    success: true,
    data: {
      ...activity,
      attendanceSummary,
    },
  });
});

// POST /api/activities (SUPER_ADMIN ONLY - Kadep PSDM Kelola Master Kegiatan)
activitiesRouter.post(
  '/',
  requireRole(['SUPER_ADMIN']),
  zValidator('json', createActivitySchema),
  async (c) => {
    const data = c.req.valid('json');
    const user = c.get('user');
    const db = c.get('db');
    const id = crypto.randomUUID();

    await db.insert(activities).values({
      ...data,
      id,
      createdBy: user.id,
      createdAt: new Date(),
    });

    return c.json(
      {
        success: true,
        message: 'Kegiatan berhasil dibuat',
        data: { id, nama: data.nama },
      },
      201
    );
  }
);

// PUT /api/activities/:id (SUPER_ADMIN ONLY)
activitiesRouter.put(
  '/:id',
  requireRole(['SUPER_ADMIN']),
  zValidator('json', updateActivitySchema),
  async (c) => {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    const db = c.get('db');

    await db.update(activities).set(data).where(eq(activities.id, id));

    return c.json({ success: true, message: 'Kegiatan berhasil diperbarui' });
  }
);

// PATCH /api/activities/:id/lock (SUPER_ADMIN ONLY - Kunci Presensi Kegiatan)
activitiesRouter.patch(
  '/:id/lock',
  requireRole(['SUPER_ADMIN']),
  zValidator('json', z.object({ isLocked: z.boolean() })),
  async (c) => {
    const id = c.req.param('id');
    const { isLocked } = c.req.valid('json');
    const db = c.get('db');

    await db.update(activities).set({ isLocked }).where(eq(activities.id, id));

    return c.json({
      success: true,
      message: isLocked
        ? 'Kegiatan berhasil dikunci! Presensi tidak dapat diubah lagi.'
        : 'Kunci kegiatan berhasil dibuka.',
      data: { id, isLocked },
    });
  }
);

// DELETE /api/activities/:id (SUPER_ADMIN ONLY)
activitiesRouter.delete('/:id', requireRole(['SUPER_ADMIN']), async (c) => {
  const id = c.req.param('id');
  const db = c.get('db');

  await db.delete(activities).where(eq(activities.id, id));
  return c.json({ success: true, message: 'Kegiatan berhasil dihapus' });
});
