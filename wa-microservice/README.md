# WhatsApp Bot Microservice (Home Server)

Microservice berbasis Node.js, Express, dan `whatsapp-web.js` untuk menerima request pengiriman WhatsApp dari Cloudflare Workers.

## Cara Menjalankan di Home Server

### 1. Prasyarat
- Node.js versi 18 atau lebih baru.
- Google Chrome atau Chromium terpasang (jika berjalan di server headless Linux).

### 2. Instalasi
```bash
cd wa-microservice
npm install
```

### 3. Konfigurasi Lingkungan (.env)
Salin `.env.example` ke `.env`:
```bash
cp .env.example .env
```
Sesuaikan `API_SECRET` dengan string rahasia yang sama dengan yang didaftarkan di Cloudflare Workers.

### 4. Menjalankan Bot
```bash
# Mode Produksi
npm start

# Mode Development (auto-reload)
npm run dev
```

Saat pertama kali dijalankan, terminal akan mencetak **QR Code**. 
Scan QR Code tersebut menggunakan aplikasi WhatsApp di HP Anda (Perangkat Tertaut / Linked Devices). Sesi akan disimpan di folder `.wwebjs_auth/` sehingga Anda tidak perlu scan ulang setiap kali restart.

## Endpoint API

### 1. Health & Status
- **Method:** `GET /health`
- **Response:**
  ```json
  {
    "status": "ok",
    "botReady": true,
    "timestamp": "2026-10-12T12:00:00.000Z"
  }
  ```

### 2. Kirim Pesan
- **Method:** `POST /send`
- **Header:** `x-api-key: <API_SECRET>` atau `Authorization: Bearer <API_SECRET>`
- **Body (JSON):**
  ```json
  {
    "phone": "08123456789",
    "message": "Halo! Ini adalah pengumuman kegiatan dari PSDM PERISAI."
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Pesan berhasil dikirim via WhatsApp Bot.",
    "data": {
      "chatId": "628123456789@c.us",
      "messageId": "true_628123456789@c.us_..."
    }
  }
  ```
