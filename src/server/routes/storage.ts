import { Hono } from 'hono';
import type { AppEnv } from '../types.ts';
import { authMiddleware } from '../middleware/auth.ts';

export const storageRouter = new Hono<AppEnv>();

interface B2AuthorizeResponse {
  accountId: string;
  authorizationToken: string;
  apiUrl: string;
  downloadUrl: string;
  allowed: {
    bucketId?: string;
    bucketName?: string;
    capabilities: string[];
  };
}

interface B2GetUploadUrlResponse {
  bucketId: string;
  uploadUrl: string;
  authorizationToken: string;
}

interface B2AuthCache {
  apiUrl: string;
  downloadUrl: string;
  authToken: string;
  bucketId: string;
  expiresAt: number;
}

// In-memory cache authorization B2 untuk mencegah rate limiting (429) saat banyak upload bersamaan
let cachedB2Auth: B2AuthCache | null = null;

export async function getB2Credentials(
  keyId: string,
  appKey: string,
  targetBucketName: string,
  forceRefresh = false
): Promise<B2AuthCache> {
  const now = Date.now();
  if (!forceRefresh && cachedB2Auth && cachedB2Auth.expiresAt > now) {
    return cachedB2Auth;
  }

  // 1. Authorize Account ke Backblaze B2
  const basicAuth = btoa(`${keyId}:${appKey}`);
  const authRes = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
    method: 'GET',
    headers: {
      Authorization: `Basic ${basicAuth}`,
    },
  });

  if (!authRes.ok) {
    const errText = await authRes.text();
    throw new Error(`Otorisasi Backblaze B2 gagal: ${errText}`);
  }

  const authData = (await authRes.json()) as B2AuthorizeResponse;
  const { apiUrl, downloadUrl, authorizationToken: authToken } = authData;

  // 2. Dapatkan Bucket ID
  let bucketId = authData.allowed.bucketId;
  if (!bucketId) {
    const listBucketsRes = await fetch(`${apiUrl}/b2api/v2/b2_list_buckets`, {
      method: 'POST',
      headers: {
        Authorization: authToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId: authData.accountId,
        bucketName: targetBucketName,
      }),
    });

    if (listBucketsRes.ok) {
      const listData = (await listBucketsRes.json()) as { buckets: Array<{ bucketId: string; bucketName: string }> };
      const found = listData.buckets.find((b) => b.bucketName === targetBucketName);
      if (found) bucketId = found.bucketId;
    }
  }

  if (!bucketId) {
    throw new Error(`Bucket ${targetBucketName} tidak ditemukan di akun Backblaze B2`);
  }

  // Cache credentials selama 12 jam (token B2 valid 24 jam)
  cachedB2Auth = {
    apiUrl,
    downloadUrl,
    authToken,
    bucketId,
    expiresAt: now + 12 * 60 * 60 * 1000,
  };

  return cachedB2Auth;
}

/**
 * POST /api/storage/upload
 * Menerima berkas lampiran (multipart/form-data) dan mengunggah langsung ke Backblaze B2
 * Dilengkapi caching otorisasi untuk performa tinggi saat banyak pengurus upload bersamaan
 */
