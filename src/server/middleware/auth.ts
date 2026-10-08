import { createMiddleware } from 'hono/factory';
import { getCookie, deleteCookie } from 'hono/cookie';
import { eq, and, gt } from 'drizzle-orm';
import type { AppEnv } from '../types.ts';
import {
  sessions,
  users,
  pjDepartments,
  departments,
  programStudi,
  type UserRole,
} from '../../db/schema/index.ts';

export const SESSION_COOKIE_NAME = 'psdm_session';

// Short-lived in-memory session cache (15 detik) untuk meredam lonjakan query paralel saat page load
interface CachedSessionUser {
  user: any;
  session: typeof sessions.$inferSelect;
  cachedAt: number;
}

const sessionMicroCache = new Map<string, CachedSessionUser>();
const SESSION_CACHE_TTL_MS = 15_000;

export function invalidateSessionCache(token?: string) {
  if (token) {
    sessionMicroCache.delete(token);
  } else {
    sessionMicroCache.clear();
  }
}

/**
 * Middleware Autentikasi Session Cookie
 * Menggunakan single joined query dan in-memory micro-cache untuk meredam query storm.
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

  // Cek in-memory micro-cache
  const cached = sessionMicroCache.get(token);
  const nowMs = Date.now();
  if (cached && (nowMs - cached.cachedAt) < SESSION_CACHE_TTL_MS) {
    if (cached.user?.isActive === false) {
      sessionMicroCache.delete(token);
      deleteCookie(c, SESSION_COOKIE_NAME, { path: '/' });
      return c.json({ success: false, message: 'Unauthorized: Akun telah dinonaktifkan' }, 401);
    }
    if (new Date(cached.session.expiresAt).getTime() > nowMs) {
      c.set('user', cached.user);
      c.set('session', cached.session);

      // Throttled presence heartbeat: update session.updatedAt if older than 45 seconds
      const lastUpdated = cached.session.updatedAt ? new Date(cached.session.updatedAt).getTime() : 0;
      if (nowMs - lastUpdated > 45_000) {
        cached.session.updatedAt = new Date();
        const db = c.get('db');
        const updatePresence = db
          .update(sessions)
          .set({ updatedAt: new Date() })
          .where(eq(sessions.id, cached.session.id));
        if (c.executionCtx) {
          c.executionCtx.waitUntil(updatePresence);
        } else {
          updatePresence.catch(() => {});
        }
      }

      return next();
    } else {
      sessionMicroCache.delete(token);
    }
  }

  const db = c.get('db');

  // Single Joined Query: sessions + users + departments + programStudi
  const rows = await db
    .select({
      session: sessions,
      user: {
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
        isActive: users.isActive,
        deletedAt: users.deletedAt,
      },
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .leftJoin(departments, eq(users.departmentId, departments.id))
    .leftJoin(programStudi, eq(users.programStudiId, programStudi.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date()), eq(users.isActive, true)))
    .limit(1);

  if (!rows || rows.length === 0) {
    sessionMicroCache.delete(token);
    deleteCookie(c, SESSION_COOKIE_NAME, { path: '/' });
    return c.json({ success: false, message: 'Unauthorized: Sesi telah kedaluwarsa atau tidak valid' }, 401);
  }

  const currentSession = rows[0].session;
  const safeUser = rows[0].user;

  // Jika ADMIN, sertakan data pjDepartments untuk verifikasi RBAC departemen binaan
  let userPjs: typeof pjDepartments.$inferSelect[] = [];
  if (safeUser.role === 'ADMIN') {
    userPjs = await db
      .select()
      .from(pjDepartments)
      .where(eq(pjDepartments.adminId, safeUser.id));
  }

  const fullUser = { ...safeUser, pjDepartments: userPjs };

  // Simpan ke micro-cache
  sessionMicroCache.set(token, {
    user: fullUser,
    session: currentSession,
    cachedAt: nowMs,
  });

  // Throttled presence heartbeat: update session.updatedAt if older than 45 seconds
  const lastUpdated = currentSession.updatedAt ? new Date(currentSession.updatedAt).getTime() : 0;
  if (nowMs - lastUpdated > 45_000) {
    currentSession.updatedAt = new Date();
    const updatePresence = db
      .update(sessions)
      .set({ updatedAt: new Date() })
      .where(eq(sessions.id, currentSession.id));
    if (c.executionCtx) {
      c.executionCtx.waitUntil(updatePresence);
    } else {
      updatePresence.catch(() => {});
    }
  }

  c.set('user', fullUser);
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
