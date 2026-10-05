import React, { useState } from 'react';
import { UploadCloud, X, CheckCircle, FileText, Lock } from 'lucide-react';
import type { ActivityItem, AuthUser } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { compressImageFile, formatFileSize } from '../../utils/imageCompressor.ts';

interface PermissionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: ActivityItem[];
  defaultActivity?: ActivityItem | null;
  currentUser: AuthUser;
  onSubmit: (data: {
    activityId: string;
    jenisIzin: string;
    alasan: string;
    evidenceUrl?: string | null;
  }) => Promise<void>;
}

export const PermissionFormModal: React.FC<PermissionFormModalProps> = ({
  isOpen,
  onClose,
  activities,
  defaultActivity,
  currentUser: _currentUser,
  onSubmit,
}) => {
  const defaultSelectable =
    (defaultActivity && !defaultActivity.isLocked ? defaultActivity : null) ||
    activities.find((a) => !a.isLocked) ||
    defaultActivity ||
    activities[0];
  const [activityId, setActivityId] = useState(defaultSelectable?.id || '');
  const [jenisIzin, setJenisIzin] = useState('SAKIT');
  const [alasan, setAlasan] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [compressInfo, setCompressInfo] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadError(null);
      setCompressInfo(null);
      setFileName(file.name);

      // Kompresi gambar di sisi klien (85% kualitas, max 1600px) sebelum diunggah ke Backblaze B2
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        const compression = await compressImageFile(file, {
          quality: 0.85,
          maxWidth: 1600,
          maxHeight: 1600,
          format: 'image/webp',
        });
        fileToUpload = compression.file;
        if (compression.ratio > 0) {
          setCompressInfo(
            `Dikompresi: ${formatFileSize(compression.originalSize)} → ${formatFileSize(compression.compressedSize)} (hemat ${compression.ratio}%)`
          );
        }
      }

      const result = await api.uploadEvidenceFile(fileToUpload);
      setEvidenceUrl(result.url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah berkas bukti';
      setUploadError(msg);
      setEvidenceUrl('');
    } finally {
      setUploading(false);
    }
  };

  const selectedActivity = activities.find((a) => a.id === activityId);
  const isActivityLocked = Boolean(selectedActivity?.isLocked);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityId || !alasan.trim() || uploading || isActivityLocked) return;
    setLoading(true);
    await onSubmit({
      activityId,
      jenisIzin,
      alasan: alasan.trim(),
      evidenceUrl: evidenceUrl.trim() || null,
    });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
      <div className="bg-surface w-full max-w-md rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-200 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-900" />
            <h2 className="text-base font-bold text-slate-900">Pengajuan Izin</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Kegiatan *</label>
            <select
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand min-h-[40px] bg-surface"
            >
              {activities.map((act) => (
                <option key={act.id} value={act.id} disabled={Boolean(act.isLocked)}>
                  {act.nama} {act.isLocked ? '(Terkunci - Ditutup)' : ''}
                </option>
              ))}
            </select>
            {isActivityLocked && (
              <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 dark:text-amber-300 text-xs mt-2">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Kegiatan telah dikunci oleh Super Admin. Pengajuan izin sudah ditutup.</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Izin *</label>
            <select
              value={jenisIzin}
              onChange={(e) => setJenisIzin(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand min-h-[40px] bg-surface"
            >
              <option value="SAKIT">Sakit</option>
              <option value="TUGAS_AKADEMIK">Tugas Akademik</option>
              <option value="KEPERLUAN_KELUARGA">Keperluan Keluarga</option>
              <option value="LAINNYA">Lainnya</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Alasan *</label>
            <textarea
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              rows={3}
              placeholder="Keterangan izin..."
              required
              minLength={5}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand"
            />
          </div>

          {/* Upload Bukti */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Lampiran Bukti
            </label>
            <label className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-colors text-center bg-slate-50/50 min-h-[72px]">
              <UploadCloud className="w-5 h-5 text-slate-400 mb-1" />
              <span className="text-xs font-medium text-slate-700 break-all px-2">
                {uploading
                  ? 'Mengunggah ke Backblaze B2...'
                  : fileName
                  ? fileName
                  : 'Pilih dokumen (PDF, JPG, PNG)'}
              </span>
              <input
                type="file"
                disabled={uploading}
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
              />
            </label>

            {uploadError && (
              <div className="mt-1.5 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                {uploadError}
              </div>
            )}

            {evidenceUrl && !uploading && (
              <div className="mt-1.5 space-y-0.5">
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Bukti tersimpan di Object Storage</span>
                </div>
                {compressInfo && (
                  <div className="text-[10px] text-slate-500 pl-4.5 font-mono">
                    {compressInfo}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg min-h-[38px] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || isActivityLocked || uploading}
              className="w-full sm:w-auto px-5 py-2 text-xs font-semibold text-ink bg-accent hover:bg-accent-600 rounded-lg disabled:opacity-50 min-h-[38px] shadow-xs cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? 'Mengirim...' : isActivityLocked ? 'Izin Ditutup' : 'Kirim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
