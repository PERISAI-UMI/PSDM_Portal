import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc, inArray } from 'drizzle-orm';
import type { AppEnv } from '../types.ts';
import {
  permissions,
  activities,
  users,
  departments,
  attendances,
  permissionStatusEnum,
} from '../../db/schema/index.ts';
import { authMiddleware, requireRole } from '../middleware/auth.ts';
import { createPresignedUploadUrl } from '../storage.ts';

export const permissionsRouter = new Hono<AppEnv>();

permissionsRouter.use('*', authMiddleware);

const requestPermissionSchema = z.object({
  activityId: z.string().min(1, 'Kegiatan wajib dipilih'),
  jenisIzin: z.string().min(2, 'Jenis izin wajib diisi (e.g. SAKIT, TUGAS_AKADEMIK, KELUARGA)'),
  alasan: z.string().min(5, 'Alasan izin minimal 5 karakter'),
  evidenceUrl: z.string().url('URL bukti izin tidak valid').optional().nullable(),
});

const reviewPermissionSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

const getUploadUrlSchema = z.object({
  fileName: z.string().min(1, 'Nama file wajib diisi'),
  contentType: z.string().min(1, 'Tipe konten file wajib diisi'),
});

// POST /api/permissions/presigned-url (Generate URL Upload S3 / Backblaze B2)
permissionsRouter.post('/presigned-url', zValidator('json', getUploadUrlSchema), async (c) => {
  const { fileName, contentType } = c.req.valid('json');

  const keyId = c.env?.B2_APPLICATION_KEY_ID || process.env.B2_APPLICATION_KEY_ID || 'mock_key_id';
  const appKey = c.env?.B2_APPLICATION_KEY || process.env.B2_APPLICATION_KEY || 'mock_app_key';
  const bucket = c.env?.B2_BUCKET_NAME || process.env.B2_BUCKET_NAME || 'psdm-evidence';
  const endpoint = c.env?.B2_ENDPOINT || process.env.B2_ENDPOINT;
  const region = c.env?.B2_REGION || process.env.B2_REGION || 'us-east-005';

  const presigned = await createPresignedUploadUrl(
    {
      keyId,
      applicationKey: appKey,
      bucketName: bucket,
      endpoint,
      region,
    },
    fileName,
    contentType
  );

  return c.json({
    success: true,
    data: presigned,
  });
});

