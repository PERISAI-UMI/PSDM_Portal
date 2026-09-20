import React, { useState } from 'react';
import { X, UploadCloud, FileText, CheckCircle } from 'lucide-react';
import type { ActivityItem, AuthUser } from '../../types/index.ts';

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
  currentUser,
  onSubmit,
}) => {
  const [activityId, setActivityId] = useState(defaultActivity?.id || activities[0]?.id || '');
  const [jenisIzin, setJenisIzin] = useState('SAKIT');
  const [alasan, setAlasan] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      // In a real S3 upload, browser performs PUT to presigned URL:
      // https://s3.us-east-005.backblazeb2.com/psdm-evidence/evidence/...
      setEvidenceUrl(
        `https://s3.us-east-005.backblazeb2.com/psdm-evidence/evidence/${Date.now()}-${file.name}`
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityId || !alasan.trim()) return;
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
      <div className="bg-white w-full max-w-md rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-200 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-900" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Form Pengajuan Izin / Sakit</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Kegiatan Proker *</label>
            <select
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 min-h-[42px] bg-white"
            >
              {activities.map((act) => (
                <option key={act.id} value={act.id}>
                  {act.nama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Izin *</label>
            <select
              value={jenisIzin}
              onChange={(e) => setJenisIzin(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 min-h-[42px] bg-white"
            >
              <option value="SAKIT">Sakit (Wajib Surat Dokter / Resep)</option>
              <option value="TUGAS_AKADEMIK">Tugas Akademik / Ujian / Lomba</option>
              <option value="KEPERLUAN_KELUARGA">Keperluan Keluarga Mendesak</option>
              <option value="LAINNYA">Lainnya</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Alasan Lengkap *</label>
            <textarea
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              rows={3}
              placeholder="Berikan alasan yang jelas dan dapat dipertanggungjawabkan..."
              required
              minLength={5}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Upload Bukti */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Upload Bukti (Surat Dokter / Bukti Surat Tugas)
            </label>
            <label className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center bg-slate-50/50 min-h-[80px]">
              <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
              <span className="text-xs font-medium text-slate-700 break-all px-2">
                {fileName ? fileName : 'Pilih file surat/bukti (JPG, PNG, PDF)'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                Upload langsung ke Backblaze B2 Storage
              </span>
              <input type="file" onChange={handleSimulateUpload} className="hidden" />
            </label>
            {evidenceUrl && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                Bukti terlampir siap diunggah
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg min-h-[42px]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-50 min-h-[42px] shadow-xs"
            >
              {loading ? 'Mengirim...' : 'Kirim Permohonan Izin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
