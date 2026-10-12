const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_SECRET = process.env.API_SECRET || 'psdm-secret-key-change-me';

app.use(express.json());

// Inisialisasi WhatsApp Client dengan sesi persisten (LocalAuth)
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: './.wwebjs_auth',
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ],
  },
});

let isReady = false;
let botStatus = 'CONNECTING'; // 'CONNECTING' | 'QR_READY' | 'CONNECTED' | 'DISCONNECTED'
let lastQrBase64 = null;

// Event saat QR Code tersedia untuk di-scan
client.on('qr', async (qr) => {
  botStatus = 'QR_READY';
  try {
    lastQrBase64 = await QRCode.toDataURL(qr, { margin: 2, scale: 8 });
  } catch (err) {
    console.error('Error generating QR DataURL:', err);
  }

  console.log('\n======================================================');
  console.log(' [SCAN QR] Silakan scan QR Code berikut dengan WhatsApp:');
  console.log('======================================================\n');
  qrcodeTerminal.generate(qr, { small: true });
});

// Event saat autentikasi berhasil
client.on('authenticated', () => {
  console.log(' [AUTH] Autentikasi sesi WhatsApp berhasil!');
});

client.on('auth_failure', (msg) => {
  botStatus = 'DISCONNECTED';
  console.error(' [AUTH ERROR] Gagal autentikasi sesi:', msg);
});

// Event saat bot siap mengirim pesan
client.on('ready', () => {
  isReady = true;
  botStatus = 'CONNECTED';
  lastQrBase64 = null;
  console.log('\n======================================================');
  console.log(' [READY] WhatsApp Bot Siap Menerima & Mengirim Pesan!');
  console.log(` Server berjalan di port ${PORT}`);
  console.log('======================================================\n');
});

// Event saat koneksi terputus
client.on('disconnected', (reason) => {
  isReady = false;
  botStatus = 'DISCONNECTED';
  lastQrBase64 = null;
  console.warn(' [DISCONNECT] WhatsApp terputus:', reason);
  console.log(' Mencoba reconnect...');
  client.initialize();
});

// Start WhatsApp Client
console.log(' [INIT] Memulai WhatsApp Client...');
client.initialize();

// Middleware validasi API Key (Keamanan Home Server)
const authenticate = (req, res, next) => {
  const token = req.headers['x-api-key'] || req.headers.authorization?.replace('Bearer ', '');
  if (API_SECRET && token !== API_SECRET) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: API Key tidak valid.',
    });
  }
  next();
};

// Helper normalisasi nomor HP ke format WhatsApp (e.g. 62812xxx@c.us)
function formatToWhatsAppId(rawPhone) {
  let cleaned = String(rawPhone).replace(/\D/g, ''); // Hapus semua non-digit
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return `${cleaned}@c.us`;
}

// ================= ROUTES =================

// Health check & Bot Status
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    botReady: isReady,
    botStatus,
    timestamp: new Date().toISOString(),
  });
});

// Proxy Status & QR Endpoint (Digunakan oleh PSDM Portal)
app.get(['/status', '/api/status'], authenticate, (req, res) => {
  res.json({
    status: botStatus,
    qr: lastQrBase64,
    timestamp: new Date().toISOString(),
  });
});

// Endpoint POST /send & /api/send
app.post(['/send', '/api/send'], authenticate, async (req, res) => {
  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({
      success: false,
      message: 'Parameter "phone" dan "message" wajib diisi.',
    });
  }

  if (!isReady) {
    return res.status(503).json({
      success: false,
      message: 'WhatsApp Bot belum siap atau sesi belum terhubung. Silakan scan QR terlebih dahulu.',
    });
  }

  try {
    const chatId = formatToWhatsAppId(phone);

    // Kirim pesan WhatsApp
    const response = await client.sendMessage(chatId, message);

    return res.json({
      success: true,
      message: 'Pesan berhasil dikirim via WhatsApp Bot.',
      data: {
        chatId,
        messageId: response?.id?._serialized,
        timestamp: response?.timestamp,
      },
    });
  } catch (error) {
    console.error(' [SEND ERROR] Gagal mengirim pesan:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengirim pesan WhatsApp.',
      error: error.message || String(error),
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n> Express Microservice listening on port ${PORT}`);
});