// GET /api/permissions (List Perizinan dengan RBAC Bertingkat)
permissionsRouter.get('/', async (c) => {
  const db = c.get('db');
  const user = c.get('user');
  const status = c.req.query('status');
  const activityId = c.req.query('activityId');

  const baseQuery = db
    .select({
      id: permissions.id,
      userId: permissions.userId,
      userName: users.namaLengkap,
      userPrn: users.prn,
      userDepartmentId: users.departmentId,
      userDepartmentName: departments.nama,
      activityId: permissions.activityId,
      activityName: activities.nama,
      activityDate: activities.startDate,
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
    .innerJoin(activities, eq(permissions.activityId, activities.id));

  const conditions = [];

  if (activityId) {
    conditions.push(eq(permissions.activityId, activityId));
  }
  if (status && (permissionStatusEnum as readonly string[]).includes(status)) {
    conditions.push(eq(permissions.status, status as (typeof permissionStatusEnum)[number]));
  }

  // 1. PENGURUS: Hanya melihat perizinannya sendiri
  if (user.role === 'PENGURUS') {
    conditions.push(eq(permissions.userId, user.id));
    const list = conditions.length > 0 ? await baseQuery.where(and(...conditions)).orderBy(desc(permissions.createdAt)).all() : await baseQuery.all();
    return c.json({ success: true, data: list });
  }

  // 2. ADMIN (Staf PSDM): HANYA melihat izin pengurus dari departemen binaan yang ditugaskan (pj_departments)
  if (user.role === 'ADMIN') {
    const assignedDepts = user.pjDepartments?.map((pj) => pj.departmentId) || [];
    if (assignedDepts.length === 0) {
      return c.json({ success: true, data: [] });
    }

    conditions.push(inArray(users.departmentId, assignedDepts));
    const list = await baseQuery.where(and(...conditions)).orderBy(desc(permissions.createdAt)).all();
    return c.json({ success: true, data: list });
  }

  // 3. SUPER_ADMIN: Akses mutlak semua perizinan
  const list = conditions.length > 0 ? await baseQuery.where(and(...conditions)).orderBy(desc(permissions.createdAt)).all() : await baseQuery.orderBy(desc(permissions.createdAt)).all();
  return c.json({ success: true, data: list });
});

// POST /api/permissions (Pengajuan Izin oleh Pengurus / Anggota)
permissionsRouter.post('/', zValidator('json', requestPermissionSchema), async (c) => {
  const { activityId, jenisIzin, alasan, evidenceUrl } = c.req.valid('json');
  const user = c.get('user');
  const db = c.get('db');

  // Pastikan kegiatan aktif/terdaftar
  const act = await db.select().from(activities).where(eq(activities.id, activityId)).limit(1);
  if (!act || act.length === 0) {
    return c.json({ success: false, message: 'Kegiatan tidak ditemukan' }, 404);
  }

  // Cek apakah sudah pernah mengajukan izin untuk kegiatan ini
  const existing = await db
    .select({ id: permissions.id })
    .from(permissions)
    .where(and(eq(permissions.activityId, activityId), eq(permissions.userId, user.id)))
    .limit(1);

  if (existing && existing.length > 0) {
    return c.json({ success: false, message: 'Anda sudah pernah mengajukan izin untuk kegiatan ini' }, 400);
  }

  const id = crypto.randomUUID();
  await db.insert(permissions).values({
    id,
    userId: user.id,
    activityId,
    jenisIzin,
    alasan,
    evidenceUrl: evidenceUrl || null,
    status: 'PENDING',
    createdAt: new Date(),
  });

  return c.json(
    {
      success: true,
      message: 'Pengajuan izin berhasil dikirim dan menunggu persetujuan',
      data: { id },
    },
    201
  );
});

// PATCH /api/permissions/:id/review (ACC / Tolak Izin oleh Super Admin atau Admin PJ Departemen)
permissionsRouter.patch(
  '/:id/review',
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  zValidator('json', reviewPermissionSchema),
  async (c) => {
    const id = c.req.param('id');
    const { status } = c.req.valid('json');
    const reviewer = c.get('user');
    const db = c.get('db');

    // Dapatkan data izin dan departemen pemohon
    const permQuery = await db
      .select({
        permissionId: permissions.id,
        userId: permissions.userId,
        activityId: permissions.activityId,
        jenisIzin: permissions.jenisIzin,
        userDepartmentId: users.departmentId,
      })
      .from(permissions)
      .innerJoin(users, eq(permissions.userId, users.id))
      .where(eq(permissions.id, id))
      .limit(1);

    if (!permQuery || permQuery.length === 0) {
      return c.json({ success: false, message: 'Data perizinan tidak ditemukan' }, 404);
    }

    const perm = permQuery[0];

    // Verifikasi RBAC ADMIN: HANYA bisa ACC/Tolak izin milik pengurus dari departemen binaan
    if (reviewer.role === 'ADMIN') {
      const isAssigned = reviewer.pjDepartments?.some(
        (pj) => pj.departmentId === perm.userDepartmentId
      );

      if (!isAssigned) {
        return c.json(
          {
            success: false,
            message: 'Forbidden: Anda tidak ditugaskan sebagai PJ Departemen dari anggota ini',
          },
          403
        );
      }
    }

    const now = new Date();

    // Update status izin
    await db
      .update(permissions)
      .set({
        status,
        reviewedBy: reviewer.id,
        reviewedAt: now,
      })
      .where(eq(permissions.id, id));

    // Sinkronisasi status absensi jika izin disetujui (APPROVED)
    if (status === 'APPROVED') {
      const attendanceStatus = perm.jenisIzin.toUpperCase().includes('SAKIT') ? 'SAKIT' : 'IZIN';

      const existingAtt = await db
        .select({ id: attendances.id })
        .from(attendances)
        .where(and(eq(attendances.activityId, perm.activityId), eq(attendances.userId, perm.userId)))
        .limit(1);

      if (existingAtt && existingAtt.length > 0) {
        await db
          .update(attendances)
          .set({
            status: attendanceStatus,
            recordedBy: reviewer.id,
            recordedAt: now,
          })
          .where(eq(attendances.id, existingAtt[0].id));
      } else {
        await db.insert(attendances).values({
          id: crypto.randomUUID(),
          activityId: perm.activityId,
          userId: perm.userId,
          status: attendanceStatus,
          recordedBy: reviewer.id,
          recordedAt: now,
        });
      }
    }

    return c.json({
      success: true,
      message: `Status izin berhasil diperbarui menjadi ${status}`,
    });
  }
);
