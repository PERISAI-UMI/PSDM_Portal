import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, like, or } from 'drizzle-orm';
import type { AppEnv } from '../types.ts';
import {
  users,
  departments,
  programStudi,
  userRoleEnum,
  tingkatJabatanEnum,
} from '../../db/schema/index.ts';
import { authMiddleware, requireRole } from '../middleware/auth.ts';
import { hashPassword } from '../crypto.ts';

export const usersRouter = new Hono<AppEnv>();

usersRouter.use('*', authMiddleware);

const createUserSchema = z.object({
  prn: z.string().min(3, 'PRN / Username minimal 3 karakter'),
  password: z.string().min(8, 'Password default minimal 8 karakter'),
  role: z.enum(userRoleEnum).default('PENGURUS'),
  generasi: z.number().int().positive(),
  departmentId: z.string().min(1, 'Departemen wajib dipilih'),
  jabatan: z.string().min(2, 'Jabatan wajib diisi'),
  tingkatJabatan: z.enum(tingkatJabatanEnum),
  namaLengkap: z.string().min(2, 'Nama lengkap wajib diisi'),
  tempatLahir: z.string().min(2, 'Tempat lahir wajib diisi'),
  tanggalLahir: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal lahir YYYY-MM-DD'),
  alamat: z.string().min(5, 'Alamat wajib diisi'),
  noTelp: z.string().min(9, 'Nomor telepon tidak valid'),
  email: z.string().email('Format email tidak valid'),
  nim: z.string().min(5, 'NIM wajib diisi'),
  programStudiId: z.string().min(1, 'Program studi wajib dipilih'),
  angkatan: z.number().int().min(2000).max(2100),
  linkedinUrl: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
  instagramUsername: z.string().optional().nullable(),
});

const updateUserSelfSchema = z.object({
  namaLengkap: z.string().min(2, 'Nama lengkap minimal 2 karakter').optional(),
  email: z.string().email('Format email tidak valid').optional(),
  noTelp: z.string().min(8, 'Nomor telepon tidak valid').optional(),
  nim: z.string().min(3, 'NIM minimal 3 karakter').optional(),
  angkatan: z.number().int().min(2000).max(2100).optional(),
  alamat: z.string().optional().nullable(),
  tempatLahir: z.string().optional().nullable(),
  tanggalLahir: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal lahir YYYY-MM-DD').optional().nullable(),
  linkedinUrl: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
  instagramUsername: z.string().optional().nullable(),
});

const updateUserAdminSchema = createUserSchema.partial().omit({ prn: true });

// GET /api/users (SUPER_ADMIN & ADMIN)
usersRouter.get('/', requireRole(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  const db = c.get('db');
  const departmentId = c.req.query('departmentId');
  const role = c.req.query('role');
  const search = c.req.query('search');

  let conditions = [];

  if (departmentId) {
    conditions.push(eq(users.departmentId, departmentId));
  }
  if (role && userRoleEnum.includes(role as any)) {
    conditions.push(eq(users.role, role as any));
  }
  if (search) {
    conditions.push(
      or(
        like(users.namaLengkap, `%${search}%`),
        like(users.prn, `%${search}%`),
        like(users.nim, `%${search}%`)
      )
    );
  }

  const query = db
    .select({
      id: users.id,
      prn: users.prn,
      role: users.role,
      generasi: users.generasi,
      departmentId: users.departmentId,
      departmentName: departments.nama,
      jabatan: users.jabatan,
      tingkatJabatan: users.tingkatJabatan,
      namaLengkap: users.namaLengkap,
      tempatLahir: users.tempatLahir,
      tanggalLahir: users.tanggalLahir,
      alamat: users.alamat,
      noTelp: users.noTelp,
      email: users.email,
      nim: users.nim,
      programStudiId: users.programStudiId,
      programStudiName: programStudi.nama,
      angkatan: users.angkatan,
      linkedinUrl: users.linkedinUrl,
      instagramUsername: users.instagramUsername,
    })
    .from(users)
    .innerJoin(departments, eq(users.departmentId, departments.id))
    .innerJoin(programStudi, eq(users.programStudiId, programStudi.id));

  const list = conditions.length > 0 ? await query.where(and(...conditions)).all() : await query.all();

  return c.json({ success: true, data: list });
});

