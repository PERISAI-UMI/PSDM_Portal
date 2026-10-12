import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Bot,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Save,
  Key,
  Globe,
  Eye,
  EyeOff,
  Server,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import type { WaBotConnectionStatus, WaBotStatusResponse } from '../../types/index.ts';

interface SettingsViewProps {
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onShowToast }) => {
  // Form State
  const [waBotUrl, setWaBotUrl] = useState('');
  const [waApiKey, setWaApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Status State
  const [botStatus, setBotStatus] = useState<WaBotConnectionStatus>('NOT_CONFIGURED');
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);

  // Ref untuk polling
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch initial settings
  const fetchSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const res = await api.getSettings();
      if (res.success && res.data) {
        setWaBotUrl(res.data.wa_bot_url || '');
        setWaApiKey(res.data.wa_api_key || '');
      }
    } catch (err: any) {
      console.error('Failed to load settings:', err);
      onShowToast?.(err.message || 'Gagal memuat pengaturan.', 'error');
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // 2. Check Bot Status (via backend Proxy)
  const checkBotStatus = async (silent = false) => {
    if (!silent) setIsCheckingStatus(true);
    try {
      const res: WaBotStatusResponse = await api.getBotStatus();
      setBotStatus(res.status);
      setQrCodeData(res.qr || null);
      setStatusMessage(res.message || '');
      setLastCheckedAt(new Date());
    } catch (err: any) {
      setBotStatus('ERROR');
      setQrCodeData(null);
      setStatusMessage(err.message || 'Gagal menghubungi server proxy bot.');
      setLastCheckedAt(new Date());
    } finally {
      if (!silent) setIsCheckingStatus(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    checkBotStatus();
  }, []);

  // 3. Polling otomatis: jika status QR_READY atau CONNECTING, poll tiap 3 detik
  useEffect(() => {
    if (botStatus === 'QR_READY' || botStatus === 'CONNECTING') {
      pollingRef.current = setInterval(() => {
        checkBotStatus(true);
      }, 3000);
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [botStatus]);

  // 4. Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.updateSettings({
        wa_bot_url: waBotUrl.trim(),
        wa_api_key: waApiKey.trim(),
      });

      if (res.success) {
        onShowToast?.('Pengaturan WhatsApp Bot berhasil disimpan!', 'success');
        // Refresh status setelah simpan
        setTimeout(() => checkBotStatus(false), 500);
      } else {
        onShowToast?.(res.message || 'Gagal menyimpan pengaturan.', 'error');
      }
    } catch (err: any) {
      onShowToast?.(err.message || 'Terjadi kesalahan saat menyimpan.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper badge warna status
  const renderStatusBadge = () => {
    switch (botStatus) {
      case 'CONNECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Terhubung & Siap Kirim
          </span>
        );
      case 'QR_READY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:text-amber-300 border border-amber-200/80">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            Menunggu Scan QR Code
          </span>
        );
      case 'CONNECTING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:text-blue-300 border border-blue-200/80">
            <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
            Menghubungkan ke WhatsApp...
          </span>
        );
      case 'DISCONNECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-200/80">
            <XCircle className="w-3 h-3 text-slate-500" />
            Terputus / Sesi Berakhir
          </span>
        );
      case 'OFFLINE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:text-rose-300 border border-rose-200/80">
            <XCircle className="w-3 h-3 text-rose-500" />
            Bot Offline / Tunnel Terputus
          </span>
        );
      case 'NOT_CONFIGURED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-200/80">
            <HelpCircle className="w-3 h-3 text-slate-500" />
            Belum Dikonfigurasi
          </span>
        );
      case 'ERROR':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:text-rose-300 border border-rose-200/80">
            <AlertTriangle className="w-3 h-3 text-rose-500" />
            Koneksi Error
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-50 text-brand rounded-xl border border-brand-200/50">
              <Settings className="w-5 h-5 text-brand" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Pengaturan Sistem</h1>
            <span className="px-2.5 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 dark:text-amber-300 border border-amber-200/80 rounded-md uppercase tracking-wider">
              Super Admin Only
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi dinamis WhatsApp Bot Microservice di Home Server dan integrasi sistem.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => checkBotStatus(false)}
            disabled={isCheckingStatus}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-surface border border-slate-200/80 rounded-lg hover:bg-slate-100 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin' : ''}`} />
            Periksa Status Bot
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Form Konfigurasi (7 cols) */}
        <div className="lg:col-span-7 bg-surface rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100/80 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-md bg-brand-50 text-brand">
                <Server className="w-4 h-4 text-brand" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Koneksi WhatsApp Microservice</h2>
            </div>
            <span className="text-[11px] text-slate-400">Tersimpan di Database</span>
          </div>

          <form onSubmit={handleSaveSettings} className="p-6 space-y-5">
            {isLoadingSettings ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-brand" />
                <span className="text-xs">Memuat pengaturan dari database...</span>
              </div>
            ) : (
              <>
                {/* Field 1: WhatsApp Bot URL */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    WhatsApp Bot URL (Cloudflare Tunnel)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Globe className="w-4 h-4" />
                    </div>
                    <input
                      type="url"
                      required
                      value={waBotUrl}
                      onChange={(e) => setWaBotUrl(e.target.value)}
                      placeholder="https://wa-bot.domain-anda.com atau https://xxxx.trycloudflare.com"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-surface border border-slate-200/80 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Masukkan URL publik HTTPS hasil dari <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10.5px] border border-slate-200/60">cloudflared tunnel</code> yang mengarah ke port bot di home server Anda.
                  </p>
                </div>

                {/* Field 2: API Key */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    API Secret Key (Header <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10.5px] border border-slate-200/60">x-api-key</code>)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Key className="w-4 h-4" />
                    </div>
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={waApiKey}
                      onChange={(e) => setWaApiKey(e.target.value)}
                      placeholder="Masukkan secret key yang sama dengan .env bot"
                      className="w-full pl-9 pr-10 py-2 text-xs bg-surface border border-slate-200/80 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Digunakan untuk mengamankan home server agar hanya sistem PSDM PERISAI yang dapat memicu pengiriman pesan.
                  </p>
                </div>

                {/* Panduan Singkat */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Arsitektur Aman & Fleksibel:
                  </div>
                  <p>
                    Pengaturan ini disimpan di tabel <code className="px-1.5 py-0.5 rounded bg-slate-100/80 text-slate-800 dark:text-slate-200 font-mono text-[10.5px] border border-slate-200/60">app_settings</code> Turso database. Perubahan dapat dilakukan langsung kapan saja tanpa perlu deploy ulang Cloudflare Worker!
                  </p>
                </div>

                {/* Tombol Simpan */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand-500 text-white text-xs font-semibold rounded-lg transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        Simpan Pengaturan
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        {/* Kolom Kanan: Card WhatsApp Connection Status (5 cols) */}
        <div className="lg:col-span-5 bg-surface rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100/80 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-md bg-emerald-50 text-emerald-600 dark:text-emerald-400">
                <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">WhatsApp Connection Status</h2>
            </div>
            {isCheckingStatus && <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand" />}
          </div>

          <div className="p-6 space-y-5 text-center">
            {/* Status Badge */}
            <div className="flex flex-col items-center justify-center gap-2">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Status Bot Saat Ini
              </span>
              {renderStatusBadge()}
            </div>

            {/* Area Tampilan Berdasarkan Status */}
            {botStatus === 'CONNECTED' && (
              <div className="py-6 px-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Bot Siap Digunakan!</h3>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                    WhatsApp Bot di Home Server Anda sudah terautentikasi dan siap mengeksekusi pengiriman broadcast kegiatan.
                  </p>
                </div>
              </div>
            )}

            {botStatus === 'QR_READY' && (
              <div className="py-4 px-3 bg-amber-50/50 border border-amber-200/80 rounded-xl space-y-4">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                  <QrCode className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Scan QR Code dengan WhatsApp HP</span>
                </div>

                {qrCodeData ? (
                  <div className="bg-white p-3 rounded-xl shadow-xs border border-slate-200 inline-block mx-auto">
                    <img
                      src={qrCodeData}
                      alt="WhatsApp QR Code"
                      className="w-56 h-56 object-contain rounded-lg mx-auto"
                    />
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
                    <span className="text-xs">Memuat gambar QR Code...</span>
                  </div>
                )}

                <div className="text-[11px] text-amber-900 dark:text-amber-300 text-left bg-surface/90 p-3 rounded-lg border border-amber-200/60 space-y-1">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">Langkah Tautkan Perangkat:</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-[10.5px] text-slate-700 dark:text-slate-300">
                    <li>Buka WhatsApp di ponsel Anda</li>
                    <li>Ketuk <b>Menu / Setelan</b> &gt; <b>Perangkat Tertaut</b></li>
                    <li>Ketuk <b>Tautkan Perangkat</b> lalu arahkan kamera ke QR di atas</li>
                  </ol>
                </div>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                  * Halaman ini otomatis memeriksa status scan setiap 3 detik.
                </p>
              </div>
            )}

            {botStatus === 'NOT_CONFIGURED' && (
              <div className="py-8 px-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">Belum Ada URL Bot</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Silakan isi kolom WhatsApp Bot URL di sebelah kiri dan klik Simpan Pengaturan untuk menghubungkan sistem.
                </p>
              </div>
            )}

            {(botStatus === 'ERROR' || botStatus === 'DISCONNECTED') && (
              <div className="py-6 px-4 bg-rose-50/60 border border-rose-200/80 rounded-xl space-y-2.5">
                <XCircle className="w-8 h-8 text-rose-500 mx-auto" />
                <h3 className="text-xs font-bold text-rose-900 dark:text-rose-300">Koneksi Terputus / Tidak Dapat Dihubungi</h3>
                <p className="text-[11px] text-rose-700 dark:text-rose-400 break-words">
                  {statusMessage || 'Pastikan service Node.js di home server berjalan dan URL Tunnel aktif.'}
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => checkBotStatus(false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white text-[11px] font-semibold rounded-lg hover:bg-rose-700 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Coba Hubungkan Kembali
                  </button>
                </div>
              </div>
            )}

            {/* Waktu Cek Terakhir */}
            {lastCheckedAt && (
              <div className="text-[10px] text-slate-400 border-t border-slate-100/80 pt-3">
                Terakhir dicek:{' '}
                {lastCheckedAt.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
