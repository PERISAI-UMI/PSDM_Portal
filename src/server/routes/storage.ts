import { Hono } from 'hono';
import type { AppEnv } from '../types.ts';
import { authMiddleware } from '../middleware/auth.ts';

export const storageRouter = new Hono<AppEnv>();

// Hanya user terautentikasi yang dapat mengunggah berkas
storageRouter.use('*', authMiddleware);

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

/**
 * POST /api/storage/upload
 * Menerima berkas lampiran (multipart/form-data) dan mengunggah langsung ke Backblaze B2
 * Menggunakan Backblaze B2 Native JSON API yang 100% kompatibel dengan Cloudflare Workers V8
 */
storageRouter.post('/upload', async (c) => {
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
      return c.json({ success: false, message: `Otorisasi Backblaze B2 gagal: ${errText}` }, 502);
    }

    const authData = (await authRes.json()) as B2AuthorizeResponse;
    const { apiUrl, downloadUrl, authorizationToken: authToken } = authData;

    // 2. Dapatkan Bucket ID
    let bucketId = authData.allowed.bucketId;
    if (!bucketId) {
      // Cari bucket ID dari list buckets
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
      return c.json({ success: false, message: `Bucket ${targetBucketName} tidak ditemukan di akun Backblaze B2` }, 404);
    }

    // 3. Dapatkan Upload URL untuk Bucket
    const getUploadUrlRes = await fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
      method: 'POST',
      headers: {
        Authorization: authToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bucketId }),
    });

    if (!getUploadUrlRes.ok) {
      const errText = await getUploadUrlRes.text();
      return c.json({ success: false, message: `Gagal mendapatkan upload URL B2: ${errText}` }, 502);
    }

    const uploadUrlData = (await getUploadUrlRes.json()) as B2GetUploadUrlResponse;

    // 4. Upload File ke Backblaze B2
    const fileBytes = await file.arrayBuffer();
    const ext = file.name.split('.').pop() || 'dat';
    const cleanFileName = `evidence/${Date.now()}-${crypto.randomUUID()}.${ext}`;

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

    const publicUrl = `${downloadUrl}/file/${targetBucketName}/${cleanFileName}`;

    return c.json({
      success: true,
      message: 'Berkas berhasil diunggah ke Backblaze B2',
      data: {
        url: publicUrl,
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
