import { Hono } from 'hono';
import { sql } from 'drizzle-orm';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import type { AppEnv } from '../types.ts';
import { authMiddleware, requireRole } from '../middleware/auth.ts';

export const diagnosticsRouter = new Hono<AppEnv>();

// Only SUPER_ADMIN can run live diagnostics
diagnosticsRouter.use('*', authMiddleware);
diagnosticsRouter.use('*', requireRole(['SUPER_ADMIN']));

/**
 * GET /api/diagnostics
 * Runs real-time connectivity checks for all three infrastructure layers:
 * Cloudflare Workers runtime, Turso libSQL, and Backblaze B2 storage.
 */
diagnosticsRouter.get('/', async (c) => {
  const checks: Record<string, { ok: boolean; latencyMs: number; detail: string }> = {};

  // ── 1. Cloudflare Workers Runtime ─────────────────────────
  const cfStart = performance.now();
  // WebSocketPair and caches are Cloudflare Workers-specific globals
  const isCloudflare =
    typeof (globalThis as any).caches !== 'undefined' ||
    typeof (globalThis as any).WebSocketPair !== 'undefined';
  checks.cloudflare = {
    ok: true,
    latencyMs: Math.round(performance.now() - cfStart),
    detail: isCloudflare
      ? 'Cloudflare Workers v8 isolate detected'
      : 'Node.js / dev runtime (bukan Cloudflare)',
  };

  // ── 2. Turso libSQL Database Connectivity ─────────────────
  const dbStart = performance.now();
  try {
    const db = c.get('db');
    // Lightweight round-trip query — no table scan
    await db.run(sql`SELECT 1`);
    const rawUrl = c.env?.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL || '';
    // Strip token / secrets from URL before returning to client
    const safeUrl = rawUrl.replace(/authToken=[^&]+/, 'authToken=***');
    checks.turso = {
      ok: true,
      latencyMs: Math.round(performance.now() - dbStart),
      detail: `Connected — ${safeUrl}`,
    };
  } catch (err: any) {
    checks.turso = {
      ok: false,
      latencyMs: Math.round(performance.now() - dbStart),
      detail: err?.message ?? 'Koneksi gagal',
    };
  }

  // ── 3. Backblaze B2 / S3-Compatible Storage ────────────────
  const b2Start = performance.now();
  try {
    const keyId = c.env?.B2_APPLICATION_KEY_ID || process.env.B2_APPLICATION_KEY_ID;
    const appKey = c.env?.B2_APPLICATION_KEY || process.env.B2_APPLICATION_KEY;
    const bucket = c.env?.B2_BUCKET_NAME || process.env.B2_BUCKET_NAME || 'psdm-evidence-bucket';
    const endpoint = c.env?.B2_ENDPOINT || process.env.B2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com';
    const region = c.env?.B2_REGION || process.env.B2_REGION || 'us-east-005';

    if (!keyId || !appKey) {
      throw new Error('B2_APPLICATION_KEY_ID atau B2_APPLICATION_KEY belum dikonfigurasi');
    }

    const s3 = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId: keyId, secretAccessKey: appKey },
      forcePathStyle: true,
    });

    // HeadBucketCommand verifies both connectivity AND credentials
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    checks.backblaze = {
      ok: true,
      latencyMs: Math.round(performance.now() - b2Start),
      detail: `Bucket "${bucket}" accessible — ${endpoint}`,
    };
  } catch (err: any) {
    checks.backblaze = {
      ok: false,
      latencyMs: Math.round(performance.now() - b2Start),
      detail: err?.message ?? 'Koneksi gagal',
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
