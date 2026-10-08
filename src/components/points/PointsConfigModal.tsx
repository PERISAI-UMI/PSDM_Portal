import React, { useEffect, useRef, useState } from 'react';
import { X, Award, Save, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
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
  const dialogRef = useRef<HTMLDialogElement>(null);
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

  // Sinkronisasi native HTML5 <dialog>
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
      loadConfig();
    } else {
      if (dialog.open) {
        dialog.close();
      }
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

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
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan konfigurasi bobot poin');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-auto backdrop:bg-slate-900/60 backdrop:backdrop-blur-xs rounded-2xl p-0 shadow-2xl border border-slate-200 dark:border-slate-800 bg-surface text-slate-800 dark:text-slate-100 max-w-lg w-full max-h-[90vh] overflow-hidden"
    >
      <div className="flex flex-col h-full max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 dark:bg-accent/30 text-ink flex items-center justify-center font-bold">
              <Award className="w-5 h-5 text-amber-600 dark:text-accent" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Pengaturan Bobot Poin
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                  Super Admin
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tentukan bobot perolehan poin kehadiran anggota
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifikasi Immutability Guardrail */}
        <div className="mx-6 mt-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed">
            <span className="font-semibold">Catatan Keabadian Riwayat:</span> Perubahan bobot di sini hanya akan berlaku untuk pencatatan presensi berikutnya. Data dan perolehan poin yang telah tercatat di masa lalu tidak akan berubah.
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              {successMessage}
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-brand" />
              <p className="text-xs">Memuat konfigurasi bobot poin...</p>
            </div>
          ) : (
            <form id="points-config-form" onSubmit={handleSubmit} className="space-y-4">
              {/* HADIR */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <label className="text-sm font-semibold text-slate-900 dark:text-white">HADIR (Tepat Waktu)</label>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Poin kehadiran standar per kegiatan</p>
                </div>
                <div className="w-24 shrink-0">
                  <input
                    type="number"
                    value={formData.hadirPoints}
                    onChange={(e) => handleChange('hadirPoints', e.target.value)}
                    required
                    className="w-full text-center px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                  />
                </div>
              </div>

              {/* TELAT */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <label className="text-sm font-semibold text-slate-900 dark:text-white">TELAT (Hadir Terlambat)</label>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Poin dispensasi terlambat hadir</p>
                </div>
                <div className="w-24 shrink-0">
                  <input
                    type="number"
                    value={formData.telatPoints}
                    onChange={(e) => handleChange('telatPoints', e.target.value)}
                    required
                    className="w-full text-center px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                  />
                </div>
              </div>

              {/* IZIN */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <label className="text-sm font-semibold text-slate-900 dark:text-white">IZIN (Disetujui)</label>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Poin surat perizinan yang disetujui</p>
                </div>
                <div className="w-24 shrink-0">
                  <input
                    type="number"
                    value={formData.izinPoints}
                    onChange={(e) => handleChange('izinPoints', e.target.value)}
                    required
                    className="w-full text-center px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                  />
                </div>
              </div>

              {/* SAKIT */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                    <label className="text-sm font-semibold text-slate-900 dark:text-white">SAKIT (Dengan Bukti)</label>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Poin sakit dengan surat dokter</p>
                </div>
                <div className="w-24 shrink-0">
                  <input
                    type="number"
                    value={formData.sakitPoints}
                    onChange={(e) => handleChange('sakitPoints', e.target.value)}
                    required
                    className="w-full text-center px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                  />
                </div>
              </div>

              {/* ALPHA */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <label className="text-sm font-semibold text-slate-900 dark:text-white">ALPHA (Tanpa Keterangan)</label>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Poin penalti ketidakhadiran (bisa bernilai minus)</p>
                </div>
                <div className="w-24 shrink-0">
                  <input
                    type="number"
                    value={formData.alphaPoints}
                    onChange={(e) => handleChange('alphaPoints', e.target.value)}
                    required
                    className="w-full text-center px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            form="points-config-form"
            disabled={loading || submitting}
            className="px-4.5 py-2 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand/90 transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Konfigurasi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </dialog>
  );
};
