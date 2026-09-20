import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import type { AppEnv } from '../types.ts';
import {
  attendances,
  activities,
  users,
  departments,
  attendanceStatusEnum,
} from '../../db/schema/index.ts';
import { authMiddleware, requireRole } from '../middleware/auth.ts';

export const attendancesRouter = new Hono<AppEnv>();

attendancesRouter.use('*', authMiddleware);

const recordSingleAttendanceSchema = z.object({
  activityId: z.string().min(1, 'Activity ID wajib diisi'),
  userId: z.string().min(1, 'User ID wajib diisi'),
  status: z.enum(attendanceStatusEnum),
});

const recordBatchAttendanceSchema = z.object({
  activityId: z.string().min(1, 'Activity ID wajib diisi'),
  items: z.array(
    z.object({
      userId: z.string().min(1, 'User ID wajib diisi'),
      status: z.enum(attendanceStatusEnum),
    })
  ).min(1, 'Minimal satu entri absensi'),
});

// GET /api/attendances (Riwayat Absensi)
attendancesRouter.get('/', async (c) => {
  const db = c.get('db');
  const user = c.get('user');
  const activityId = c.req.query('activityId');
  const departmentId = c.req.query('departmentId');
  const status = c.req.query('status');

  const conditions = [];

  // RBAC: PENGURUS HANYA BISA MELIHAT RIWAYAT ABSEN SENDIRI
  if (user.role === 'PENGURUS') {
    conditions.push(eq(attendances.userId, user.id));
  } else {
    // SUPER_ADMIN & ADMIN dapat memfilter user tertentu
    const queryUserId = c.req.query('userId');
    if (queryUserId) {
      conditions.push(eq(attendances.userId, queryUserId));
    }
  }

  if (activityId) {
    conditions.push(eq(attendances.activityId, activityId));
  }
  if (departmentId) {
    conditions.push(eq(users.departmentId, departmentId));
  }
  if (status && (attendanceStatusEnum as readonly string[]).includes(status)) {
    conditions.push(eq(attendances.status, status as (typeof attendanceStatusEnum)[number]));
  }

  const query = db
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

  const list = conditions.length > 0 ? await query.where(and(...conditions)).all() : await query.all();

  return c.json({ success: true, data: list });
});

// GET /api/attendances/recap/:activityId (Rekap Lengkap per Kegiatan untuk Operator/Admin)
attendancesRouter.get(
  '/recap/:activityId',
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  async (c) => {
    const activityId = c.req.param('activityId');
    const departmentId = c.req.query('departmentId');
    const db = c.get('db');

    // Ambil seluruh user anggota
    const userQuery = db
      .select({
        userId: users.id,
        namaLengkap: users.namaLengkap,
        prn: users.prn,
        nim: users.nim,
        departmentId: users.departmentId,
        departmentName: departments.nama,
        jabatan: users.jabatan,
        tingkatJabatan: users.tingkatJabatan,
      })
      .from(users)
      .innerJoin(departments, eq(users.departmentId, departments.id));

    const allMembers = departmentId
      ? await userQuery.where(eq(users.departmentId, departmentId)).all()
      : await userQuery.all();

    // Ambil absensi yang sudah tercatat pada kegiatan ini
    const existingAttendances = await db
      .select()
      .from(attendances)
      .where(eq(attendances.activityId, activityId))
      .all();

    const attendanceMap = new Map<string, typeof existingAttendances[0]>();
    for (const att of existingAttendances) {
      attendanceMap.set(att.userId, att);
    }

    const recap = allMembers.map((member) => {
      const recorded = attendanceMap.get(member.userId);
      return {
        ...member,
        attendanceId: recorded?.id || null,
        status: recorded?.status || 'BELUM_ABSEN',
        recordedBy: recorded?.recordedBy || null,
        recordedAt: recorded?.recordedAt || null,
      };
    });

    return c.json({ success: true, data: recap });
  }
);

// POST /api/attendances/record (Pencatatan Absensi oleh Admin / Super Admin)
// TIDAK BISA ABSEN MANDIRI OLEH PENGURUS
attendancesRouter.post(
  '/record',
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  zValidator('json', recordSingleAttendanceSchema),
  async (c) => {
    const { activityId, userId, status } = c.req.valid('json');
    const currentAdmin = c.get('user');
    const db = c.get('db');

    // Cek apakah sudah pernah tercatat
    const existing = await db
      .select({ id: attendances.id })
      .from(attendances)
      .where(and(eq(attendances.activityId, activityId), eq(attendances.userId, userId)))
      .limit(1);

    const now = new Date();

    if (existing && existing.length > 0) {
      await db
        .update(attendances)
        .set({
          status,
          recordedBy: currentAdmin.id,
          recordedAt: now,
        })
        .where(eq(attendances.id, existing[0].id));

      return c.json({
        success: true,
        message: 'Status kehadiran berhasil diperbarui',
        data: { id: existing[0].id, status },
      });
    }

    const newId = crypto.randomUUID();
    await db.insert(attendances).values({
      id: newId,
      activityId,
      userId,
      status,
      recordedBy: currentAdmin.id,
      recordedAt: now,
    });

    return c.json(
      {
        success: true,
        message: 'Status kehadiran berhasil dicatat',
        data: { id: newId, status },
      },
      201
    );
  }
);

// POST /api/attendances/batch (Pencatatan Absensi Massal di Lokasi)
attendancesRouter.post(
  '/batch',
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  zValidator('json', recordBatchAttendanceSchema),
  async (c) => {
    const { activityId, items } = c.req.valid('json');
    const currentAdmin = c.get('user');
    const db = c.get('db');
    const now = new Date();

    for (const item of items) {
      const existing = await db
        .select({ id: attendances.id })
        .from(attendances)
        .where(and(eq(attendances.activityId, activityId), eq(attendances.userId, item.userId)))
        .limit(1);

      if (existing && existing.length > 0) {
        await db
          .update(attendances)
          .set({
            status: item.status,
            recordedBy: currentAdmin.id,
            recordedAt: now,
          })
          .where(eq(attendances.id, existing[0].id));
      } else {
        await db.insert(attendances).values({
          id: crypto.randomUUID(),
          activityId,
          userId: item.userId,
          status: item.status,
          recordedBy: currentAdmin.id,
          recordedAt: now,
        });
      }
    }

    return c.json({
      success: true,
      message: `${items.length} data absensi berhasil disimpan`,
    });
  }
);
