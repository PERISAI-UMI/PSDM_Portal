import React from 'react';
import { Calendar, Clock, UserCheck, FileText, Trash2, Eye, CheckCircle2 } from 'lucide-react';
import type { ActivityItem, UserRole } from '../../types/index.ts';

interface ActivityCardProps {
  activity: ActivityItem;
  userRole: UserRole;
  onOpenAttendance?: (activity: ActivityItem) => void;
  onRequestPermission?: (activity: ActivityItem) => void;
  onTogglePublish?: (id: string, current: boolean) => void;
  onDelete?: (id: string) => void;
  onViewDetail?: (activity: ActivityItem) => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  userRole,
  onOpenAttendance,
  onRequestPermission,
  onTogglePublish,
  onDelete,
  onViewDetail,
}) => {
  const startDate = new Date(activity.startDate);
  const formattedDate = startDate.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = startDate.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const summary = activity.attendanceSummary || { HADIR: 0, IZIN: 0, SAKIT: 0, ALPHA: 0, TOTAL: 0 };
  const total = summary.TOTAL || (summary.HADIR + summary.IZIN + summary.SAKIT + summary.ALPHA);
  const hadirPercent = total > 0 ? Math.round((summary.HADIR / total) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between group">
      <div>
        {/* Header Badges */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
            {activity.jenis.replace('_', ' ')}
          </span>

          <div className="flex items-center gap-1.5">
            {userRole === 'SUPER_ADMIN' ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePublish?.(activity.id, activity.isPublished);
                }}
                className={`text-[11px] font-medium px-2 py-0.5 rounded-md border transition-colors ${
                  activity.isPublished
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
                title="Klik untuk mengubah status publikasi"
              >
                {activity.isPublished ? 'Dipublikasikan' : 'Draft'}
              </button>
            ) : (
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                  activity.isPublished
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {activity.isPublished ? 'Dipublikasikan' : 'Internal'}
              </span>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <div
          onClick={() => onViewDetail?.(activity)}
          className="cursor-pointer group-hover:text-slate-900"
        >
          <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-1 mb-1 hover:underline">
            {activity.nama}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
            {activity.deskripsi || 'Klik untuk melihat agenda dan detail kegiatan lengkap.'}
          </p>
        </div>

        {/* Schedule Meta */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-3.5 font-normal">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formattedTime} WIB</span>
          </div>
        </div>

        {/* Mini Attendance Progress Bar */}
        <div className="mb-3.5">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-500 font-medium">Presensi Terkini</span>
            <span className="font-bold text-slate-800 tabular-nums">
              {summary.HADIR} Hadir ({hadirPercent}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
            {total > 0 && (
              <>
                <div style={{ width: `${(summary.HADIR / total) * 100}%` }} className="bg-emerald-500" />
                <div style={{ width: `${(summary.IZIN / total) * 100}%` }} className="bg-blue-500" />
                <div style={{ width: `${(summary.SAKIT / total) * 100}%` }} className="bg-amber-500" />
                <div style={{ width: `${(summary.ALPHA / total) * 100}%` }} className="bg-rose-500" />
              </>
            )}
          </div>
        </div>

        {/* Attendance Breakdown Strip */}
        <div className="grid grid-cols-4 gap-1 p-2 rounded-lg bg-slate-50 border border-slate-100 text-center mb-4">
          <div>
            <div className="text-[10px] text-slate-500 font-medium">Hadir</div>
            <div className="text-xs font-bold text-slate-900 tabular-nums">{summary.HADIR}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-medium">Izin</div>
            <div className="text-xs font-bold text-slate-900 tabular-nums">{summary.IZIN}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-medium">Sakit</div>
            <div className="text-xs font-bold text-slate-900 tabular-nums">{summary.SAKIT}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-medium">Alpha</div>
            <div className="text-xs font-bold text-slate-900 tabular-nums">{summary.ALPHA}</div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onViewDetail?.(activity)}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
          title="Lihat Detail Agenda"
        >
          <Eye className="w-4 h-4" />
        </button>

        {userRole !== 'PENGURUS' && (
          <button
            type="button"
            onClick={() => onOpenAttendance?.(activity)}
            className="flex-1 py-1.5 px-3 min-h-[36px] rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Presensi Peserta</span>
          </button>
        )}

        {userRole === 'PENGURUS' && (
          <button
            type="button"
            onClick={() => onRequestPermission?.(activity)}
            className="flex-1 py-1.5 px-3 min-h-[36px] rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Ajukan Izin / Sakit</span>
          </button>
        )}

        {userRole === 'SUPER_ADMIN' && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(activity.id)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
            title="Hapus Kegiatan"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