storageRouter.post('/upload', authMiddleware, async (c) => {
  const keyId = c.env?.B2_APPLICATION_KEY_ID || process.env.B2_APPLICATION_KEY_ID;
  const appKey = c.env?.B2_APPLICATION_KEY || process.env.B2_APPLICATION_KEY;
  const targetBucketName = c.env?.B2_BUCKET_NAME || process.env.B2_BUCKET_NAME || 'PSDM-B2';

  if (!keyId || !appKey) {
    return c.json({ success: false, message: 'Kredensial Backblaze B2 belum dikonfigurasi' }, 500);
  }

  try {
    const body = await c.req.parseBody();
    const file = body['file'];

    if (!file || !(file instanceof File)) {
      return c.json({ success: false, message: 'File bukti izin tidak ditemukan dalam form data' }, 400);
    }

    // Proteksi Kuota & Crash: Batas ukuran berkas maksimal 5 MB
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return c.json({ success: false, message: 'Ukuran berkas melebihi batas maksimal 5 MB' }, 400);
    }

    // Whitelist tipe berkas yang aman
    const ALLOWED_MIME_TYPES = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
    ];
    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return c.json(
        { success: false, message: 'Format berkas tidak didukung. Gunakan gambar (JPG, PNG, WebP) atau PDF.' },
        400
      );
    }

    // Ambil kredensial B2 dari cache
    let creds = await getB2Credentials(keyId, appKey, targetBucketName);

    // Dapatkan Upload URL untuk Bucket
    let getUploadUrlRes = await fetch(`${creds.apiUrl}/b2api/v2/b2_get_upload_url`, {
      method: 'POST',
      headers: {
        Authorization: creds.authToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bucketId: creds.bucketId }),
    });

    // Jika token kedaluwarsa (401), refresh kredensial sekali dan coba lagi
    if (getUploadUrlRes.status === 401) {
      creds = await getB2Credentials(keyId, appKey, targetBucketName, true);
      getUploadUrlRes = await fetch(`${creds.apiUrl}/b2api/v2/b2_get_upload_url`, {
        method: 'POST',
        headers: {
          Authorization: creds.authToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bucketId: creds.bucketId }),
      });
    }

    if (!getUploadUrlRes.ok) {
      const errText = await getUploadUrlRes.text();
      return c.json({ success: false, message: `Gagal mendapatkan upload URL B2: ${errText}` }, 502);
    }

    const uploadUrlData = (await getUploadUrlRes.json()) as B2GetUploadUrlResponse;

    // Upload File ke Backblaze B2
    const fileBytes = await file.arrayBuffer();
    const ext = file.name.split('.').pop() || 'dat';
    const rawFolder = typeof body['folder'] === 'string' ? body['folder'].replace(/[^a-zA-Z0-9_-]/g, '') : 'evidence';
    const folder = rawFolder || 'evidence';
    const cleanFileName = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const b2UploadRes = await fetch(uploadUrlData.uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: uploadUrlData.authorizationToken,
        'X-Bz-File-Name': cleanFileName,
        'Content-Type': file.type || 'application/octet-stream',
        'X-Bz-Content-Sha1': 'do_not_verify',
        'Content-Length': String(fileBytes.byteLength),
      },
      body: fileBytes,
    });

    if (!b2UploadRes.ok) {
      const errText = await b2UploadRes.text();
      return c.json({ success: false, message: `Gagal mengunggah berkas ke Backblaze B2: ${errText}` }, 502);
    }

    // Gunakan URL endpoint proxy internal agar berkas private B2 selalu dapat ditampilkan tanpa error 401
    const proxyUrl = `/api/storage/file/${cleanFileName}`;

    return c.json({
      success: true,
      message: 'Berkas berhasil diunggah ke Backblaze B2',
      data: {
        url: proxyUrl,
        fileName: cleanFileName,
        originalName: file.name,
        size: fileBytes.byteLength,
        contentType: file.type,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Kesalahan upload storage';
    return c.json({ success: false, message: errorMsg }, 500);
  }
});

/**
 * Handler umum streaming berkas bukti dari Backblaze B2 secara terotorisasi.
 * Menyelesaikan masalah 401 Unauthorized karena bucket B2 bersifat private.
 */
