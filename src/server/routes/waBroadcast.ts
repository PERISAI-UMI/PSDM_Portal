import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, inArray, or } from 'drizzle-orm';
import type { AppEnv } from '../types.ts';
import {
  waBroadcasts,
  waBroadcastRecipients,
  activities,
  activityCategories,
  users,
  departments,
  attendances,
  appSettings,
} from '../../db/schema/index.ts';
import { authMiddleware, requireRole } from '../middleware/auth.ts';

export const waBroadcastRouter = new Hono<AppEnv>();

waBroadcastRouter.use('*', authMiddleware);

// ─── Helper: Normalisasi nomor telepon ke format internasional (628xxx) ───────
export function normalizePhoneNumber(raw?: string | null): string | null {
  if (!raw) return null;
  const cleaned = String(raw).replace(/[\s\-().+]/g, '');
  if (!cleaned) return null;

  let formatted = cleaned;
  if (formatted.startsWith('08')) {
    formatted = '62' + formatted.slice(1);
  } else if (formatted.startsWith('8') && formatted.length >= 9) {
    formatted = '62' + formatted;
  }

  // Validasi: pastikan nomor diawali '628' dan memiliki panjang digit yang valid (10-15 digit)
  if (/^628\d{7,12}$/.test(formatted)) {
    return formatted;
  }

  // Jika nomor internasional lain (contoh 60xxx, dll) minimal 9 digit
  if (/^[1-9]\d{8,14}$/.test(formatted)) {
    return formatted;
  }

  return null;
}

// ─── Helper: Render template pesan untuk satu penerima ───────────────────────
function renderMessage(
  template: string,
  vars: {
    nama: string;
    namaKegiatan: string;
    tanggalKegiatan: string;
    lokasi: string;
    status: string;
  }
): string {
  return template
    .replace(/\{\{nama\}\}/g, vars.nama)
    .replace(/\{\{namaKegiatan\}\}/g, vars.namaKegiatan)
    .replace(/\{\{tanggalKegiatan\}\}/g, vars.tanggalKegiatan)
    .replace(/\{\{lokasi\}\}/g, vars.lokasi)
    .replace(/\{\{status\}\}/g, vars.status);
}

// ─── Schema validasi ─────────────────────────────────────────────────────────
const createBroadcastSchema = z.object({
  activityId: z.string().min(1, 'Activity ID wajib diisi'),
  /**
   * Template pesan kustom opsional. Variabel yang tersedia:
   * {{nama}}, {{namaKegiatan}}, {{tanggalKegiatan}}, {{lokasi}}, {{status}}
   *
   * Jika tidak diisi, sistem akan menggunakan template default.
   */
  messageTemplate: z.string().optional(),
  /**
   * Filter siapa yang menerima broadcast:
   * - 'ALL'     : semua peserta yang terdaftar absensi
   * - 'ALPHA'   : hanya yang Alpha
   * - 'TELAT'   : hanya yang Telat
   * - custom    : array userId spesifik
   */
  targetFilter: z
    .union([z.enum(['ALL', 'ALPHA', 'TELAT', 'IZIN', 'SAKIT', 'HADIR']), z.literal('CUSTOM')])
    .default('ALL'),
  customUserIds: z.array(z.string()).optional(),
});

const patchRecipientSchema = z.object({
  status: z.enum(['SENT', 'FAILED']),
});