// GET /api/users/:id
usersRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const currentUser = c.get('user');
  const db = c.get('db');

  // RBAC: Pengurus hanya bisa akses profil sendiri. ADMIN dan SUPER_ADMIN bisa akses siapa saja
  if (currentUser.role === 'PENGURUS' && currentUser.id !== id) {
    return c.json({ success: false, message: 'Forbidden: Anda hanya dapat mengakses profil Anda sendiri' }, 403);
  }

  const userRecord = await db
    .select({
      id: users.id,
      prn: users.prn,
      role: users.role,
      generasi: users.generasi,
      departmentId: users.departmentId,
      departmentName: departments.nama,
      jabatan: users.jabatan,
      tingkatJabatan: users.tingkatJabatan,
      namaLengkap: users.namaLengkap,
      tempatLahir: users.tempatLahir,
      tanggalLahir: users.tanggalLahir,
      alamat: users.alamat,
      noTelp: users.noTelp,
      email: users.email,
      nim: users.nim,
      programStudiId: users.programStudiId,
      programStudiName: programStudi.nama,
      angkatan: users.angkatan,
      linkedinUrl: users.linkedinUrl,
      instagramUsername: users.instagramUsername,
    })
    .from(users)
    .innerJoin(departments, eq(users.departmentId, departments.id))
    .innerJoin(programStudi, eq(users.programStudiId, programStudi.id))
    .where(eq(users.id, id))
    .limit(1);

  if (!userRecord || userRecord.length === 0) {
    return c.json({ success: false, message: 'User tidak ditemukan' }, 404);
  }

  return c.json({ success: true, data: userRecord[0] });
});

// POST /api/users (SUPER_ADMIN ONLY)
usersRouter.post('/', requireRole(['SUPER_ADMIN']), zValidator('json', createUserSchema), async (c) => {
  const data = c.req.valid('json');
  const db = c.get('db');

  // Cek duplikasi PRN / NIM / Email
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(or(eq(users.prn, data.prn), eq(users.nim, data.nim), eq(users.email, data.email)))
    .limit(1);

  if (existing && existing.length > 0) {
    return c.json({ success: false, message: 'PRN, NIM, atau Email sudah terdaftar' }, 400);
  }

  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(data.password);

  const { password: _, ...userData } = data;

  await db.insert(users).values({
    ...userData,
    id,
    passwordHash,
  });

  return c.json({ success: true, message: 'User anggota berhasil ditambahkan', data: { id, prn: data.prn } }, 201);
});

// POST /api/users/batch-import (SUPER_ADMIN ONLY - Import anggota massal dari Excel / CSV)
const batchImportSchema = z.object({
  users: z.array(createUserSchema).min(1, 'Daftar anggota tidak boleh kosong'),
});

usersRouter.post('/batch-import', requireRole(['SUPER_ADMIN']), zValidator('json', batchImportSchema), async (c) => {
  const { users: userList } = c.req.valid('json');
  const db = c.get('db');

  let importedCount = 0;
  let skippedCount = 0;
  const errors: { prn: string; reason: string }[] = [];

  for (const item of userList) {
    try {
      // Cek duplikasi PRN / NIM / Email
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(or(eq(users.prn, item.prn), eq(users.nim, item.nim), eq(users.email, item.email)))
        .limit(1);

      if (existing && existing.length > 0) {
        skippedCount++;
        errors.push({ prn: item.prn, reason: 'PRN, NIM, atau Email sudah terdaftar' });
        continue;
      }

      const id = crypto.randomUUID();
      const passwordHash = await hashPassword(item.password);
      const { password: _, ...userData } = item;

      await db.insert(users).values({
        ...userData,
        id,
        passwordHash,
      });

      importedCount++;
    } catch (err: any) {
      skippedCount++;
      errors.push({ prn: item.prn, reason: err?.message || 'Gagal menyimpan ke database' });
    }
  }

  return c.json({
    success: true,
    message: `Berhasil mengimpor ${importedCount} anggota (${skippedCount} dilewati/duplikat).`,
    data: {
      importedCount,
      skippedCount,
      errors,
    },
  });
});

