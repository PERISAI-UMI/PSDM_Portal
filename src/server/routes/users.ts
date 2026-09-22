import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, like, or, inArray } from 'drizzle-orm';
import type { AppEnv } from '../types.ts';
import {
  users,
  departments,
  programStudi,
  userRoleEnum,
  sessions,
  pjDepartments,
  activities,
  attendances,
  permissions,
} from '../../db/schema/index.ts';
import { authMiddleware, requireRole, invalidateSessionCache } from '../middleware/auth.ts';
import { hashPassword } from '../crypto.ts';
import { getB2Credentials } from './storage.ts';

export const usersRouter = new Hono<AppEnv>();

usersRouter.use('*', authMiddleware);

const createUserSchema = z.object({
  prn: z.string().min(3, 'PRN / Username minimal 3 karakter'),
  password: z.string().min(8, 'Password default minimal 8 karakter'),
  role: z.enum(userRoleEnum).default('PENGURUS'),
  generasi: z.number().int().positive(),
  departmentId: z.string().min(1, 'Departemen wajib dipilih'),
  jabatan: z.string().min(2, 'Jabatan wajib diisi'),
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
  avatarUrl: z.union([z.string(), z.literal(''), z.null()]).optional(),
});

const updateUserSelfSchema = z.object({
  namaLengkap: z.string().min(2, 'Nama lengkap minimal 2 karakter').optional(),
  email: z.string().email('Format email tidak valid').optional(),
  noTelp: z.string().min(8, 'Nomor telepon tidak valid').optional(),
  nim: z.string().min(3, 'NIM minimal 3 karakter').optional(),
  angkatan: z.number().int().min(2000).max(2100).optional(),
  alamat: z.string().optional(),
  tempatLahir: z.string().optional(),
  tanggalLahir: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal lahir YYYY-MM-DD').optional(),
  linkedinUrl: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
  instagramUsername: z.string().optional().nullable(),
  avatarUrl: z.union([z.string(), z.literal(''), z.null()]).optional(),
});

const updateUserAdminSchema = createUserSchema.partial().omit({ prn: true });