async function handleStorageFileStream(c: any) {
  const keyId = c.env?.B2_APPLICATION_KEY_ID || process.env.B2_APPLICATION_KEY_ID;
  const appKey = c.env?.B2_APPLICATION_KEY || process.env.B2_APPLICATION_KEY;
  const targetBucketName = c.env?.B2_BUCKET_NAME || process.env.B2_BUCKET_NAME || 'PSDM-B2';

  if (!keyId || !appKey) {
    return c.text('Kredensial Backblaze B2 belum dikonfigurasi', 500);
  }

  // Ekstrak nama berkas dari path URL
  const fullPath = c.req.path;
  let rawKey = fullPath.replace(/^\/api\/storage\/(file|view|preview|evidence)\//, '');
  if (rawKey === fullPath) {
    const match = fullPath.match(/\/(file|view|preview|evidence)\/(.+)$/);
    rawKey = match ? match[2] : (c.req.query('key') || '');
  }

  // Jika URL adalah /api/storage/evidence/xxx, pastikan rawKey memiliki evidence/xxx
  if (fullPath.includes('/evidence/') && !rawKey.startsWith('evidence/')) {
    rawKey = `evidence/${rawKey}`;
  }

  const decodedKey = decodeURIComponent(rawKey).trim().replace(/^\/+/, '');
  if (!decodedKey || decodedKey.includes('..')) {
    return c.text('Nama berkas tidak valid', 400);
  }

  // Cek Cloudflare Edge Cache untuk mencegah transaksi berulang ke B2
  const cache = typeof (globalThis as any).caches !== 'undefined' ? (globalThis as any).caches.default : null;
  const cacheUrl = c.req.url;
  if (cache) {
    try {
      const cached = await cache.match(cacheUrl);
      if (cached) {
        return cached;
      }
    } catch {
      // Abaikan jika cache API gagal/tidak aktif
    }
  }

  try {
    let creds = await getB2Credentials(keyId, appKey, targetBucketName);

    // 1. Coba request dengan key yang diberikan
    let b2Res = await fetch(`${creds.downloadUrl}/file/${targetBucketName}/${decodedKey}`, {
      headers: {
        Authorization: creds.authToken,
      },
    });

    // Jika token kedaluwarsa (401), perbarui kredensial sekali dan coba lagi
    if (b2Res.status === 401) {
      creds = await getB2Credentials(keyId, appKey, targetBucketName, true);
      b2Res = await fetch(`${creds.downloadUrl}/file/${targetBucketName}/${decodedKey}`, {
        headers: {
          Authorization: creds.authToken,
        },
      });
    }

    // 2. Jika 404 dan belum ber-prefix evidence/, coba dengan prefix evidence/
    if (b2Res.status === 404 && !decodedKey.startsWith('evidence/')) {
      const fallbackKey = `evidence/${decodedKey}`;
      const fallbackRes = await fetch(`${creds.downloadUrl}/file/${targetBucketName}/${fallbackKey}`, {
        headers: {
          Authorization: creds.authToken,
        },
      });
      if (fallbackRes.ok) {
        b2Res = fallbackRes;
      }
    }

    if (!b2Res.ok) {
      return c.text(`Berkas tidak ditemukan (${b2Res.status})`, b2Res.status as any);
    }

    const contentType = b2Res.headers.get('content-type') || 'application/octet-stream';
    const contentLength = b2Res.headers.get('content-length');

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    // Cache di browser dan Edge Cloudflare selama 7 hari
    headers.set('Cache-Control', 'public, max-age=604800, s-maxage=604800');
    headers.set('Content-Disposition', 'inline');
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    const finalResponse = new Response(b2Res.body, {
      status: 200,
      headers,
    });

    if (cache) {
      try {
        c.executionCtx?.waitUntil?.(cache.put(cacheUrl, finalResponse.clone()));
      } catch {
        // Fallback jika execution context tidak tersedia
      }
    }

    return finalResponse;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal mengambil berkas dari storage';
    return c.text(errorMsg, 500);
  }
}

storageRouter.get('/file/*', handleStorageFileStream);
storageRouter.get('/view/*', handleStorageFileStream);
storageRouter.get('/preview/*', handleStorageFileStream);
storageRouter.get('/evidence/*', handleStorageFileStream);
