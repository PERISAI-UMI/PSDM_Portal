import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { setCookie, deleteCookie } from 'hono/cookie';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import type { AppEnv } from '../types.ts';
import { users, sessions } from '../../db/schema/index.ts';
import { hashPassword, verifyPassword, generateSessionToken } from '../crypto.ts';
import { authMiddleware, SESSION_COOKIE_NAME } from '../middleware/auth.ts';

export const authRouter = new Hono<AppEnv>();

const loginSchema = z.object({
  prn: z.string().min(1, 'PRN / Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Password lama wajib diisi'),
  newPassword: z.string().min(8, 'Password baru minimal 8 karakter'),
});

// POST /api/auth/login
authRouter.post('/login', zValidator('json', loginSchema), async (c) => {
  const { prn, password } = c.req.valid('json');
  const db = c.get('db');

  const foundUsers = await db
    .select()
    .from(users)
    .where(eq(users.prn, prn))
    .limit(1);

  if (!foundUsers || foundUsers.length === 0) {
    return c.json({ success: false, message: 'PRN atau password salah' }, 401);
  }

  const user = foundUsers[0];
  const isMatch = await verifyPassword(password, user.passwordHash);

  if (!isMatch) {
    return c.json({ success: false, message: 'PRN atau password salah' }, 401);
  }

  // Buat session baru (masa berlaku 7 hari)
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const sessionId = crypto.randomUUID();

  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    token: sessionToken,
    expiresAt,
    ipAddress: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || null,
    userAgent: c.req.header('user-agent') || null,
  });

  // Set HTTP-Only Cookie
  setCookie(c, SESSION_COOKIE_NAME, sessionToken, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    expires: expiresAt,
  });

  const { passwordHash: _, ...safeUser } = user;

  return c.json({
    success: true,
    message: 'Login berhasil',
    data: {
      user: safeUser,
    },
  });
});

// POST /api/auth/logout
authRouter.post('/logout', authMiddleware, async (c) => {
  const session = c.get('session');
  const db = c.get('db');

  if (session) {
    await db.delete(sessions).where(eq(sessions.id, session.id));
  }

  deleteCookie(c, SESSION_COOKIE_NAME, { path: '/' });

  return c.json({
    success: true,
    message: 'Logout berhasil',
  });
});

// GET /api/auth/me
authRouter.get('/me', authMiddleware, async (c) => {
  const user = c.get('user');
  const session = c.get('session');

  return c.json({
    success: true,
    data: {
      user,
      expiresAt: session.expiresAt,
    },
  });
});

// POST /api/auth/change-password
authRouter.post('/change-password', authMiddleware, zValidator('json', changePasswordSchema), async (c) => {
  const { oldPassword, newPassword } = c.req.valid('json');
  const currentUser = c.get('user');
  const db = c.get('db');

  const usersWithHash = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, currentUser.id))
    .limit(1);

  if (!usersWithHash || usersWithHash.length === 0) {
    return c.json({ success: false, message: 'User tidak ditemukan' }, 404);
  }

  const isOldMatch = await verifyPassword(oldPassword, usersWithHash[0].passwordHash);
  if (!isOldMatch) {
    return c.json({ success: false, message: 'Password lama salah' }, 400);
  }

  const newHash = await hashPassword(newPassword);

  await db
    .update(users)
    .set({ passwordHash: newHash })
    .where(eq(users.id, currentUser.id));

  return c.json({
    success: true,
    message: 'Password berhasil diperbarui',
  });
});