// GET /api/users (SUPER_ADMIN, ADMIN & INTI)
usersRouter.get('/', requireRole(['SUPER_ADMIN', 'ADMIN', 'INTI']), async (c) => {
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
      avatarUrl: users.avatarUrl,
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
      avatarUrl: users.avatarUrl,
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
  let updatedCount = 0;
  let skippedCount = 0;
  const errors: { prn: string; reason: string }[] = [];

  try {
    // 1. Ambil seluruh data identitas unik yang ada di database dalam 1 query ringan
    const allExistingUsers = await db
      .select({
        id: users.id,
        prn: users.prn,
        nim: users.nim,
        email: users.email,
      })
      .from(users)
      .all();

    const userByPrn = new Map<string, typeof allExistingUsers[0]>();
    const userByNim = new Map<string, typeof allExistingUsers[0]>();
    const userByEmail = new Map<string, typeof allExistingUsers[0]>();

    for (const u of allExistingUsers) {
      if (u.prn) userByPrn.set(u.prn.trim().toUpperCase(), u);
      if (u.nim) userByNim.set(u.nim.trim(), u);
      if (u.email) userByEmail.set(u.email.trim().toLowerCase(), u);
    }

    // 2. Pilah baris antara Insert (anggota baru) dan Update (anggota sudah ada)
    const seenBatchPrns = new Set<string>();
    const seenBatchNims = new Set<string>();
    const seenBatchEmails = new Set<string>();

    const itemsToInsert: Array<typeof userList[0] & { prn: string; email: string; nim: string }> = [];
    const itemsToUpdate: Array<{ id: string; prn: string; data: Record<string, unknown> }> = [];

    for (const item of userList) {
      const prnUpper = item.prn.trim().toUpperCase();
      const emailLower = item.email.trim().toLowerCase();
      const nimTrim = item.nim.trim();

      // Cek duplikasi di dalam file itu sendiri
      if (seenBatchPrns.has(prnUpper)) {
        skippedCount++;
        errors.push({ prn: item.prn, reason: 'Duplikasi PRN di dalam berkas impor' });
        continue;
      }
      if (seenBatchNims.has(nimTrim)) {
        skippedCount++;
        errors.push({ prn: item.prn, reason: 'Duplikasi NIM di dalam berkas impor' });
        continue;
      }
      if (seenBatchEmails.has(emailLower)) {
        skippedCount++;
        errors.push({ prn: item.prn, reason: 'Duplikasi Email di dalam berkas impor' });
        continue;
      }

      const existingByPrn = userByPrn.get(prnUpper);

      if (existingByPrn) {
        // Mode UPSERT: Update data anggota jika PRN sudah terdaftar
        // Pastikan NIM tidak bentrok dengan akun orang lain
        const existingByNim = userByNim.get(nimTrim);
        if (existingByNim && existingByNim.id !== existingByPrn.id) {
          skippedCount++;
          errors.push({ prn: item.prn, reason: `NIM ${nimTrim} sudah digunakan oleh anggota lain (${existingByNim.prn})` });
          continue;
        }

        // Pastikan Email tidak bentrok dengan akun orang lain
        const existingByEmail = userByEmail.get(emailLower);
        if (existingByEmail && existingByEmail.id !== existingByPrn.id) {
          skippedCount++;
          errors.push({ prn: item.prn, reason: `Email ${emailLower} sudah digunakan oleh anggota lain (${existingByEmail.prn})` });
          continue;
        }

        seenBatchPrns.add(prnUpper);
        seenBatchNims.add(nimTrim);
        seenBatchEmails.add(emailLower);

        const { password: _, prn: __, ...updateFields } = item;
        itemsToUpdate.push({
          id: existingByPrn.id,
          prn: prnUpper,
          data: {
            ...updateFields,
            email: emailLower,
            nim: nimTrim,
          },
        });
      } else {
        // Anggota Baru (INSERT)
        // Pastikan NIM belum dipakai orang lain
        const existingByNim = userByNim.get(nimTrim);
        if (existingByNim) {
          skippedCount++;
          errors.push({ prn: item.prn, reason: `NIM ${nimTrim} sudah terdaftar pada anggota lain (${existingByNim.prn})` });
          continue;
        }

        // Pastikan Email belum dipakai orang lain
        const existingByEmail = userByEmail.get(emailLower);
        if (existingByEmail) {
          skippedCount++;
          errors.push({ prn: item.prn, reason: `Email ${emailLower} sudah terdaftar pada anggota lain (${existingByEmail.prn})` });
          continue;
        }

        seenBatchPrns.add(prnUpper);
        seenBatchNims.add(nimTrim);
        seenBatchEmails.add(emailLower);

        itemsToInsert.push({
          ...item,
          prn: prnUpper,
          email: emailLower,
          nim: nimTrim,
        });
      }
    }

    // 3. Eksekusi Insert untuk anggota baru secara chunked batch
    if (itemsToInsert.length > 0) {
      const passwordHashMap = new Map<string, string>();
      const preparedInsertRows = await Promise.all(
        itemsToInsert.map(async (item) => {
          let hash = passwordHashMap.get(item.password);
          if (!hash) {
            hash = await hashPassword(item.password);
            passwordHashMap.set(item.password, hash);
          }
          const id = crypto.randomUUID();
          const { password: _, ...userData } = item;
          return {
            ...userData,
            id,
            passwordHash: hash,
          };
        })
      );

      const CHUNK_SIZE = 25;
      for (let i = 0; i < preparedInsertRows.length; i += CHUNK_SIZE) {
        const chunk = preparedInsertRows.slice(i, i + CHUNK_SIZE);
        try {
          await db.insert(users).values(chunk);
          importedCount += chunk.length;
        } catch (chunkErr: any) {
          for (const singleRow of chunk) {
            try {
              await db.insert(users).values(singleRow);
              importedCount++;
            } catch (singleErr: any) {
              skippedCount++;
              errors.push({ prn: singleRow.prn, reason: singleErr?.message || 'Gagal menyimpan ke database' });
            }
          }
        }
      }
    }

    // 4. Eksekusi Update untuk anggota yang sudah ada (diproses secara chunked untuk efisiensi edge)
    if (itemsToUpdate.length > 0) {
      const UPDATE_CHUNK_SIZE = 10;
      for (let i = 0; i < itemsToUpdate.length; i += UPDATE_CHUNK_SIZE) {
        const chunk = itemsToUpdate.slice(i, i + UPDATE_CHUNK_SIZE);
        const results = await Promise.allSettled(
          chunk.map((item) => db.update(users).set(item.data).where(eq(users.id, item.id)))
        );
        results.forEach((res, idx) => {
          const item = chunk[idx];
          if (res.status === 'fulfilled') {
            updatedCount++;
          } else {
            skippedCount++;
            errors.push({
              prn: item.prn,
              reason: (res as PromiseRejectedResult).reason?.message || 'Gagal memperbarui data anggota',
            });
          }
        });
      }
    }

    const message = `Proses impor selesai: ${importedCount} anggota baru ditambahkan${
      updatedCount > 0 ? `, ${updatedCount} anggota diperbarui` : ''
    }${skippedCount > 0 ? `, ${skippedCount} dilewati` : ''}.`;

    return c.json({
      success: true,
      message,
      data: {
        importedCount,
        updatedCount,
        skippedCount,
        errors,
      },
    });
  } catch (globalErr: any) {
    return c.json(
      {
        success: false,
        message: `Galat saat memproses impor massal: ${globalErr?.message || 'Unknown error'}`,
        data: { importedCount, updatedCount, skippedCount, errors },
      },
      500
    );
  }
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
      avatarUrl: users.avatarUrl,
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
  if (updateData.avatarUrl === '') {
    updateData.avatarUrl = null;
  }

  await db.update(users).set(updateData).where(eq(users.id, currentUser.id));
  invalidateSessionCache();

  const updatedUser = await getFullUserById(db, currentUser.id);
  return c.json({
    success: true,
    message: 'Profil berhasil diperbarui',
    data: updatedUser,
  });
});

