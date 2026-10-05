import React from 'react';
import {
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  ArrowRight,
  Check,
  X,
} from 'lucide-react';
import type { ActivityItem, PermissionRecord, AuthUser, PermissionStatus, AttendanceRecord } from '../../types/index.ts';
import { TopAlphaBarChart, type AlphaMemberStat } from './TopAlphaBarChart.tsx';

interface AdminViewProps {
  currentUser: AuthUser;
  activities: ActivityItem[];
  permissions: PermissionRecord[];
  attendances?: AttendanceRecord[];
  allUsers?: AuthUser[];
  onOpenMemberList: () => void;
  onOpenAttendance: (act: ActivityItem) => void;
  onReviewPermission: (id: string, status: PermissionStatus) => Promise<void>;
  onOpenProfile?: () => void;
  onViewDetail?: (act: ActivityItem) => void;
  onNavigateTo?: (section: 'dashboard' | 'activities' | 'permissions' | 'members') => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  currentUser,
  activities,
  permissions,
  attendances = [],
  allUsers = [],
  onOpenAttendance,
  onReviewPermission,
  onViewDetail,
  onNavigateTo,
}) => {
  const assignedDepts = currentUser.pjDepartments || [];
  const assignedDeptIds = assignedDepts.map((pj) => pj.departmentId);

  const myAssignedPermissions = permissions.filter((p) =>
    assignedDeptIds.includes(p.userDepartmentId || '')
  );
  const pendingCount = myAssignedPermissions.filter((p) => p.status === 'PENDING').length;
  const publishedCount = activities.filter((a) => a.isPublished).length;

  const upcomingActivities = [...activities]
    .filter((a) => a.isPublished)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 3);

  const pendingList = myAssignedPermissions.filter((p) => p.status === 'PENDING');

  // Akumulasi data presensi pengurus untuk Bar Chart
  const userStatsMap = new Map<string, AlphaMemberStat>();

  for (const u of allUsers) {
    userStatsMap.set(u.id, {
      userId: u.id,
      nama: u.namaLengkap || 'Pengurus',
      prn: u.prn,
      dept: u.departmentName,
      hadir: 0,
      telat: 0,
      izin: 0,
      sakit: 0,
      alpa: 0,
      totalKegiatan: 0,
    });
  }

  if (attendances && attendances.length > 0) {
    for (const att of attendances) {
      let entry = userStatsMap.get(att.userId);
      if (!entry) {
        entry = {
          userId: att.userId,
          nama: att.userName || 'Pengurus',
          prn: att.userPrn,
          dept: att.userDepartmentName,
          hadir: 0,
          telat: 0,
          izin: 0,
          sakit: 0,
          alpa: 0,
          totalKegiatan: 0,
        };
        userStatsMap.set(att.userId, entry);
      }
      entry.totalKegiatan++;
      if (att.status === 'HADIR') {
        entry.hadir++;
      } else if (att.status === 'TELAT') {
        entry.telat++;
      } else if (att.status === 'IZIN') {
        entry.izin++;
      } else if (att.status === 'SAKIT') {
        entry.sakit++;
      } else if (att.status === 'ALPHA') {
        entry.alpa++;
      }
    }
  }

  const memberStats: AlphaMemberStat[] = Array.from(userStatsMap.values());

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="pb-5 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Dashboard Staf PSDM
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Presensi kegiatan dan verifikasi izin departemen binaan.
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          onClick={() => onNavigateTo?.('activities')}
          className="bg-surface rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Agenda Kegiatan</span>
            <Calendar className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-1.5">
            {publishedCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 group-hover:text-slate-700">
            <span>Lihat kegiatan</span>
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </p>
        </div>

        <div
          onClick={() => onNavigateTo?.('permissions')}
          className="bg-surface rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Izin Menunggu</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-1.5">
            {pendingCount}
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5 flex items-center gap-1 group-hover:text-amber-800">
            <span>Menunggu verifikasi</span>
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </p>
        </div>

        <div
          onClick={() => onNavigateTo?.('permissions')}
          className="bg-surface rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Izin Binaan</span>
            <CheckCircle2 className="w-4 h-4 text-slate-400 group-hover:text-slate-900" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-1.5">
            {myAssignedPermissions.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Riwayat departemen</p>
        </div>

        <div
          onClick={() => onNavigateTo?.('members')}
          className="bg-surface rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Direktori Anggota</span>
            <Users className="w-4 h-4 text-slate-400 group-hover:text-slate-900" />
          </div>
          <div className="text-sm font-bold text-slate-900 tracking-tight mt-2">
            Data Anggota
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-slate-700">
            <span>Lihat anggota</span>
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </p>
        </div>
      </div>

      {/* Two Column Layout: Upcoming Agenda & Pending Permissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Agenda Box */}
        <div className="bg-surface rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-bold text-slate-900">Agenda Kegiatan Terdekat</h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTo?.('activities')}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {upcomingActivities.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Belum ada kegiatan yang dipublikasikan.
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
                          {act.isLocked ? ' • Terkunci' : ''}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAttendance(act);
                        }}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors shrink-0 ${
                          act.isLocked
                            ? 'text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200'
                            : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                        }`}
                      >
                        {act.isLocked ? 'Lihat Presensi' : 'Presensi'}
                      </button>
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
              <span>Buka Seluruh Agenda Kegiatan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Pending Permissions Box */}
        <div className="bg-surface rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h2 className="text-sm font-bold text-slate-900">Validasi Izin Binaan</h2>
                {pendingCount > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 dark:text-amber-300">
                    {pendingCount}
                  </span>
                )}
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
              {pendingCount === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-slate-700">Tidak ada izin tertunda</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Seluruh permohonan departemen binaan telah diproses.
                  </p>
                </div>
              ) : (
                pendingList.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="py-3 flex items-center justify-between gap-3 px-2 rounded-lg"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 truncate">
                          {p.userName || p.userPrn || 'Anggota'}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 dark:text-amber-300 border border-amber-200">
                          {p.jenisIzin}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {p.activityName} • &quot;{p.alasan}&quot;
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onReviewPermission(p.id, 'APPROVED')}
                        className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                        title="Setujui Izin"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onReviewPermission(p.id, 'REJECTED')}
                        className="p-1.5 rounded-md bg-rose-50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 transition-colors"
                        title="Tolak Izin"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onNavigateTo?.('permissions')}
              className="w-full py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Buka Menu Verifikasi Izin</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Top 10 Presensi Bar Chart */}
      <TopAlphaBarChart data={memberStats} />
    </div>
  );
};
