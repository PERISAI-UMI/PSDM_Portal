# Panduan Deployment Edge Serverless (Cloudflare Workers, Turso & Backblaze B2)

Dokumen ini memuat langkah demi langkah untuk melakukan proses rilis produksi **PSDM.web 2.0** ke infrastruktur Edge global.

---

## 1. Prasyarat Akun & Peralatan CLI

Pastikan Anda telah memasang Node.js (>= 18) dan memiliki akun pada layanan berikut:
- **Cloudflare**: Akun Cloudflare Workers & Pages
- **Turso**: Akun Turso Database (`turso.tech`)
- **Backblaze B2**: Akun Cloud Storage B2 (atau Cloudflare R2)

Pasang CLI pendukung:
```bash
npm install -g wrangler @libsql/client
# atau gunakan npx
```

---

## 2. Setup Database Turso (Edge libSQL 3NF)

1. **Login ke Turso CLI**:
   ```bash
   turso auth login
   ```

2. **Buat Database Baru**:
   ```bash
   turso db create psdm-production-db --location sin
   ```
   *(Pilih lokasi terdekat, misal `sin` untuk Singapura / Asia Tenggara)*.

3. **Ambil Database URL & Auth Token**:
   ```bash
   # URL database (contoh: libsql://psdm-production-db-org.turso.io)
   turso db show psdm-production-db --url

   # Pembangkitan token otentikasi
   turso db tokens create psdm-production-db
   ```

4. **Eksekusi Migrasi Skema 3NF via Drizzle Kit**:
   ```bash
   export TURSO_DATABASE_URL="libsql://psdm-production-db-org.turso.io"
   export TURSO_AUTH_TOKEN="your-turso-auth-token"
   npx drizzle-kit push
   ```

---

## 3. Setup Bucket Backblaze B2 (Penyimpanan Berkas Izin Mahasiswa)

1. Buat bucket baru dengan nama misalnya `psdm-evidence-production`.
2. Set bucket type ke **Public** (atau Private jika menggunakan presigned download URL).
3. Buat Application Key baru di Backblaze B2 Console dengan izin `readWrite` pada bucket tersebut.
4. Simpan:
   - `B2_APPLICATION_KEY_ID`
   - `B2_APPLICATION_KEY`
   - `B2_BUCKET_NAME`
   - `B2_ENDPOINT` (contoh: `https://s3.us-east-005.backblazeb2.com`)
   - `B2_REGION` (contoh: `us-east-005`)
5. **Konfigurasi CORS pada Bucket**:
   Pastikan rules CORS mengizinkan domain website organisasi Anda:
   ```json
   [
     {
       "corsRuleName": "AllowOrgWebUpload",
       "allowedOrigins": ["*"],
       "allowedHeaders": ["*"],
       "allowedOperations": ["s3_put", "s3_get", "s3_head"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

---

## 4. Konfigurasi Rahasia di Cloudflare Workers

Gunakan Wrangler untuk menginjeksi rahasia (secrets) ke Cloudflare Edge:
```bash
npx wrangler secret put TURSO_DATABASE_URL
# Masukkan: libsql://psdm-production-db-org.turso.io

npx wrangler secret put TURSO_AUTH_TOKEN
# Masukkan token dari Turso

npx wrangler secret put SESSION_SECRET
# Masukkan string acak minimal 32 karakter untuk hashing sesi

npx wrangler secret put B2_APPLICATION_KEY_ID
# Masukkan Key ID Backblaze B2

npx wrangler secret put B2_APPLICATION_KEY
# Masukkan Application Key Backblaze B2
```

---

## 5. Build & Rilis ke Cloudflare Workers

1. **Jalankan Pengujian Integrasi Otomatis**:
   ```bash
   npm run test:integration
   ```
   Pastikan seluruh 14 skenario tes lulus (100% PASS).

2. **Kompilasi Frontend**:
   ```bash
   npm run build
   ```
   Aset statis frontend akan terkompilasi ke direktori `dist/`.

3. **Deploy ke Cloudflare**:
   ```bash
   npx wrangler deploy
   ```

Cloudflare Workers akan mempublikasikan API Edge Hono dan menyajikan frontend statis global secara bersamaan dengan latensi sub-50ms di seluruh dunia.

---

## 6. Verifikasi Pasca-Deployment

1. Buka URL Workers: `https://psdm-web-edge.<subdomain>.workers.dev/api/health`
   Pastikan respon JSON:
   ```json
   {
     "status": "ok",
     "service": "PSDM.web 2.0 API (Cloudflare Workers)",
     "edgeRuntime": "Cloudflare Workers"
   }
   ```
2. Buka dashboard web dan jalankan fitur **"Audit Tahap 6"** untuk memastikan seluruh koneksi dan aturan RBAC terverifikasi secara langsung di lingkungan produksi.