// Helper untuk mengambil data profil lengkap user
async function getFullUserById(db: any, userId: string) {
  const userRecord = await db
    .select({
      id: users.id,
      prn: users.prn,
      role: users.role,
      generasi: users.generasi,
      departmentId: users.departmentId,
      departmentName: departments.nama,
      jabatan: users.jabatan,
      tingkatJabatan: users.tingkatJabatan,
      namaLengkap: users.namaLengkap,
      tempatLahir: users.tempatLahir,
      tanggalLahir: users.tanggalLahir,
      alamat: users.alamat,
      noTelp: users.noTelp,
      email: users.email,
      nim: users.nim,
      programStudiId: users.programStudiId,
      programStudiName: programStudi.nama,
      angkatan: users.angkatan,
      linkedinUrl: users.linkedinUrl,
      instagramUsername: users.instagramUsername,
    })
    .from(users)
    .innerJoin(departments, eq(users.departmentId, departments.id))
    .innerJoin(programStudi, eq(users.programStudiId, programStudi.id))
    .where(eq(users.id, userId))
    .limit(1);

  return userRecord && userRecord.length > 0 ? userRecord[0] : null;
}

// PUT /api/users/profile (Update profil user yang sedang login)
usersRouter.put('/profile', async (c) => {
  const currentUser = c.get('user');
  const db = c.get('db');

  const jsonBody = await c.req.json();
  const parsed = updateUserSelfSchema.safeParse(jsonBody);
  if (!parsed.success) {
    return c.json({ success: false, errors: parsed.error.format() }, 400);
  }

  const updateData = { ...parsed.data };
  if (updateData.linkedinUrl === '') {
    updateData.linkedinUrl = null;
  }

  await db.update(users).set(updateData).where(eq(users.id, currentUser.id));

  const updatedUser = await getFullUserById(db, currentUser.id);
  return c.json({
    success: true,
    message: 'Profil berhasil diperbarui',
    data: updatedUser,
  });
});

// PUT /api/users/:id (SUPER_ADMIN atau User Sendiri)
usersRouter.put('/:id', async (c) => {
  const id = c.req.param('id');
  const currentUser = c.get('user');
  const db = c.get('db');

  const targetId = id === 'profile' ? currentUser.id : id;

  // Jika targetnya adalah user sendiri
  if (currentUser.id === targetId) {
    const jsonBody = await c.req.json();
    const parsed = updateUserSelfSchema.safeParse(jsonBody);
    if (!parsed.success) {
      return c.json({ success: false, errors: parsed.error.format() }, 400);
    }

    const updateData = { ...parsed.data };
    if (updateData.linkedinUrl === '') {
      updateData.linkedinUrl = null;
    }

    await db.update(users).set(updateData).where(eq(users.id, targetId));
    const updatedUser = await getFullUserById(db, targetId);
    return c.json({
      success: true,
      message: 'Profil mandiri berhasil diperbarui',
      data: updatedUser,
    });
  }

  // Jika ADMIN (bukan SUPER_ADMIN) mencoba mengubah user orang lain -> Forbidden
  if (currentUser.role !== 'SUPER_ADMIN') {
    return c.json({ success: false, message: 'Forbidden: Hanya Super Admin yang dapat mengubah data anggota lain' }, 403);
  }

  // Khusus SUPER_ADMIN mengubah anggota lain
  const jsonBody = await c.req.json();
  const parsed = updateUserAdminSchema.safeParse(jsonBody);
  if (!parsed.success) {
    return c.json({ success: false, errors: parsed.error.format() }, 400);
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.password) {
    updateData.passwordHash = await hashPassword(parsed.data.password);
    delete updateData.password;
  }
  if (updateData.linkedinUrl === '') {
    updateData.linkedinUrl = null;
  }

  await db.update(users).set(updateData).where(eq(users.id, targetId));
  const updatedUser = await getFullUserById(db, targetId);
  return c.json({
    success: true,
    message: 'Profil user berhasil diperbarui oleh Super Admin',
    data: updatedUser,
  });
});

// DELETE /api/users/:id (SUPER_ADMIN ONLY)
usersRouter.delete('/:id', requireRole(['SUPER_ADMIN']), async (c) => {
  const id = c.req.param('id');
  const currentUser = c.get('user');
  const db = c.get('db');

  if (currentUser.id === id) {
    return c.json({ success: false, message: 'Tidak dapat menghapus akun Anda sendiri' }, 400);
  }

  await db.delete(users).where(eq(users.id, id));
  return c.json({ success: true, message: 'User anggota berhasil dihapus' });
});
