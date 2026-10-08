import React, { useEffect, useState } from 'react';
import { X, Award, Save, RefreshCw, ShieldCheck } from 'lucide-react';
import type { PointConfig } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { broadcastRealtimeEvent } from '../../utils/realtime.ts';

interface PointsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: (newConfig: PointConfig) => void;
}

export const PointsConfigModal: React.FC<PointsConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<PointConfig>({
    hadirPoints: 10,
    izinPoints: 3,
    sakitPoints: 3,
    alphaPoints: -10,
    telatPoints: 5,
  });

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    } else {
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  // Kunci scroll body saat modal terbuka untuk mencegah double-scrolling / background lag
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Listener tombol Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  const loadConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const config = await api.getPointsConfig();
      setFormData(config);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat konfigurasi bobot poin');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof PointConfig, value: string) => {
    const parsed = parseInt(value, 10);
    setFormData((prev) => ({
      ...prev,
      [field]: isNaN(parsed) ? 0 : parsed,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await api.updatePointsConfig(formData);
      setSuccessMessage('Bobot poin berhasil diperbarui!');
      onConfigSaved?.(res.data);

      // Panggil broadcast cross-tab untuk auto-refresh reaktif
      broadcastRealtimeEvent('ATTENDANCE_CHANGED');

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan konfigurasi bobot poin');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      {/* Backdrop layer terpisah dengan akselerasi GPU */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity transform-gpu"
        onClick={() => {
          if (!submitting) onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Container: Diisolasi total dari backdrop filter */}
      <div className="relative z-10 bg-surface w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200/90 max-h-[92vh] flex flex-col overflow-hidden isolate transform-gpu animate-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent text-ink flex items-center justify-center font-bold shadow-xs">
              <Award className="w-5 h-5 text-ink" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pengaturan Bobot Poin
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tentukan bobot perolehan poin kehadiran anggota
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 modal-scroll flex-1">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              {successMessage}
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-brand dark:text-accent" />
              <p className="text-xs">Memuat konfigurasi bobot poin...</p>
            </div>
          ) : (
            <form id="points-config-form" onSubmit={handleSubmit} className="space-y-3.5">
              {/* HADIR */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-xs"></span>
                    <label className="text-sm font-bold text-slate-900 truncate">HADIR (Tepat Waktu)</label>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Poin kehadiran standar per kegiatan</p>
                </div>
                <div className="w-24 shrink-0">
                  <input
                    type="number"
                    value={formData.hadirPoints}
                    onChange={(e) => handleChange('hadirPoints', e.target.value)}
                    required
                    className="w-full text-center px-3 py-2 rounded-xl border border-slate-300 bg-surface text-slate-900 font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                  />
                </div>
              </div>

              {/* TELAT */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 shadow-xs"></span>
                    <label className="text-sm font-bold text-slate-900 truncate">TELAT (Hadir Terlambat)</label>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Poin dispensasi terlambat hadir</p>
                </div>
                <div className="w-24 shrink-0">
                  <input
                    type="number"
                    value={formData.telatPoints}
                    onChange={(e) => handleChange('telatPoints', e.target.value)}
                    required
                    className="w-full text-center px-3 py-2 rounded-xl border border-slate-300 bg-surface text-slate-900 font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                  />
                </div>
              </div>

              {/* IZIN */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 shadow-xs"></span>
                    <label className="text-sm font-bold text-slate-900 truncate">IZIN (Disetujui)</label>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Poin surat perizinan yang disetujui</p>
                </div>
                <div className="w-24 shrink-0">
                  <input
                    type="number"
                    value={formData.izinPoints}
                    onChange={(e) => handleChange('izinPoints', e.target.value)}
                    required
                    className="w-full text-center px-3 py-2 rounded-xl border border-slate-300 bg-surface text-slate-900 font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                  />
                </div>
              </div>

              {/* SAKIT */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0 shadow-xs"></span>
                    <label className="text-sm font-bold text-slate-900 truncate">SAKIT (Dengan Bukti)</label>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Poin sakit dengan surat dokter</p>
                </div>
                <div className="w-24 shrink-0">
                  <input
                    type="number"
                    value={formData.sakitPoints}
                    onChange={(e) => handleChange('sakitPoints', e.target.value)}
                    required
                    className="w-full text-center px-3 py-2 rounded-xl border border-slate-300 bg-surface text-slate-900 font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                  />
                </div>
              </div>

              {/* ALPHA */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 shadow-xs"></span>
                    <label className="text-sm font-bold text-slate-900 truncate">ALPHA (Tanpa Keterangan)</label>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Poin penalti ketidakhadiran (bisa minus)</p>
                </div>
                <div className="w-24 shrink-0">
                  <input
                    type="number"
                    value={formData.alphaPoints}
                    onChange={(e) => handleChange('alphaPoints', e.target.value)}
                    required
                    className="w-full text-center px-3 py-2 rounded-xl border border-slate-300 bg-surface text-slate-900 font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer min-h-[40px]"
          >
            Batal
          </button>
          <button
            type="submit"
            form="points-config-form"
            disabled={loading || submitting}
            className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-600 text-ink text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 min-h-[40px] active:scale-95"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-ink" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-ink" />
                <span>Simpan Konfigurasi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

