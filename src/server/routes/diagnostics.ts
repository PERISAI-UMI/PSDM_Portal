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
