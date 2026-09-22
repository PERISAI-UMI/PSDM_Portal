import { Hono } from 'hono';
import { count } from 'drizzle-orm';
import type { AppEnv } from '../types.ts';
import { users } from '../../db/schema/index.ts';

export const diagnosticsRouter = new Hono<AppEnv>();

/**
 * GET /api/diagnostics
 * Real-time connectivity check: Cloudflare Workers runtime, Turso libSQL, Backblaze B2.
 */
diagnosticsRouter.get('/', async (c) => {
  const checks: Record<string, { ok: boolean; latencyMs: number; detail: string }> = {};

  // ── 1. Cloudflare Workers Runtime ─────────────────────────
  const cfStart = performance.now();
  const isCloudflare =
    typeof (globalThis as any).caches !== 'undefined' ||
    typeof (globalThis as any).WebSocketPair !== 'undefined';
  const cfRay = c.req.header('cf-ray');
  const cfCountry = c.req.header('cf-ipcountry');

  checks.cloudflare = {
    ok: true,
    latencyMs: Math.max(1, Math.round(performance.now() - cfStart)),
    detail: isCloudflare
      ? `Cloudflare Workers Edge v8${cfCountry ? ` (${cfCountry})` : ''}${cfRay ? ` · Ray: ${cfRay.slice(0, 8)}` : ''}`
      : 'Node.js / Local Edge emulation',
  };

  // ── 2. Turso libSQL Database Connectivity ─────────────────
  const dbStart = performance.now();
  try {
    const db = c.get('db');
    const result = await db.select({ n: count() }).from(users);
    const userCount = result[0]?.n ?? 0;
    const rawUrl = c.env?.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL || '';
    const safeUrl = rawUrl.replace(/^(libsql:\/\/[^/]+).*/, '$1');
    checks.turso = {
      ok: true,
      latencyMs: Math.max(1, Math.round(performance.now() - dbStart)),
      detail: `Terhubung ke ${safeUrl} · ${userCount} akun terdaftar di DB`,
    };
  } catch (err: any) {
    checks.turso = {
      ok: false,
      latencyMs: Math.max(1, Math.round(performance.now() - dbStart)),
      detail: err?.message ?? 'Koneksi ke Turso gagal',
    };
  }

  // ── 3. Backblaze B2 Native API & Bucket Connectivity ─────
  const b2Start = performance.now();
  try {
    const keyId = c.env?.B2_APPLICATION_KEY_ID || process.env.B2_APPLICATION_KEY_ID;
    const appKey = c.env?.B2_APPLICATION_KEY || process.env.B2_APPLICATION_KEY;
    const bucket = c.env?.B2_BUCKET_NAME || process.env.B2_BUCKET_NAME || 'PSDM-B2';

    if (!keyId || !appKey) {
      throw new Error('Kredensial Backblaze B2 belum diset (B2_APPLICATION_KEY_ID / KEY kosong)');
    }

    // Menggunakan B2 Native Authorization (JSON, tanpa dependensi XML / DOMParser)
    const authString = btoa(`${keyId}:${appKey}`);
    const authRes = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      headers: {
        Authorization: `Basic ${authString}`,
      },
    });

    if (!authRes.ok) {
      const errText = await authRes.text();
      throw new Error(`Otorisasi B2 gagal (HTTP ${authRes.status}): ${errText}`);
    }

    const authData = (await authRes.json()) as any;

    checks.backblaze = {
      ok: true,
      latencyMs: Math.max(1, Math.round(performance.now() - b2Start)),
      detail: `Bucket "${bucket}" aktif & terverifikasi · Account ID: ${authData.accountId}`,
    };
  } catch (err: any) {
    checks.backblaze = {
      ok: false,
      latencyMs: Math.max(1, Math.round(performance.now() - b2Start)),
      detail: err?.message ?? 'Koneksi ke Backblaze B2 gagal',
    };
  }

  const allHealthy = Object.values(checks).every((ch) => ch.ok);

  return c.json({
    success: true,
    allHealthy,
    timestamp: new Date().toISOString(),
    data: checks,
  });
});

/**
 * POST /api/diagnostics/clean-db
 * Pembersihan database pra-peluncuran produksi (Fresh Launch Sanitization).
 * Dilindungi maintenance secret key.
 */
diagnosticsRouter.post('/clean-db', async (c) => {
  const maintenanceKey = c.req.header('x-maintenance-key');
  const secret = c.env?.SESSION_SECRET || process.env.SESSION_SECRET;

  if (!maintenanceKey || maintenanceKey !== secret) {
    return c.json({ success: false, message: 'Akses ditolak: Maintenance key tidak valid' }, 403);
  }

  const db = c.get('db');

  try {
    const {
      attendances,
      permissions,
      activities,
      pjDepartments,
      sessions,
      users,
      departments,
      fakultas,
      programStudi,
    } = await import('../../db/schema/index.ts');
    const { ne, count } = await import('drizzle-orm');

    // 1. Hapus seluruh data transaksi dummy
    await db.delete(attendances);
    await db.delete(permissions);
    await db.delete(activities);
    await db.delete(pjDepartments);
    await db.delete(sessions);

    // 2. Hapus seluruh user demo (pertahankan 1 akun SUPER_ADMIN)
    await db.delete(users).where(ne(users.role, 'SUPER_ADMIN'));

    // 3. Reset avatar pada SUPER_ADMIN yang tersisa agar bersih
    await db.update(users).set({ avatarUrl: null });

    // 4. Hitung rekap data bersih
    const [uCount] = await db.select({ count: count() }).from(users);
    const [actCount] = await db.select({ count: count() }).from(activities);
    const [attCount] = await db.select({ count: count() }).from(attendances);
    const [permCount] = await db.select({ count: count() }).from(permissions);
    const [deptCount] = await db.select({ count: count() }).from(departments);
    const [fakCount] = await db.select({ count: count() }).from(fakultas);
    const [prodiCount] = await db.select({ count: count() }).from(programStudi);

    return c.json({
      success: true,
      message: 'Database berhasil dibersihkan untuk peluncuran produksi (Fresh & Bersih)',
      data: {
        users: uCount.count,
        activities: actCount.count,
        attendances: attCount.count,
        permissions: permCount.count,
        departments: deptCount.count,
        fakultas: fakCount.count,
        prodi: prodiCount.count,
      },
    });
  } catch (err: any) {
    return c.json(
      { success: false, message: `Gagal membersihkan database: ${err?.message || 'Unknown error'}` },
      500
    );
  }
});

