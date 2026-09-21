import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, gte, lte, desc, sql, inArray } from 'drizzle-orm';
import type { AppEnv } from '../types.ts';
import { activities, attendances, users } from '../../db/schema/index.ts';
import { authMiddleware, requireRole } from '../middleware/auth.ts';

export const activitiesRouter = new Hono<AppEnv>();

activitiesRouter.use('*', authMiddleware);

const createActivitySchema = z.object({
  nama: z.string().min(3, 'Nama kegiatan minimal 3 karakter'),
  deskripsi: z.string().optional().nullable(),
  jenis: z.string().min(2, 'Jenis kegiatan wajib diisi'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isPublished: z.boolean().default(false),
});

const updateActivitySchema = createActivitySchema.partial();

// GET /api/activities (List Kegiatan / Kalender Proker)
activitiesRouter.get('/', async (c) => {
  const db = c.get('db');
  const user = c.get('user');
  const from = c.req.query('from');
  const to = c.req.query('to');
  const jenis = c.req.query('jenis');

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
  if (jenis) {
    conditions.push(eq(activities.jenis, jenis));
  }

  const query = db
    .select({
      id: activities.id,
      nama: activities.nama,
      deskripsi: activities.deskripsi,
      jenis: activities.jenis,
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

  const summaryMap: Record<string, { HADIR: number; IZIN: number; SAKIT: number; ALPHA: number; TOTAL: number }> = {};
  for (const item of stats) {
    if (!summaryMap[item.activityId]) {
      summaryMap[item.activityId] = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPHA: 0, TOTAL: 0 };
    }
    if (item.status in summaryMap[item.activityId]) {
      const cnt = Number(item.count) || 0;
      summaryMap[item.activityId][item.status as 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPHA'] = cnt;
      summaryMap[item.activityId].TOTAL += cnt;
    }
  }

  const result = list.map((act) => ({
    ...act,
    attendanceSummary: summaryMap[act.id] || { HADIR: 0, IZIN: 0, SAKIT: 0, ALPHA: 0, TOTAL: 0 },
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
      jenis: activities.jenis,
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

// DELETE /api/activities/:id (SUPER_ADMIN ONLY)
activitiesRouter.delete('/:id', requireRole(['SUPER_ADMIN']), async (c) => {
  const id = c.req.param('id');
  const db = c.get('db');

  await db.delete(activities).where(eq(activities.id, id));
  return c.json({ success: true, message: 'Kegiatan berhasil dihapus' });
});
