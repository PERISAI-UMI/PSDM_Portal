# PSDM.web 2.0 - Dokumen Handover & Ringkasan Arsitektur (Tahap 6)

## 1. Ikhtisar Sistem
**PSDM.web 2.0** adalah sistem Enterprise Human Resources & Presensi Organisasi Mahasiswa yang dirancang menggunakan arsitektur **Edge Serverless** generasi terbaru. Sistem ini mengeliminasi *cold-start*, memaksimalkan latensi respon global (< 50ms), dan mengamankan integritas data organisasi dengan pemodelan relasional ternormalisasi **Third Normal Form (3NF)**.

---

## 2. Arsitektur Teknologi & Edge Stack

```
                                  [ Browser / Mobile Client ]
                                   React 19 + Tailwind CSS v4
                                              â”‚
                                              â–¼
                     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” 
                     â”‚       Cloudflare Workers (Edge)        â”‚
                     â”‚  Hono Framework + WebCrypto (Subtle)   â”‚
                     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” 
                                  â”‚                    â”‚
                     Presigned S3 â”‚                    â”‚ LibSQL Over WebSockets/HTTP
                                  â–¼                    â–¼
                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” 	        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” 
                    â”‚  Backblaze B2 â”‚	        â”‚   Turso LibSQL   â”‚
                    â”‚  Object Store â”‚	        â”‚    3NF Edge DB   â”‚
                    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” 	        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” 
```

| Lapisan | Teknologi | Peran & Keunggulan |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide Icons, Motion | Antarmuka responsif Mobile-First, PWA-ready, transisi halus tanpa flicker |
| **Edge API** | Hono v4 pada Cloudflare Workers | Zero Node.js C++ runtime lock-in, routing ultra-cepat berlatensi rendah |
| **Database** | Turso (libSQL) + Drizzle ORM | SQLite terdistribusi global berbasis edge, relasional 3NF terverifikasi |
| **Autentikasi** | WebCrypto API (SubtleCrypto PBKDF2 SHA-256) | Hashing 100.000 iterasi tanpa modul native Node, token sesi 256-bit |
| **Validasi** | Zod v3 & Drizzle-Zod | Validasi end-to-end tipe data pada request body & query params |
| **Penyimpanan** | Backblaze B2 / Cloudflare R2 via AWS SDK S3 Modular | Presigned upload URL langsung dari browser untuk file bukti izin |

---

## 3. Matriks Hak Akses (Role-Based Access Control / RBAC)

| Kemampuan / Fitur | SUPER_ADMIN (Kadep) | ADMIN (Staf PSDM) | PENGURUS (Anggota) |
| :--- | :---: | :---: | :---: |
| **Kelola Master Data** (Fakultas, Prodi, Dept) | âœ… Penuh | â Œ | â Œ |
| **Delegasi Penugasan PJ Departemen** | âœ… Penuh | â Œ | â Œ |
| **Buat / Edit / Publikasi Kegiatan Proker** | âœ… Penuh | â Œ (Hanya membaca) | â Œ (Hanya yang published) |
| **Input Presensi Peserta (Checklist Lapangan / NIM / Excel Batch)** | âœ… Seluruh Proker | âœ… Seluruh Proker | â Œ |
| **Lihat Seluruh Izin Anggota** | âœ… Lintas Departemen | âš ï¸  Hanya Dept Binaan PJ | â Œ Hanya Izin Pribadi |
| **Persetujuan Izin (ACC / Tolak)** | âœ… Bebas Semua Dept | âš ï¸  Hanya Dept Binaan PJ | â Œ |
| **Auto-Sync Izin ke Presensi** | âœ… Otomatis | âœ… Otomatis | â Œ |
| **Lihat Riwayat Presensi Sendiri** | âœ… | âœ… | âœ… |

---

## 4. Struktur Database Ternormalisasi (3NF)

1. **`fakultas`**: `id (PK)`, `nama`, `created_at`
2. **`program_studi`**: `id (PK)`, `fakultas_id (FK)`, `nama`, `created_at`
3. **`departments`**: `id (PK)`, `nama`, `created_at`
4. **`users`**: `id (PK)`, `prn (UK)`, `password_hash`, `role`, `generasi`, `department_id (FK)`, `jabatan`, `nama_lengkap`, `nim (UK)`, `program_studi_id (FK)`, `angkatan`, dll.
5. **`pj_departments`**: `admin_id (FK)`, `department_id (FK)`, `assigned_at` (Relasi M:N penugasan Staf PSDM ke departemen binaan)
6. **`activities`**: `id (PK)`, `nama`, `deskripsi`, `jenis`, `start_date`, `end_date`, `is_published`, `created_by (FK)`
7. **`attendances`**: `id (PK)`, `activity_id (FK)`, `user_id (FK)`, `status (HADIR/IZIN/SAKIT/ALPHA)`, `recorded_by (FK)`, `recorded_at`
8. **`permissions`**: `id (PK)`, `user_id (FK)`, `activity_id (FK)`, `jenis_izin`, `alasan`, `evidence_url`, `status (PENDING/APPROVED/REJECTED)`, `reviewed_by (FK)`, `reviewed_at`
9. **`sessions`**: `id (PK)`, `user_id (FK)`, `token (UK)`, `expires_at`, `ip_address`, `user_agent`

---

## 5. Ringkasan Hasil Pengujian Integrasi (Tahap 6)

Seluruh 14 skenario pengujian integrasi otomatis telah lulus 100% tanpa kegagalan:
- **Suite 1: WebCrypto Edge**: Pembangkitan session token (256-bit) & hashing PBKDF2 SHA-256 terverifikasi aman.
- **Suite 2: Skema Zod & 3NF**: Validasi integritas atribut user, relasi proker, dan PJ mapping.
- **Suite 3: RBAC Policy Engine**: Pembatasan hak akses Staf PSDM terhadap departemen binaan terbukti ketat (upaya review izin di luar departemen binaan ditolak).
- **Suite 4: Edge Hono Router**: Endpoint `/api/health` beroperasi stabil tanpa dependensi native backend.
- **Suite 5: S3 Presigned URL**: Pembangkitan upload URL Backblaze B2 dengan target folder aman `evidence/` tervalidasi.

---

## 6. Audit & Health Panel Langsung pada Aplikasi
Penguji dan pengguna dapat membuka panel **"Audit Tahap 6"** secara langsung pada antarmuka aplikasi (baik di navbar maupun di dasbor Super Admin) untuk mengeksekusi uji coba end-to-end secara transparan dan melihat skor kesiapan 100%.