// ─── GET /api/wa-broadcast/:activityId ────────────────────────────────────────
// Ambil broadcast beserta daftar penerima untuk satu kegiatan (jika sudah ada)
waBroadcastRouter.get(
  '/:activityId',
  requireRole(['SUPER_ADMIN']),
  async (c) => {
    const activityId = c.req.param('activityId');
    const db = c.get('db');

    // Cek apakah kegiatan ada
    const activityRecord = await db
      .select({
        id: activities.id,
        nama: activities.nama,
        startDate: activities.startDate,
        lokasi: activities.lokasi,
        mode: activities.mode,
        categoryNama: activityCategories.nama,
      })
      .from(activities)
      .leftJoin(activityCategories, eq(activities.categoryId, activityCategories.id))
      .where(eq(activities.id, activityId))
      .limit(1);

    if (!activityRecord || activityRecord.length === 0) {
      return c.json({ success: false, message: 'Kegiatan tidak ditemukan' }, 404);
    }

    // Cek apakah broadcast sudah dibuat
    const broadcastRecord = await db
      .select()
      .from(waBroadcasts)
      .where(eq(waBroadcasts.activityId, activityId))
      .limit(1);

    if (!broadcastRecord || broadcastRecord.length === 0) {
      return c.json({
        success: true,
        data: {
          broadcast: null,
          activity: activityRecord[0],
          recipients: [],
        },
      });
    }

    const broadcast = broadcastRecord[0];

    // Ambil daftar penerima beserta info user
    const recipients = await db
      .select({
        id: waBroadcastRecipients.id,
        broadcastId: waBroadcastRecipients.broadcastId,
        userId: waBroadcastRecipients.userId,
        namaLengkap: users.namaLengkap,
        prn: users.prn,
        departmentNama: departments.nama,
        jabatan: users.jabatan,
        phoneNumber: waBroadcastRecipients.phoneNumber,
        renderedMessage: waBroadcastRecipients.renderedMessage,
        status: waBroadcastRecipients.status,
        error: waBroadcastRecipients.error,
        sentAt: waBroadcastRecipients.sentAt,
        sentBy: waBroadcastRecipients.sentBy,
      })
      .from(waBroadcastRecipients)
      .innerJoin(users, eq(waBroadcastRecipients.userId, users.id))
      .innerJoin(departments, eq(users.departmentId, departments.id))
      .where(eq(waBroadcastRecipients.broadcastId, broadcast.id))
      .all();

    // Statistik ringkasan
    const totalRecipients = recipients.length;
    const sentCount = recipients.filter((r) => r.status === 'SENT').length;
    const pendingCount = recipients.filter((r) => r.status === 'PENDING').length;
    const failedCount = recipients.filter((r) => r.status === 'FAILED').length;
    const skippedCount = recipients.filter((r) => r.status === 'SKIPPED').length;

    return c.json({
      success: true,
      data: {
        broadcast: {
          id: broadcast.id,
          activityId: broadcast.activityId,
          messageTemplate: broadcast.messageTemplate,
          createdAt: broadcast.createdAt,
          summary: {
            total: totalRecipients,
            sent: sentCount,
            pending: pendingCount,
            failed: failedCount,
            skipped: skippedCount,
          },
        },
        activity: activityRecord[0],
        recipients,
      },
    });
  }
);

