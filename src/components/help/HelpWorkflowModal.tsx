import React from 'react';
import {
  X,
  ShieldCheck,
  Building2,
  Calendar,
  CheckCircle2,
  UserCheck,
  FileText,
  KeyRound,
  ArrowRight,
} from 'lucide-react';

interface HelpWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchUser: (prn: string) => void;
}

export const HelpWorkflowModal: React.FC<HelpWorkflowModalProps> = ({
  isOpen,
  onClose,
  onSwitchUser,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-200/80 max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Panduan Alur & Peran Portal PSDM
              </h2>
              <p className="text-xs text-slate-500">
                Memahami hierarki otoritas, hak akses, dan tata kelola presensi organisasi.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Steps Visual Flow */}
        <div className="mt-5 space-y-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Alur Kerja Otomatisasi Absensi & Izin
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 relative">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                Langkah 1
              </span>
              <div className="font-semibold text-slate-900 text-xs sm:text-sm mt-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-700" />
                <span>Publikasi Proker</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Kadep menjadwalkan kegiatan proker. Status publikasi menjadikan agenda muncul di kalender anggota.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 relative">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                Langkah 2
              </span>
              <div className="font-semibold text-slate-900 text-xs sm:text-sm mt-2 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-700" />
                <span>Presensi / Izin</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                PJ melakukan presensi di lokasi. Pengurus berhalangan dapat mengajukan izin/sakit dengan bukti surat.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 relative">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                Langkah 3
              </span>
              <div className="font-semibold text-slate-900 text-xs sm:text-sm mt-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Validasi Otomatis</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Saat PJ menyetujui izin, sistem secara instan mengonversi status absensi pengurus menjadi IZIN/SAKIT.
              </p>
            </div>
          </div>
        </div>

        {/* 3 Roles Quick Switch & Description */}
        <div className="mt-6 space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Pilih Peran Untuk Pengujian Langsung:
          </div>

          <div className="space-y-2.5">
            {/* Super Admin */}
            <div className="p-3 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-white transition-all flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Kepala Departemen PSDM</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 rounded text-slate-600">
                      PSDM-001
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    Akses penuh: Buat kegiatan, publikasikan proker, atur master departemen & mapping PJ.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onSwitchUser('PSDM-001');
                  onClose();
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-lg shrink-0 transition-colors flex items-center gap-1 shadow-2xs"
              >
                <span>Masuk</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Admin PJ */}
            <div className="p-3 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-white transition-all flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Staf PSDM (PJ Departemen)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 rounded text-slate-600">
                      PSDM-002
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    Input presensi lapangan, validasi izin pengurus binaan (Departemen Riset & Teknologi).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onSwitchUser('PSDM-002');
                  onClose();
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg shrink-0 transition-colors flex items-center gap-1 shadow-2xs"
              >
                <span>Masuk</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Pengurus Anggota */}
            <div className="p-3 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-white transition-all flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Anggota Pengurus Organisasi</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 rounded text-slate-600">
                      RISTEK-001
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    Lihat agenda terpublikasi, ajukan izin/sakit beserta lampiran bukti, dan kelola biodata diri.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onSwitchUser('RISTEK-001');
                  onClose();
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg shrink-0 transition-colors flex items-center gap-1 shadow-2xs"
              >
                <span>Masuk</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs"
          >
            Mengerti, Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
