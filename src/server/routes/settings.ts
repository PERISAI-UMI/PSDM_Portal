import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, inArray } from 'drizzle-orm';
import type { AppEnv } from '../types.ts';
import { appSettings } from '../../db/schema/index.ts';
import { authMiddleware, requireRole } from '../middleware/auth.ts';

export const settingsRouter = new Hono<AppEnv>();

// Seluruh endpoint /api/settings hanya boleh diakses oleh SUPER_ADMIN yang sudah login
settingsRouter.use('*', authMiddleware);
settingsRouter.use('*', requireRole(['SUPER_ADMIN']));

// ─── 1. GET /api/settings ─────────────────────────────────────────────────────
// Mengambil semua setting aplikasi
settingsRouter.get('/', async (c) => {
  const db = c.get('db');
  const rows = await db.select().from(appSettings).all();

  const settingsObj: Record<string, string> = {
    wa_bot_url: '',
    wa_api_key: '',
  };

  for (const row of rows) {
    settingsObj[row.key] = row.value;
  }

  return c.json({
    success: true,
    data: settingsObj,
  });
});

// ─── 2. PUT /api/settings ─────────────────────────────────────────────────────
// Mengupdate setting wa_bot_url dan wa_api_key
const updateSettingsSchema = z.object({
  wa_bot_url: z.string().optional(),
  wa_api_key: z.string().optional(),
});

settingsRouter.put('/', zValidator('json', updateSettingsSchema), async (c) => {
  const db = c.get('db');
  const body = c.req.valid('json');
  const now = new Date();

  const updates: Array<{ key: string; value: string }> = [];
  if (body.wa_bot_url !== undefined) {
    updates.push({ key: 'wa_bot_url', value: body.wa_bot_url.trim() });
  }
  if (body.wa_api_key !== undefined) {
    updates.push({ key: 'wa_api_key', value: body.wa_api_key.trim() });
  }

  for (const { key, value } of updates) {
    const existing = await db
      .select({ key: appSettings.key })
      .from(appSettings)
      .where(eq(appSettings.key, key))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(appSettings)
        .set({ value, updatedAt: now })
        .where(eq(appSettings.key, key));
    } else {
      await db.insert(appSettings).values({ key, value, updatedAt: now });
    }
  }

  return c.json({
    success: true,
    message: 'Pengaturan WhatsApp Bot berhasil disimpan ke database.',
    data: body,
  });
});

// ─── 3. GET /api/settings/bot-status ──────────────────────────────────────────
// Endpoint Proxy untuk memeriksa koneksi ke Home Server Bot WhatsApp
settingsRouter.get('/bot-status', async (c) => {
  const db = c.get('db');

  const rows = await db
    .select()
    .from(appSettings)
    .where(inArray(appSettings.key, ['wa_bot_url', 'wa_api_key']))
    .all();

  const settingsMap: Record<string, string> = {};
  for (const r of rows) {
    settingsMap[r.key] = r.value;
  }

  const waBotUrl = settingsMap['wa_bot_url']?.trim();
  const waApiKey = settingsMap['wa_api_key']?.trim();

  // Jika URL belum disetel di database
  if (!waBotUrl) {
    return c.json({
      success: true,
      status: 'NOT_CONFIGURED',
      qr: null,
      message: 'WhatsApp Bot URL belum dikonfigurasi di database.',
    });
  }

  const cleanBaseUrl = waBotUrl.replace(/\/+$/, '');
  const targetUrl = cleanBaseUrl.endsWith('/status')
    ? cleanBaseUrl
    : cleanBaseUrl.endsWith('/api')
    ? `${cleanBaseUrl}/status`
    : `${cleanBaseUrl}/api/status`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const resp = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(waApiKey ? { 'x-api-key': waApiKey, Authorization: `Bearer ${waApiKey}` } : {}),
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!resp.ok) {
      return c.json({
        success: false,
        status: resp.status >= 500 ? 'OFFLINE' : 'ERROR',
        qr: null,
        message: `Home Server merespons dengan HTTP ${resp.status}: ${resp.statusText}`,
      });
    }

    const data = (await resp.json().catch(() => null)) as {
      status?: string;
      qr?: string | null;
      botReady?: boolean;
    } | null;

    if (!data) {
      return c.json({
        success: false,
        status: 'OFFLINE',
        qr: null,
        message: 'Response tidak valid dari Home Server.',
      });
    }

    // Normalisasi status dari bot server ke nilai yang dikenal frontend
    // Bot bisa mengembalikan 'READY', 'CONNECTED', atau nilai lain yang berarti siap
    const rawStatus: string = data.status || (data.botReady ? 'CONNECTED' : 'DISCONNECTED');
    const READY_ALIASES = ['READY', 'CONNECTED', 'OPEN'];
    const normalizedStatus = READY_ALIASES.includes(rawStatus.toUpperCase())
      ? 'CONNECTED'
      : rawStatus;

    return c.json({
      success: true,
      status: normalizedStatus,
      qr: data.qr || null,
      message: 'Status bot berhasil diambil.',
    });
  } catch (err: any) {
    const isTimeout = err?.name === 'AbortError';
    return c.json({
      success: false,
      status: 'OFFLINE',
      qr: null,
      message: isTimeout
        ? 'Koneksi ke Home Server timed out (8 detik). Pastikan bot aktif dan tunnel berjalan.'
        : `Bot WhatsApp sedang offline / tunnel terputus: ${err?.message || 'Koneksi gagal'}`,
    });
  }
});
