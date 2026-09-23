import React from 'react';
import {
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import type { ActivityItem, PermissionRecord, AttendanceRecord, AuthUser } from '../../types/index.ts';

interface PengurusViewProps {
  currentUser: AuthUser;
  activities: ActivityItem[];
  myPermissions: PermissionRecord[];
  myAttendances: AttendanceRecord[];
  onOpenPermissionModal: (act?: ActivityItem) => void;
  onOpenProfile?: () => void;
  onViewDetail?: (act: ActivityItem) => void;
  onNavigateTo?: (section: 'dashboard' | 'activities' | 'permissions') => void;
}

export const PengurusView: React.FC<PengurusViewProps> = ({
  currentUser,
  activities,
  myPermissions,
  myAttendances,
  onOpenPermissionModal,
  onViewDetail,
  onNavigateTo,
}) => {
  const hadirCount = myAttendances.filter((a) => a.status === 'HADIR' || a.status === 'TELAT').length;
  const izinCount = myAttendances.filter((a) => a.status === 'IZIN' || a.status === 'SAKIT').length;
  const alphaCount = myAttendances.filter((a) => a.status === 'ALPHA').length;
  const attendanceBase = hadirCount + alphaCount;
  const attendanceRate = attendanceBase > 0 ? Math.round((hadirCount / attendanceBase) * 100) : 100;
  const totalRecorded = myAttendances.length;

  const publishedActivities = activities.filter((a) => a.isPublished);
  const upcomingActivities = [...publishedActivities]
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 3);

  const recentPermissions = [...myPermissions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Dasbor Pengurus
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ringkasan kehadiran kegiatan dan perizinan Pengurus.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tingkat Kehadiran</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-1.5">
            {attendanceRate}%
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
            {hadirCount} dari {attendanceBase} kegiatan
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Hadir</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-1.5">
            {hadirCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Kegiatan terpresensi</p>
        </div>

        <div
          onClick={() => onNavigateTo?.('permissions')}
          className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Izin / Sakit</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-1.5">
            {izinCount}
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-0.5 flex items-center gap-1 group-hover:text-amber-800">
            <span>Lihat riwayat perizinan</span>
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tanpa Keterangan</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-1.5">
            {alphaCount}
          </div>
          <p className="text-[11px] text-rose-600 font-medium mt-0.5">Presensi Alpha</p>
        </div>
      </div>

      {/* Two Columns: Upcoming Agenda & Recent Permissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Agenda Box */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-bold text-slate-900">Agenda Kegiatan Mendatang</h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTo?.('activities')}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
              >
                <span>Lihat Semua ({publishedActivities.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {upcomingActivities.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Tidak ada kegiatan mendatang yang dijadwalkan.
                </div>
              ) : (
                upcomingActivities.map((act) => {
                  const startDate = new Date(act.startDate);
                  return (
                    <div
                      key={act.id}
                      onClick={() => onViewDetail?.(act)}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-lg transition-colors cursor-pointer"
                    >
                      <div className="min-w-0">
                        <h3 className="font-semibold text-xs text-slate-900 truncate">
                          {act.nama}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {startDate.toLocaleDateString('id-ID', {
                            timeZone: 'Asia/Makassar',
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          • {act.mode === 'ONLINE' ? 'Online' : (act.lokasi || 'Offline')}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onNavigateTo?.('activities')}
              className="w-full py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Buka Menu Kegiatan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Permissions Box */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-bold text-slate-900">Status Perizinan Terbaru</h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTo?.('permissions')}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {recentPermissions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">Belum ada permohonan izin</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Riwayat izin yang Anda ajukan akan ditampilkan di sini.
                  </p>
                </div>
              ) : (
                recentPermissions.map((p) => {
                  const badgeClass =
                    p.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : p.status === 'REJECTED'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200';

                  const badgeText =
                    p.status === 'APPROVED'
                      ? 'Disetujui'
                      : p.status === 'REJECTED'
                        ? 'Ditolak'
                        : 'Menunggu';

                  return (
                    <div
                      key={p.id}
                      className="py-3 flex items-center justify-between gap-3 px-2 rounded-lg"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-xs text-slate-900 truncate">
                            {p.activityName}
                          </h3>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {p.jenisIzin}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          &quot;{p.alasan}&quot;
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${badgeClass}`}
                      >
                        {badgeText}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onNavigateTo?.('permissions')}
              className="w-full py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Buka Menu Perizinan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
