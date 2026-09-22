import React from 'react';
import {
  X,
  Calendar,
  Clock,
  UserCheck,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Users,
  Eye,
  Download,
} from 'lucide-react';
import type { ActivityItem, UserRole } from '../../types/index.ts';
import { api } from '../../services/api.ts';

interface ActivityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityItem | null;
  userRole: UserRole;
  onOpenAttendance?: (act: ActivityItem) => void;
  onRequestPermission?: (act: ActivityItem) => void;
  onTogglePublish?: (id: string, current: boolean) => void;
  onDelete?: (id: string) => void;
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  isOpen,
  onClose,
  activity,
  userRole,
  onOpenAttendance,
  onRequestPermission,
  onTogglePublish,
  onDelete,
}) => {
  const [exporting, setExporting] = React.useState(false);

  if (!isOpen || !activity) return null;

  const handleExportCSV = async () => {
    if (!activity) return;
    try {
      setExporting(true);
      await api.exportAttendanceCSV(activity.id, activity.nama);
    } catch (err) {
      console.error('Failed to export CSV', err);
    } finally {
      setExporting(false);
    }
  };

  const startDate = new Date(activity.startDate);
  const endDate = new Date(activity.endDate);

  const formattedDate = startDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedTimeStart = startDate.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedTimeEnd = endDate.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const summary = activity.attendanceSummary || { HADIR: 0, IZIN: 0, SAKIT: 0, ALPHA: 0, TELAT: 0, TOTAL: 0 };
  const total = summary.TOTAL || (summary.HADIR + summary.IZIN + summary.SAKIT + summary.ALPHA + (summary.TELAT || 0));
  const hadirPercentage = total > 0 ? Math.round(((summary.HADIR + (summary.TELAT || 0)) / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs">
      <div className="bg-white w-full max-w-xl rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-200/80 max-h-[90vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {activity.jenis.replace('_', ' ')}
              </span>
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${
                  activity.isPublished
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {activity.isPublished ? 'Dipublikasikan' : 'Draft'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug">
              {activity.nama}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Details & Schedule */}
        <div className="py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 font-medium">Tanggal</div>
                <div className="font-semibold">{formattedDate}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 font-medium">Waktu</div>
                <div className="font-semibold">
                  {formattedTimeStart} - {formattedTimeEnd} WIB
                </div>
              </div>
            </div>
          </div>

          {/* Agenda / Description */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Deskripsi
            </div>
            <div className="text-xs sm:text-sm text-slate-700 bg-white p-3 rounded-xl border border-slate-200/70 leading-relaxed whitespace-pre-wrap">
              {activity.deskripsi || 'Tidak ada deskripsi untuk kegiatan ini.'}
            </div>
          </div>

          {/* Attendance Stats Progress */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <span>Kehadiran</span>
              <span className="text-slate-900 font-bold">
                {hadirPercentage}% ({summary.HADIR}/{total})
              </span>
            </div>

            {/* Visual Multi-Segment Bar */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
              {total > 0 && (
                <>
                  <div
                    style={{ width: `${(summary.HADIR / total) * 100}%` }}
                    className="bg-emerald-500 transition-all"
                    title={`Hadir: ${summary.HADIR}`}
                  />
                  <div
                    style={{ width: `${((summary.TELAT || 0) / total) * 100}%` }}
                    className="bg-amber-500 transition-all"
                    title={`Telat: ${summary.TELAT || 0}`}
                  />
                  <div
                    style={{ width: `${(summary.IZIN / total) * 100}%` }}
                    className="bg-blue-500 transition-all"
                    title={`Izin: ${summary.IZIN}`}
                  />
                  <div
                    style={{ width: `${(summary.SAKIT / total) * 100}%` }}
                    className="bg-purple-500 transition-all"
                    title={`Sakit: ${summary.SAKIT}`}
                  />
                  <div
                    style={{ width: `${(summary.ALPHA / total) * 100}%` }}
                    className="bg-rose-500 transition-all"
                    title={`Alpha: ${summary.ALPHA}`}
                  />
                </>
              )}
            </div>

            {/* Legend Breakdown Grid */}
            <div className="grid grid-cols-5 gap-1 sm:gap-2 mt-2.5 text-center">
              <div className="px-1 py-1.5 sm:p-2 rounded-lg bg-emerald-50/60 border border-emerald-100 min-w-0">
                <div className="text-[9px] sm:text-[10px] text-emerald-700 font-medium truncate">Hadir</div>
                <div className="text-xs sm:text-sm font-bold text-emerald-800 tabular-nums">{summary.HADIR}</div>
              </div>
              <div className="px-1 py-1.5 sm:p-2 rounded-lg bg-amber-50/60 border border-amber-100 min-w-0">
                <div className="text-[9px] sm:text-[10px] text-amber-700 font-medium truncate">Telat</div>
                <div className="text-xs sm:text-sm font-bold text-amber-800 tabular-nums">{summary.TELAT || 0}</div>
              </div>
              <div className="px-1 py-1.5 sm:p-2 rounded-lg bg-blue-50/60 border border-blue-100 min-w-0">
                <div className="text-[9px] sm:text-[10px] text-blue-700 font-medium truncate">Izin</div>
                <div className="text-xs sm:text-sm font-bold text-blue-800 tabular-nums">{summary.IZIN}</div>
              </div>
              <div className="px-1 py-1.5 sm:p-2 rounded-lg bg-purple-50/60 border border-purple-100 min-w-0">
                <div className="text-[9px] sm:text-[10px] text-purple-700 font-medium truncate">Sakit</div>
                <div className="text-xs sm:text-sm font-bold text-purple-800 tabular-nums">{summary.SAKIT}</div>
              </div>
              <div className="px-1 py-1.5 sm:p-2 rounded-lg bg-rose-50/60 border border-rose-100 min-w-0">
                <div className="text-[9px] sm:text-[10px] text-rose-700 font-medium truncate">Alpha</div>
                <div className="text-xs sm:text-sm font-bold text-rose-800 tabular-nums">{summary.ALPHA}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
          {/* Top row for admin action pills (Publish, Export, Delete) */}
          {(userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') && (
            <div className="flex flex-wrap items-center gap-2">
              {userRole === 'SUPER_ADMIN' && onTogglePublish && (
                <button
                  type="button"
                  onClick={() => onTogglePublish(activity.id, activity.isPublished)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  {activity.isPublished ? 'Jadikan Draft' : 'Publikasikan'}
                </button>
              )}

              <button
                type="button"
                onClick={handleExportCSV}
                disabled={exporting}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Export presensi kegiatan ini ke CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>{exporting ? 'Mengekspor...' : 'Export Presensi'}</span>
              </button>

              {userRole === 'SUPER_ADMIN' && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onDelete(activity.id);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200/60 hover:border-rose-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              )}
            </div>
          )}

          {/* Bottom row: Primary CTA and Close button */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              Tutup
            </button>

            {userRole === 'INTI' && onOpenAttendance && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAttendance(activity);
                }}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Lihat Rekap Presensi</span>
              </button>
            )}

            {(userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') && onOpenAttendance && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAttendance(activity);
                }}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Presensi</span>
              </button>
            )}

            {userRole === 'PENGURUS' && onRequestPermission && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRequestPermission(activity);
                }}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ajukan Izin</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
