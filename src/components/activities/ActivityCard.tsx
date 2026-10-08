import React from 'react';
import { Calendar, Clock, UserCheck, FileText, Trash2, MapPin, Globe, Video, Lock, Unlock, Pencil, Layers } from 'lucide-react';
import type { ActivityItem, UserRole } from '../../types/index.ts';
import { formatWitaDate, formatWitaTime } from '../../utils/date.ts';

interface ActivityCardProps {
  activity: ActivityItem;
  userRole: UserRole;
  onOpenAttendance?: (activity: ActivityItem) => void;
  onRequestPermission?: (activity: ActivityItem) => void;
  onTogglePublish?: (id: string, current: boolean) => void;
  onToggleLock?: (id: string, current: boolean) => void;
  onEdit?: (activity: ActivityItem) => void;
  onDelete?: (id: string) => void;
  onViewDetail?: (activity: ActivityItem) => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  userRole,
  onOpenAttendance,
  onRequestPermission,
  onTogglePublish,
  onToggleLock,
  onEdit,
  onDelete,
  onViewDetail,
}) => {
  const formattedDate = formatWitaDate(activity.startDate, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = formatWitaTime(activity.startDate);

  const summary = activity.attendanceSummary || { HADIR: 0, IZIN: 0, SAKIT: 0, ALPHA: 0, TELAT: 0, TOTAL: 0 };
  const total = summary.TOTAL || (summary.HADIR + summary.IZIN + summary.SAKIT + summary.ALPHA + (summary.TELAT || 0));
  const totalHadir = summary.HADIR + (summary.TELAT || 0);
  const totalKehadiranBase = totalHadir + summary.ALPHA;
  const hadirPercent = totalKehadiranBase > 0 ? Math.round((totalHadir / totalKehadiranBase) * 100) : 0;
  const categoryDisplayName = activity.categoryName || activity.category?.nama;

  return (
    <div className="bg-surface rounded-xl border border-slate-200/80 p-5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between group">
      <div
        onClick={() => onViewDetail?.(activity)}
        className="cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onViewDetail?.(activity);
          }
        }}
      >
        {/* Header Badges */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Category Badge */}
            {categoryDisplayName && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-200/80 flex items-center gap-1">
                <Layers className="w-3 h-3 text-brand-600 shrink-0" />
                <span>{categoryDisplayName}</span>
              </span>
            )}

            {/* Mode Badge */}
            {activity.mode === 'ONLINE' ? (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                <Globe className="w-3 h-3 text-sky-600 shrink-0" />
                <span>Online</span>
              </span>
            ) : (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                <span>Offline</span>
              </span>
            )}

            {/* Locked Badge */}
            {activity.isLocked && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                <span>Terkunci</span>
              </span>
            )}
          </div>

          {/* Published/Draft Status */}
          <div className="flex items-center gap-1.5 shrink-0">
            {userRole === 'SUPER_ADMIN' ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePublish?.(activity.id, activity.isPublished);
                }}
                className={`text-[11px] font-medium px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                  activity.isPublished
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
                title="Ubah status publikasi"
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
        <div className="mb-3">
          <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1 mb-1 group-hover:text-brand transition-colors">
            {activity.nama}
          </h3>
          {activity.deskripsi && activity.deskripsi.trim() ? (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {activity.deskripsi}
            </p>
          ) : null}
        </div>

        {/* Schedule & Location Meta */}
        <div className="space-y-1.5 mb-3 text-xs text-slate-500 font-normal">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{formattedTime}</span>
            </div>
          </div>

          {activity.mode === 'OFFLINE' && activity.lokasi && (
            <div className="flex items-center gap-1.5 text-slate-600 truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{activity.lokasi}</span>
            </div>
          )}

          {activity.mode === 'ONLINE' && activity.meetingUrl && (
            <div className="flex items-center gap-1.5 pt-0.5">
              <a
                href={activity.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-800 hover:underline bg-brand-50/70 px-2 py-0.5 rounded-md border border-brand-100 transition-colors"
                title="Buka tautan pertemuan daring"
              >
                <Video className="w-3 h-3 text-brand-500 shrink-0" />
                <span>Buka Link Pertemuan ↗</span>
              </a>
            </div>
          )}
        </div>

        {/* Mini Attendance Progress Bar */}
        <div className="mb-2.5">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-slate-500 font-medium">Presensi Terkini</span>
            <span className="font-bold text-slate-900 tabular-nums">
              {totalHadir} Hadir ({hadirPercent}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
            {total > 0 && (
              <>
                <div style={{ width: `${(summary.HADIR / total) * 100}%` }} className="bg-emerald-500" />
                <div style={{ width: `${((summary.TELAT || 0) / total) * 100}%` }} className="bg-amber-500" />
                <div style={{ width: `${(summary.IZIN / total) * 100}%` }} className="bg-blue-500" />
                <div style={{ width: `${(summary.SAKIT / total) * 100}%` }} className="bg-purple-500" />
                <div style={{ width: `${(summary.ALPHA / total) * 100}%` }} className="bg-rose-500" />
              </>
            )}
          </div>
        </div>

        {/* Attendance Breakdown Strip */}
        <div className="grid grid-cols-5 gap-1 p-2 rounded-lg bg-slate-50/80 border border-slate-100 text-center mb-3.5">
          <div className="min-w-0">
            <div className="text-[10px] text-slate-500 font-medium truncate">Hadir</div>
            <div className="text-xs font-bold text-emerald-600 tabular-nums">{summary.HADIR}</div>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-slate-500 font-medium truncate">Telat</div>
            <div className="text-xs font-bold text-amber-600 tabular-nums">{summary.TELAT || 0}</div>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-slate-500 font-medium truncate">Izin</div>
            <div className="text-xs font-bold text-blue-600 tabular-nums">{summary.IZIN}</div>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-slate-500 font-medium truncate">Sakit</div>
            <div className="text-xs font-bold text-purple-600 tabular-nums">{summary.SAKIT}</div>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-slate-500 font-medium truncate">Alpha</div>
            <div className="text-xs font-bold text-rose-600 tabular-nums">{summary.ALPHA}</div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
        {userRole === 'SUPER_ADMIN' && (onEdit || onToggleLock) && (
          <div className="flex items-center gap-1 shrink-0">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(activity)}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Edit Kegiatan"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}

            {onToggleLock && (
              <button
                type="button"
                onClick={() => onToggleLock(activity.id, Boolean(activity.isLocked))}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  activity.isLocked
                    ? 'text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
                title={activity.isLocked ? 'Buka Kunci Presensi' : 'Kunci Presensi'}
              >
                {activity.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </button>
            )}
          </div>
        )}

        {(userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || (userRole === 'INTI' && activity.isLocked)) && (
          <button
            type="button"
            onClick={() => onOpenAttendance?.(activity)}
            className={`flex-1 py-1.5 px-3 min-h-[36px] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer ${
              activity.isLocked && (userRole === 'ADMIN' || userRole === 'INTI')
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                : 'bg-brand hover:bg-brand-700 text-white'
            }`}
          >
            {activity.isLocked && (userRole === 'ADMIN' || userRole === 'INTI') ? (
              <span>Lihat Presensi</span>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5" />
                <span>Presensi</span>
              </>
            )}
          </button>
        )}

        {userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN' && !(userRole === 'INTI' && activity.isLocked) && (
          activity.isLocked ? (
            <div
              className="flex-1 py-1.5 px-3 min-h-[36px] rounded-lg bg-slate-100 border border-slate-200 text-slate-500 text-xs font-medium flex items-center justify-center gap-1.5 select-none"
              title="Presensi telah dikunci."
            >
              <span>Presensi Dikunci</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onRequestPermission?.(activity)}
              className="flex-1 py-1.5 px-3 min-h-[36px] rounded-lg bg-accent hover:bg-accent-600 text-ink text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Ajukan Izin</span>
            </button>
          )
        )}

        {userRole === 'SUPER_ADMIN' && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(activity.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 cursor-pointer"
            title="Hapus Kegiatan"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