// POST /api/users/profile/avatar (Upload / ubah foto profil akun)
usersRouter.post('/profile/avatar', async (c) => {
  const currentUser = c.get('user');
  const db = c.get('db');

  let avatarUrl: string | null = null;
  const contentType = c.req.header('content-type') || '';

  if (contentType.includes('application/json')) {
    const json = await c.req.json();
    avatarUrl = json.avatarUrl || null;
  } else if (contentType.includes('multipart/form-data')) {
    const body = await c.req.parseBody();
    const file = body['file'];
    if (file && file instanceof File) {
      // Proteksi Kuota & RAM: Foto profil maksimal 2 MB
      const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
      if (file.size > MAX_AVATAR_SIZE) {
        return c.json({ success: false, message: 'Ukuran foto profil melebihi batas maksimal 2 MB' }, 400);
      }

      const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
      if (file.type && !ALLOWED_AVATAR_TYPES.includes(file.type.toLowerCase())) {
        return c.json({ success: false, message: 'Format foto harus berupa JPG, PNG, atau WebP' }, 400);
      }

      const keyId = c.env?.B2_APPLICATION_KEY_ID || process.env.B2_APPLICATION_KEY_ID;
      const appKey = c.env?.B2_APPLICATION_KEY || process.env.B2_APPLICATION_KEY;
      const targetBucketName = c.env?.B2_BUCKET_NAME || process.env.B2_BUCKET_NAME || 'PSDM-B2';

      if (keyId && appKey) {
        try {
          const creds = await getB2Credentials(keyId, appKey, targetBucketName);
          const getUploadUrlRes = await fetch(`${creds.apiUrl}/b2api/v2/b2_get_upload_url`, {
            method: 'POST',
            headers: {
              Authorization: creds.authToken,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ bucketId: creds.bucketId }),
          });

          if (getUploadUrlRes.ok) {
            const uploadUrlData = (await getUploadUrlRes.json()) as { uploadUrl: string; authorizationToken: string };
            const fileBytes = await file.arrayBuffer();
            const ext = file.name.split('.').pop() || 'webp';
            const cleanFileName = `avatars/${currentUser.id}-${Date.now()}.${ext}`;

            const b2UploadRes = await fetch(uploadUrlData.uploadUrl, {
              method: 'POST',
              headers: {
                Authorization: uploadUrlData.authorizationToken,
                'X-Bz-File-Name': cleanFileName,
                'Content-Type': file.type || 'image/webp',
                'X-Bz-Content-Sha1': 'do_not_verify',
                'Content-Length': String(fileBytes.byteLength),
              },
              body: fileBytes,
            });

            if (b2UploadRes.ok) {
              avatarUrl = `/api/storage/file/${cleanFileName}`;
            }
          }
        } catch {
          // B2 upload failed, fallback to base64 below
        }
      }

      // Fallback jika tanpa B2 / offline: simpan sebagai dataURL WebP terkompresi
      if (!avatarUrl) {
        const fileBytes = await file.arrayBuffer();
        const base64 = Buffer.from(fileBytes).toString('base64');
        const mime = file.type || 'image/webp';
        avatarUrl = `data:${mime};base64,${base64}`;
      }
    }
  }

  if (!avatarUrl) {
    return c.json({ success: false, message: 'Berkas foto tidak ditemukan' }, 400);
  }

  await db.update(users).set({ avatarUrl }).where(eq(users.id, currentUser.id));
  invalidateSessionCache();

  const updatedUser = await getFullUserById(db, currentUser.id);

  return c.json({
    success: true,
    message: 'Foto profil berhasil diperbarui',
    data: {
      avatarUrl,
      user: updatedUser,
    },
  });
});

