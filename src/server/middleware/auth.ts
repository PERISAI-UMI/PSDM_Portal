import { createMiddleware } from 'hono/factory';
import { getCookie, deleteCookie } from 'hono/cookie';
import { eq, and, gt } from 'drizzle-orm';
import type { AppEnv } from '../types.ts';
import { sessions, users, pjDepartments, type UserRole } from '../../db/schema/index.ts';

export const SESSION_COOKIE_NAME = 'psdm_session';

/**
 * Middleware Autentikasi Session Cookie
 * Memvalidasi token sesi dari cookie HTTP-only ke tabel `sessions` Turso libSQL
 */
export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7).trim()
    : undefined;
  const token = getCookie(c, SESSION_COOKIE_NAME) || bearerToken;

  if (!token) {
    return c.json({ success: false, message: 'Unauthorized: Sesi tidak ditemukan' }, 401);
  }

  const db = c.get('db');

  // Query sesi yang masih aktif
  const activeSessions = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (!activeSessions || activeSessions.length === 0) {
    deleteCookie(c, SESSION_COOKIE_NAME, { path: '/' });
    return c.json({ success: false, message: 'Unauthorized: Sesi telah kedaluwarsa atau tidak valid' }, 401);
  }

  const currentSession = activeSessions[0];

  // Query user terkait
  const foundUsers = await db
    .select()
    .from(users)
    .where(eq(users.id, currentSession.userId))
    .limit(1);

  if (!foundUsers || foundUsers.length === 0) {
    deleteCookie(c, SESSION_COOKIE_NAME, { path: '/' });
    return c.json({ success: false, message: 'Unauthorized: Akun pengguna tidak ditemukan' }, 401);
  }

  const foundUser = foundUsers[0];
  const { passwordHash: _, ...safeUser } = foundUser;

  // Jika ADMIN, sertakan data pjDepartments untuk verifikasi RBAC departemen binaan
  let userPjs: typeof pjDepartments.$inferSelect[] = [];
  if (safeUser.role === 'ADMIN') {
    userPjs = await db
      .select()
      .from(pjDepartments)
      .where(eq(pjDepartments.adminId, safeUser.id));
  }

  c.set('user', { ...safeUser, pjDepartments: userPjs });
  c.set('session', currentSession);

  await next();
});

/**
 * Middleware RBAC (Role-Based Access Control)
 * Memastikan role pengguna sesuai dengan batasan endpoint
 */
export function requireRole(allowedRoles: UserRole[]) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, message: 'Unauthorized' }, 401);
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json(
        {
          success: false,
          message: `Forbidden: Role ${user.role} tidak memiliki hak akses untuk tindakan ini`,
        },
        403
      );
    }

    await next();
  });
}
