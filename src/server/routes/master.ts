import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, inArray } from 'drizzle-orm';
import type { AppEnv } from '../types.ts';
import {
  fakultas,
  programStudi,
  departments,
  pjDepartments,
  users,
} from '../../db/schema/index.ts';
import { authMiddleware, requireRole } from '../middleware/auth.ts';

export const masterRouter = new Hono<AppEnv>();

// Seluruh endpoint master mewajibkan sesi aktif
masterRouter.use('*', authMiddleware);

// ==================== FAKULTAS ====================

const createFakultasSchema = z.object({
  nama: z.string().min(2, 'Nama fakultas minimal 2 karakter'),
});

masterRouter.get('/fakultas', async (c) => {
  const db = c.get('db');
  const data = await db.select().from(fakultas).all();
  return c.json({ success: true, data });
});

masterRouter.post(
  '/fakultas',
  requireRole(['SUPER_ADMIN']),
  zValidator('json', createFakultasSchema),
  async (c) => {
    const { nama } = c.req.valid('json');
    const db = c.get('db');
    const id = crypto.randomUUID();

    await db.insert(fakultas).values({ id, nama });
    return c.json({ success: true, message: 'Fakultas berhasil ditambahkan', data: { id, nama } }, 201);
  }
);

masterRouter.put(
  '/fakultas/:id',
  requireRole(['SUPER_ADMIN']),
  zValidator('json', createFakultasSchema),
  async (c) => {
    const id = c.req.param('id');
    const { nama } = c.req.valid('json');
    const db = c.get('db');

    await db.update(fakultas).set({ nama }).where(eq(fakultas.id, id));
    return c.json({ success: true, message: 'Fakultas berhasil diperbarui' });
  }
);

masterRouter.delete('/fakultas/:id', requireRole(['SUPER_ADMIN']), async (c) => {
  const id = c.req.param('id');
  const db = c.get('db');

  // Cek apakah ada prodi di bawah fakultas ini yang digunakan oleh anggota
  const prodis = await db.select({ id: programStudi.id }).from(programStudi).where(eq(programStudi.fakultasId, id)).all();
  const prodiIds = prodis.map((p) => p.id);
  
  if (prodiIds.length > 0) {
    const assignedUser = await db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.programStudiId, prodiIds))
      .limit(1);

    if (assignedUser.length > 0) {
      return c.json(
        {
          success: false,
          message: 'Fakultas tidak dapat dihapus karena terdapat program studi yang masih digunakan oleh anggota.',
        },
        400
      );
    }
    // Hapus seluruh program studi terkait dalam 1 query atomik tanpa loop
    await db.delete(programStudi).where(eq(programStudi.fakultasId, id));
  }

  await db.delete(fakultas).where(eq(fakultas.id, id));
  return c.json({ success: true, message: 'Fakultas berhasil dihapus' });
});

// ==================== PROGRAM STUDI ====================

const createProdiSchema = z.object({
  fakultasId: z.string().min(1, 'Fakultas wajib dipilih'),
  nama: z.string().min(2, 'Nama program studi minimal 2 karakter'),
});

masterRouter.get('/program-studi', async (c) => {
  const db = c.get('db');
  const fakultasId = c.req.query('fakultasId');

  const query = db.select().from(programStudi);
  const data = fakultasId
    ? await query.where(eq(programStudi.fakultasId, fakultasId)).all()
    : await query.all();

  return c.json({ success: true, data });
});

masterRouter.post(
  '/program-studi',
  requireRole(['SUPER_ADMIN']),
  zValidator('json', createProdiSchema),
  async (c) => {
    const { fakultasId, nama } = c.req.valid('json');
    const db = c.get('db');
    const id = crypto.randomUUID();

    await db.insert(programStudi).values({ id, fakultasId, nama });
    return c.json({ success: true, message: 'Program studi berhasil ditambahkan', data: { id, fakultasId, nama } }, 201);
  }
);

masterRouter.put(
  '/program-studi/:id',
  requireRole(['SUPER_ADMIN']),
  zValidator('json', createProdiSchema),
  async (c) => {
    const id = c.req.param('id');
    const { fakultasId, nama } = c.req.valid('json');
    const db = c.get('db');

    await db.update(programStudi).set({ fakultasId, nama }).where(eq(programStudi.id, id));
    return c.json({ success: true, message: 'Program studi berhasil diperbarui' });
  }
);

masterRouter.delete('/program-studi/:id', requireRole(['SUPER_ADMIN']), async (c) => {
  const id = c.req.param('id');
  const db = c.get('db');

  const assignedUsers = await db.select().from(users).where(eq(users.programStudiId, id)).limit(1);
  if (assignedUsers.length > 0) {
    return c.json(
      {
        success: false,
        message: 'Program studi tidak dapat dihapus karena masih digunakan oleh anggota pengurus.',
      },
      400
    );
  }

  await db.delete(programStudi).where(eq(programStudi.id, id));
  return c.json({ success: true, message: 'Program studi berhasil dihapus' });
});