// DELETE /api/users/profile/avatar (Hapus foto profil)
usersRouter.delete('/profile/avatar', async (c) => {
  const currentUser = c.get('user');
  const db = c.get('db');

  await db.update(users).set({ avatarUrl: null }).where(eq(users.id, currentUser.id));
  invalidateSessionCache();

  const updatedUser = await getFullUserById(db, currentUser.id);

  return c.json({
    success: true,
    message: 'Foto profil berhasil dihapus',
    data: {
      avatarUrl: null,
      user: updatedUser,
    },
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

  try {
    // 1. Reassign activity creation to current Super Admin so activities aren't orphaned or blocked by FK restrict
    await db.update(activities).set({ createdBy: currentUser.id }).where(eq(activities.createdBy, id));

    // 2. Reassign attendance recorder to current Super Admin so attendance logs aren't blocked by FK restrict
    await db.update(attendances).set({ recordedBy: currentUser.id }).where(eq(attendances.recordedBy, id));

    // 3. Clear review reference in permissions
    await db.update(permissions).set({ reviewedBy: null }).where(eq(permissions.reviewedBy, id));

    // 4. Delete user's own attendances and permissions
    await db.delete(attendances).where(eq(attendances.userId, id));
    await db.delete(permissions).where(eq(permissions.userId, id));

    // 5. Delete department assignments and active login sessions
    await db.delete(pjDepartments).where(eq(pjDepartments.adminId, id));
    await db.delete(sessions).where(eq(sessions.userId, id));

    // 6. Finally delete the user record
    await db.delete(users).where(eq(users.id, id));

    return c.json({ success: true, message: 'User anggota berhasil dihapus' });
  } catch (err: any) {
    return c.json(
      {
        success: false,
        message: `Gagal menghapus user anggota: ${err?.message || 'Galat relasi database'}`,
      },
      500
    );
  }
});