// ─── POST /api/wa-broadcast ───────────────────────────────────────────────────
// Buat broadcast baru (atau reset ulang) untuk suatu kegiatan.
// Backend merangkai pesan per penerima berdasarkan data absensi.
waBroadcastRouter.post(
  '/',
  requireRole(['SUPER_ADMIN']),
  zValidator('json', createBroadcastSchema),
  async (c) => {
    const { activityId, messageTemplate, targetFilter, customUserIds } = c.req.valid('json');
    const currentUser = c.get('user');
    const db = c.get('db');

    // 1. Ambil detail kegiatan
    const activityRecord = await db
      .select({
        id: activities.id,
        nama: activities.nama,
        startDate: activities.startDate,
        lokasi: activities.lokasi,
        mode: activities.mode,
      })
      .from(activities)
      .where(eq(activities.id, activityId))
      .limit(1);

    if (!activityRecord || activityRecord.length === 0) {
      return c.json({ success: false, message: 'Kegiatan tidak ditemukan' }, 404);
    }

    const activity = activityRecord[0];

    // 2. Tentukan template pesan (default atau kustom)
    const tanggalKegiatan = new Date(activity.startDate).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Makassar',
    });

    const lokasiText =
      activity.mode === 'ONLINE' ? 'Online (Meeting Virtual)' : (activity.lokasi || 'TBA');

    const defaultTemplate =
      `Halo, {{nama}} 👋\n\n` +
      `Berikut informasi mengenai kegiatan PSDM PERISAI:\n\n` +
      `📌 *Kegiatan:* {{namaKegiatan}}\n` +
      `📅 *Tanggal:* {{tanggalKegiatan}}\n` +
      `📍 *Lokasi:* {{lokasi}}\n` +
      `✅ *Status Kehadiranmu:* {{status}}\n\n` +
      `Harap konfirmasi kehadiranmu. Terima kasih! 🙏`;

    const finalTemplate = messageTemplate?.trim() || defaultTemplate;

    // 3. Ambil data absensi sesuai filter
    let attendanceQuery = db
      .select({
        userId: attendances.userId,
        status: attendances.status,
        namaLengkap: users.namaLengkap,
        noTelp: users.noTelp,
        prn: users.prn,
        jabatan: users.jabatan,
        departmentNama: departments.nama,
        departmentId: departments.id,
      })
      .from(attendances)
      .innerJoin(users, eq(attendances.userId, users.id))
      .innerJoin(departments, eq(users.departmentId, departments.id))
      .where(eq(attendances.activityId, activityId));

    const allAttendances = await attendanceQuery.all();

    if (allAttendances.length === 0) {
      return c.json(
        {
          success: false,
          message:
            'Belum ada data presensi untuk kegiatan ini. Catat presensi terlebih dahulu sebelum membuat broadcast.',
        },
        400
      );
    }

    // 4. Filter penerima berdasarkan targetFilter
    let targetAttendances = allAttendances;

    if (targetFilter === 'CUSTOM') {
      if (!customUserIds || customUserIds.length === 0) {
        return c.json(
          { success: false, message: 'customUserIds wajib diisi untuk filter CUSTOM' },
          400
        );
      }
      targetAttendances = allAttendances.filter((a) => customUserIds.includes(a.userId));
    } else if (targetFilter !== 'ALL') {
      // Filter berdasarkan status presensi: ALPHA, TELAT, IZIN, SAKIT, HADIR
      targetAttendances = allAttendances.filter((a) => a.status === targetFilter);
    }

    if (targetAttendances.length === 0) {
      return c.json(
        {
          success: false,
          message: `Tidak ada peserta dengan filter "${targetFilter}" pada kegiatan ini.`,
        },
        400
      );
    }

    // 5. Normalisasi nomor telepon & cek invalid
    const invalidPhones: string[] = [];
    const recipientsData = targetAttendances.map((att) => {
      const normalizedPhone = normalizePhoneNumber(att.noTelp);
      if (!normalizedPhone) {
        invalidPhones.push(att.namaLengkap);
      }

      const renderedMessage = renderMessage(finalTemplate, {
        nama: att.namaLengkap,
        namaKegiatan: activity.nama,
        tanggalKegiatan,
        lokasi: lokasiText,
        status: att.status,
      });

      return {
        userId: att.userId,
        phoneNumber: normalizedPhone || att.noTelp, // Fallback ke nomor asli jika gagal normalisasi
        renderedMessage,
      };
    });

    // 6. Upsert tabel wa_broadcasts (hapus recipients lama, buat baru)
    const broadcastId = crypto.randomUUID();
    const now = new Date();

    // Cek apakah sudah ada broadcast sebelumnya untuk kegiatan ini
    const existing = await db
      .select({ id: waBroadcasts.id })
      .from(waBroadcasts)
      .where(eq(waBroadcasts.activityId, activityId))
      .limit(1);

    let finalBroadcastId: string;

    if (existing && existing.length > 0) {
      // Update broadcast yang ada, hapus recipients lama
      finalBroadcastId = existing[0].id;
      await db
        .update(waBroadcasts)
        .set({ messageTemplate: finalTemplate, updatedAt: now })
        .where(eq(waBroadcasts.id, finalBroadcastId));
      await db
        .delete(waBroadcastRecipients)
        .where(eq(waBroadcastRecipients.broadcastId, finalBroadcastId));
    } else {
      // Buat broadcast baru
      finalBroadcastId = broadcastId;
      await db.insert(waBroadcasts).values({
        id: finalBroadcastId,
        activityId,
        messageTemplate: finalTemplate,
        createdBy: currentUser.id,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 7. Insert recipients dalam batch (hemat subrequest ke Turso)
    const CHUNK_SIZE = 50;
    for (let i = 0; i < recipientsData.length; i += CHUNK_SIZE) {
      const chunk = recipientsData.slice(i, i + CHUNK_SIZE);
      await db.insert(waBroadcastRecipients).values(
        chunk.map((r) => ({
          id: crypto.randomUUID(),
          broadcastId: finalBroadcastId,
          userId: r.userId,
          renderedMessage: r.renderedMessage,
          phoneNumber: r.phoneNumber,
          status: 'PENDING' as const,
          sentAt: null,
          sentBy: null,
        }))
      );
    }

    return c.json(
      {
        success: true,
        message: `Broadcast berhasil disiapkan untuk ${recipientsData.length} penerima.`,
        data: {
          broadcastId: finalBroadcastId,
          totalRecipients: recipientsData.length,
          invalidPhoneWarnings: invalidPhones.length > 0 ? invalidPhones : undefined,
        },
      },
      201
    );
  }
);

// ─── PATCH /api/wa-broadcast/recipients/:recipientId ────────────────────────
// Dipanggil oleh frontend setelah user klik tombol "Kirim WA" dan tab wa.me terbuka.
// Mengubah status penerima menjadi SENT atau FAILED.
waBroadcastRouter.patch(
  '/recipients/:recipientId',
  requireRole(['SUPER_ADMIN']),
  zValidator('json', patchRecipientSchema),
  async (c) => {
    const recipientId = c.req.param('recipientId');
    const { status } = c.req.valid('json');
    const currentUser = c.get('user');
    const db = c.get('db');

    // Cek apakah recipient ada
    const existing = await db
      .select({ id: waBroadcastRecipients.id, currentStatus: waBroadcastRecipients.status })
      .from(waBroadcastRecipients)
      .where(eq(waBroadcastRecipients.id, recipientId))
      .limit(1);

    if (!existing || existing.length === 0) {
      return c.json({ success: false, message: 'Penerima tidak ditemukan' }, 404);
    }

    const now = new Date();

    await db
      .update(waBroadcastRecipients)
      .set({
        status,
        sentAt: now,
        sentBy: currentUser.id,
      })
      .where(eq(waBroadcastRecipients.id, recipientId));

    return c.json({
      success: true,
      message: status === 'SENT' ? 'Pesan WhatsApp berhasil ditandai terkirim ✅' : 'Pesan ditandai gagal terkirim ❌',
      data: { id: recipientId, status, sentAt: now },
    });
  }
);

// ─── PATCH /api/wa-broadcast/recipients/:recipientId/reset ───────────────────
// Reset status satu penerima kembali ke PENDING (undo kirim)
waBroadcastRouter.patch(
  '/recipients/:recipientId/reset',
  requireRole(['SUPER_ADMIN']),
  async (c) => {
    const recipientId = c.req.param('recipientId');
    const db = c.get('db');

    const existing = await db
      .select({ id: waBroadcastRecipients.id })
      .from(waBroadcastRecipients)
      .where(eq(waBroadcastRecipients.id, recipientId))
      .limit(1);

    if (!existing || existing.length === 0) {
      return c.json({ success: false, message: 'Penerima tidak ditemukan' }, 404);
    }

    await db
      .update(waBroadcastRecipients)
      .set({ status: 'PENDING', sentAt: null, sentBy: null })
      .where(eq(waBroadcastRecipients.id, recipientId));

    return c.json({ success: true, message: 'Status penerima berhasil direset ke PENDING' });
  }
);

// ─── DELETE /api/wa-broadcast/:activityId ────────────────────────────────────
// Hapus broadcast beserta seluruh penerimanya untuk suatu kegiatan
waBroadcastRouter.delete(
  '/:activityId',
  requireRole(['SUPER_ADMIN']),
  async (c) => {
    const activityId = c.req.param('activityId');
    const db = c.get('db');

    const existing = await db
      .select({ id: waBroadcasts.id })
      .from(waBroadcasts)
      .where(eq(waBroadcasts.activityId, activityId))
      .limit(1);

    if (!existing || existing.length === 0) {
      return c.json({ success: false, message: 'Broadcast tidak ditemukan untuk kegiatan ini' }, 404);
    }

    // Recipients akan terhapus otomatis via ON DELETE CASCADE
    await db.delete(waBroadcasts).where(eq(waBroadcasts.activityId, activityId));

    return c.json({ success: true, message: 'Broadcast berhasil dihapus' });
  }
);

// ─── POST /api/broadcasts/:id/send-single (atau /api/wa-broadcast/:id/send-single) ───
// Mengirim pesan WhatsApp ke satu penerima secara langsung melalui Bot Microservice
const sendSingleSchema = z.object({
  userId: z.string().min(1, 'userId wajib diisi'),
});

waBroadcastRouter.post(
  '/:id/send-single',
  requireRole(['SUPER_ADMIN']),
  zValidator('json', sendSingleSchema),
  async (c) => {
    const broadcastParamId = c.req.param('id');
    const { userId } = c.req.valid('json');
    const currentUser = c.get('user');
    const db = c.get('db');

    // 1. Ambil broadcast (mendukung id langsung maupun activityId)
    const broadcastRecord = await db
      .select()
      .from(waBroadcasts)
      .where(or(eq(waBroadcasts.id, broadcastParamId), eq(waBroadcasts.activityId, broadcastParamId)))
      .limit(1);

    const targetBroadcastId = broadcastRecord[0]?.id || broadcastParamId;

    // 2. Cek apakah penerima ada dalam broadcast ini
    const recipientRecords = await db
      .select()
      .from(waBroadcastRecipients)
      .where(
        and(
          eq(waBroadcastRecipients.broadcastId, targetBroadcastId),
          eq(waBroadcastRecipients.userId, userId)
        )
      )
      .limit(1);

    if (!recipientRecords || recipientRecords.length === 0) {
      return c.json(
        {
          success: false,
          message: 'Penerima tidak terdaftar dalam broadcast kegiatan ini.',
        },
        404
      );
    }

    const recipient = recipientRecords[0];

    // 3. Pastikan status masih PENDING atau FAILED. Jika sudah SENT, tolak
    if (recipient.status === 'SENT') {
      return c.json(
        {
          success: false,
          message: 'Pesan WhatsApp untuk pengguna ini sudah terkirim sebelumnya (status: SENT).',
        },
        400
      );
    }

    // 4. Ambil nomor telepon terbaru dari tabel users
    const userRecords = await db
      .select({
        id: users.id,
        namaLengkap: users.namaLengkap,
        noTelp: users.noTelp,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const rawPhone = userRecords[0]?.noTelp || recipient.phoneNumber;
    const normalizedPhone = normalizePhoneNumber(rawPhone);

    // Jika nomor tidak valid, ubah status menjadi SKIPPED
    if (!normalizedPhone) {
      const errorMsg = 'Nomor telepon tidak valid (harus diawali 08/628 dan minimal 10 digit).';
      await db
        .update(waBroadcastRecipients)
        .set({
          status: 'SKIPPED',
          error: errorMsg,
        })
        .where(eq(waBroadcastRecipients.id, recipient.id));

      return c.json(
        {
          success: false,
          message: `Nomor telepon untuk ${userRecords[0]?.namaLengkap || 'peserta'} tidak valid. Status otomatis diubah menjadi SKIPPED.`,
          error: errorMsg,
        },
        400
      );
    }

    // 5. Ambil pesan final
    const finalMessage = recipient.renderedMessage || broadcastRecord[0]?.messageTemplate;
    if (!finalMessage) {
      return c.json(
        {
          success: false,
          message: 'Pesan broadcast tidak ditemukan atau belum dirangkai.',
        },
        400
      );
    }

    // 6. Ambil konfigurasi Bot WA dari tabel app_settings di database
    const settingsRows = await db
      .select()
      .from(appSettings)
      .where(inArray(appSettings.key, ['wa_bot_url', 'wa_api_key']))
      .all();

    const dbSettings: Record<string, string> = {};
    for (const row of settingsRows) {
      dbSettings[row.key] = row.value;
    }

    const botUrl = dbSettings['wa_bot_url']?.trim() || c.env?.WA_BOT_URL || process.env.WA_BOT_URL;
    const apiKey = dbSettings['wa_api_key']?.trim() || c.env?.WA_API_KEY || process.env.WA_API_KEY;

    if (!botUrl) {
      return c.json(
        {
          success: false,
          message:
            'WhatsApp Bot URL belum dikonfigurasi di Pengaturan (Settings). Silakan buka menu Pengaturan untuk memasukkan URL Bot.',
        },
        400
      );
    }

    const cleanBaseUrl = botUrl.replace(/\/+$/, '');
    // Mendukung baik /api/send maupun /send pada endpoint bot
    const targetEndpoint = cleanBaseUrl.endsWith('/send')
      ? cleanBaseUrl
      : `${cleanBaseUrl}/api/send`;

    // 7. Lakukan fetch ke Home Server Bot WhatsApp
    try {
      const botResponse = await fetch(targetEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-api-key': apiKey, Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          phone: normalizedPhone,
          message: finalMessage,
        }),
      });

      const botResult = (await botResponse.json().catch(() => null)) as {
        success?: boolean;
        message?: string;
        error?: string;
        data?: any;
      } | null;

      // Handle response bot gagal
      if (!botResponse.ok || (botResult && botResult.success === false)) {
        const errorMsg =
          botResult?.message ||
          botResult?.error ||
          `HTTP ${botResponse.status}: ${botResponse.statusText}`;

        await db
          .update(waBroadcastRecipients)
          .set({
            status: 'FAILED',
            error: errorMsg,
          })
          .where(eq(waBroadcastRecipients.id, recipient.id));

        return c.json(
          {
            success: false,
            message: `Bot WhatsApp gagal mengirim pesan: ${errorMsg}`,
            error: errorMsg,
          },
          400
        );
      }

      // Handle response bot sukses
      const now = new Date();
      await db
        .update(waBroadcastRecipients)
        .set({
          status: 'SENT',
          error: null,
          sentAt: now,
          sentBy: currentUser.id,
          phoneNumber: normalizedPhone,
        })
        .where(eq(waBroadcastRecipients.id, recipient.id));

      return c.json({
        success: true,
        message: `Pesan WhatsApp berhasil dikirim ke ${userRecords[0]?.namaLengkap || normalizedPhone}!`,
        data: {
          recipientId: recipient.id,
          userId,
          phone: normalizedPhone,
          status: 'SENT',
          sentAt: now,
          botResponse: botResult,
        },
      });
    } catch (networkError: any) {
      // 8. Handle Network / Timeout Error saat menghubungi Home Server
      const errorMsg =
        networkError?.message || 'Gagal terhubung ke Home Server bot WA (koneksi terputus/offline).';

      await db
        .update(waBroadcastRecipients)
        .set({
          status: 'FAILED',
          error: errorMsg,
        })
        .where(eq(waBroadcastRecipients.id, recipient.id));

      return c.json(
        {
          success: false,
          message: `Terjadi gangguan koneksi ke Home Server Bot: ${errorMsg}`,
          error: errorMsg,
        },
        503
      );
    }
  }
);