// ==================== DEPARTMENTS ====================

const createDepartmentSchema = z.object({
  nama: z.string().min(2, 'Nama departemen minimal 2 karakter'),
});

masterRouter.get('/departments', async (c) => {
  const db = c.get('db');
  const data = await db.select().from(departments).all();
  return c.json({ success: true, data });
});

masterRouter.post(
  '/departments',
  requireRole(['SUPER_ADMIN']),
  zValidator('json', createDepartmentSchema),
  async (c) => {
    const { nama } = c.req.valid('json');
    const db = c.get('db');
    const id = crypto.randomUUID();

    await db.insert(departments).values({ id, nama });
    return c.json({ success: true, message: 'Departemen berhasil ditambahkan', data: { id, nama } }, 201);
  }
);

masterRouter.put(
  '/departments/:id',
  requireRole(['SUPER_ADMIN']),
  zValidator('json', createDepartmentSchema),
  async (c) => {
    const id = c.req.param('id');
    const { nama } = c.req.valid('json');
    const db = c.get('db');

    await db.update(departments).set({ nama }).where(eq(departments.id, id));
    return c.json({ success: true, message: 'Departemen berhasil diperbarui' });
  }
);

masterRouter.delete('/departments/:id', requireRole(['SUPER_ADMIN']), async (c) => {
  const id = c.req.param('id');
  const db = c.get('db');

  // Cek apakah ada anggota yang terdaftar di departemen ini
  const assignedUsers = await db.select().from(users).where(eq(users.departmentId, id)).limit(1);
  if (assignedUsers.length > 0) {
    return c.json(
      {
        success: false,
        message: 'Departemen tidak dapat dihapus karena masih digunakan oleh anggota pengurus.',
      },
      400
    );
  }

  // Bersihkan penugasan PJ jika ada
  await db.delete(pjDepartments).where(eq(pjDepartments.departmentId, id));

  await db.delete(departments).where(eq(departments.id, id));
  return c.json({ success: true, message: 'Departemen berhasil dihapus' });
});

// ==================== PJ DEPARTMENTS MAPPING ====================

const assignPjSchema = z.object({
  adminId: z.string().min(1, 'Admin ID wajib diisi'),
  departmentId: z.string().min(1, 'Department ID wajib diisi'),
});

masterRouter.get('/pj-departments', requireRole(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  const db = c.get('db');
  const user = c.get('user');

  // SUPER_ADMIN dapat melihat seluruh mapping, ADMIN hanya mapping miliknya
  if (user.role === 'SUPER_ADMIN') {
    const mappings = await db
      .select({
        adminId: pjDepartments.adminId,
        adminName: users.namaLengkap,
        adminPrn: users.prn,
        departmentId: pjDepartments.departmentId,
        departmentName: departments.nama,
        assignedAt: pjDepartments.assignedAt,
      })
      .from(pjDepartments)
      .innerJoin(users, eq(pjDepartments.adminId, users.id))
      .innerJoin(departments, eq(pjDepartments.departmentId, departments.id))
      .all();
    return c.json({ success: true, data: mappings });
  }

  const mappings = await db
    .select({
      adminId: pjDepartments.adminId,
      adminName: users.namaLengkap,
      adminPrn: users.prn,
      departmentId: pjDepartments.departmentId,
      departmentName: departments.nama,
      assignedAt: pjDepartments.assignedAt,
    })
    .from(pjDepartments)
    .innerJoin(users, eq(pjDepartments.adminId, users.id))
    .innerJoin(departments, eq(pjDepartments.departmentId, departments.id))
    .where(eq(pjDepartments.adminId, user.id))
    .all();

  return c.json({ success: true, data: mappings });
});

masterRouter.post(
  '/pj-departments',
  requireRole(['SUPER_ADMIN']),
  zValidator('json', assignPjSchema),
  async (c) => {
    const { adminId, departmentId } = c.req.valid('json');
    const db = c.get('db');

    // Pastikan user adalah role ADMIN
    const targetUser = await db.select().from(users).where(eq(users.id, adminId)).limit(1);
    if (!targetUser || targetUser.length === 0 || targetUser[0].role !== 'ADMIN') {
      return c.json({ success: false, message: 'User yang ditugaskan harus berstatus ADMIN (Staf PSDM)' }, 400);
    }

    await db.insert(pjDepartments).values({
      adminId,
      departmentId,
    });

    return c.json({ success: true, message: 'Penugasan PJ Departemen berhasil dibuat' }, 201);
  }
);

masterRouter.delete(
  '/pj-departments/:adminId/:departmentId',
  requireRole(['SUPER_ADMIN']),
  async (c) => {
    const adminId = c.req.param('adminId');
    const departmentId = c.req.param('departmentId');
    const db = c.get('db');

    await db
      .delete(pjDepartments)
      .where(and(eq(pjDepartments.adminId, adminId), eq(pjDepartments.departmentId, departmentId)));

    return c.json({ success: true, message: 'Penugasan PJ Departemen berhasil dihapus' });
  }
);
