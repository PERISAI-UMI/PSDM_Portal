import React from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  Users,
  Database,
  Check,
  X,
  FileText,
  AlertCircle,
} from 'lucide-react';
import type { ActivityItem, PermissionRecord, AuthUser, PermissionStatus } from '../../types/index.ts';

interface SuperAdminViewProps {
  currentUser: AuthUser;
  activities: ActivityItem[];
  permissions: PermissionRecord[];
  onOpenCreateActivity: () => void;
  onOpenMasterData: () => void;
  onOpenMemberList: () => void;
  onOpenAttendance: (act: ActivityItem) => void;
  onTogglePublish: (id: string, current: boolean) => void;
  onDeleteActivity: (id: string) => void;
  onReviewPermission: (id: string, status: PermissionStatus) => Promise<void>;
  onOpenAudit?: () => void;
  onOpenProfile?: () => void;
  onViewDetail?: (act: ActivityItem) => void;
  onNavigateTo?: (section: 'dashboard' | 'activities' | 'permissions' | 'members' | 'master-data') => void;
}

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({
  currentUser,
  activities,
  permissions,
  onOpenCreateActivity,
  onOpenMasterData,
  onOpenMemberList,
  onOpenAttendance,
  onReviewPermission,
  onViewDetail,
  onNavigateTo,
}) => {
  const pendingPermissions = permissions.filter((p) => p.status === 'PENDING');
  const pendingCount = pendingPermissions.length;
  const publishedCount = activities.filter((a) => a.isPublished).length;

  // 3 most recent or upcoming activities
  const upcomingActivities = [...activities]
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-5 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard Eksekutif
          </h1>
          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
            currentUser.role === 'INTI'
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {currentUser.role === 'INTI' ? 'Pengurus Inti' : 'Super Admin'}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Ringkasan eksekutif kegiatan, presensi, dan perizinan lintas departemen organisasi.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          onClick={() => onNavigateTo?.('activities')}
          className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Kegiatan</span>
            <Calendar className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-1.5">
            {activities.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 group-hover:text-slate-700">
            <span>Buka manajemen kegiatan</span>
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </p>
        </div>

        <div
          onClick={() => onNavigateTo?.('activities')}
          className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Dipublikasikan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-1.5">
            {publishedCount}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Tersedia untuk pengurus</p>
        </div>

        <div
          onClick={() => onNavigateTo?.('permissions')}
          className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Perlu Tindakan</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-1.5">
            {pendingCount}
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-0.5 flex items-center gap-1 group-hover:text-amber-800">
            <span>Permohonan izin baru</span>
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </p>
        </div>

        <div
          onClick={() => onNavigateTo?.('master-data')}
          className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Master Data</span>
            <ShieldCheck className="w-4 h-4 text-slate-400 group-hover:text-slate-900" />
          </div>
          <div className="text-sm font-bold text-slate-900 tracking-tight mt-2 flex items-center gap-1">
            Departemen, Fakultas & Jurusan
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-slate-700">
            <span>Kelola CRUD struktur & penugasan</span>
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </p>
        </div>
      </div>

      {/* Two Column Layout: Upcoming Agenda & Pending Permissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Agenda Box */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-bold text-slate-900">Agenda Kegiatan Terkini</h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTo?.('activities')}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
              >
                <span>Lihat Semua ({activities.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {upcomingActivities.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Belum ada program kerja yang terdaftar.
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
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-xs text-slate-900 truncate">
                            {act.nama}
                          </h3>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              act.isPublished
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {act.isPublished ? 'Aktif' : 'Draft'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {startDate.toLocaleDateString('id-ID', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          • {act.jenis.replace('_', ' ')}
                        </p>
                      </div>

                      {currentUser.role !== 'INTI' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenAttendance(act);
                          }}
                          className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors shrink-0"
                        >
                          Presensi
                        </button>
                      )}
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

        {/* Pending Permissions Box */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-bold text-slate-900">Perizinan Perlu Validasi</h2>
                {pendingCount > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800">
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
                  <p className="font-semibold text-slate-700">Semua permohonan telah divalidasi</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Tidak ada izin tertunda saat ini.</p>
                </div>
              ) : (
                pendingPermissions.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="py-3 flex items-center justify-between gap-3 px-2 rounded-lg"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 truncate">
                          {p.userName || p.userPrn || 'Anggota'}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          {p.jenisIzin}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {p.activityName} • &quot;{p.alasan}&quot;
                      </p>
                    </div>

                    {currentUser.role !== 'INTI' ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onReviewPermission(p.id, 'APPROVED')}
                          className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                          title="Setujui Izin"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onReviewPermission(p.id, 'REJECTED')}
                          className="p-1.5 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                          title="Tolak Izin"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                        Menunggu
                      </span>
                    )}
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
              <span>Buka Menu Perizinan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Access Tiles to Other Layouts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => onNavigateTo?.('members')}
          className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900">Direktori Anggota Organisasi</h3>
              <p className="text-[11px] text-slate-500">
                Pangkalan data fungsionaris, program studi, kontak, dan departemen.
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
        </div>

        <div
          onClick={() => onNavigateTo?.('master-data')}
          className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900">Master Data & Penugasan PJ</h3>
              <p className="text-[11px] text-slate-500">
                Konfigurasi fakultas, program studi, departemen, dan mapping staf PSDM.
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </div>
  );
};
