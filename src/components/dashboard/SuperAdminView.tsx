import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Database,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  User,
  Search,
  Filter,
} from 'lucide-react';
import type { ActivityItem, PermissionRecord, AuthUser, PermissionStatus } from '../../types/index.ts';
import { ActivityCard } from '../activities/ActivityCard.tsx';
import { PermissionListTable } from '../permissions/PermissionListTable.tsx';

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
}

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({
  currentUser,
  activities,
  permissions,
  onOpenCreateActivity,
  onOpenMasterData,
  onOpenMemberList,
  onOpenAttendance,
  onTogglePublish,
  onDeleteActivity,
  onReviewPermission,
  onOpenProfile,
  onViewDetail,
}) => {
  const [activitySearch, setActivitySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');

  const pendingCount = permissions.filter((p) => p.status === 'PENDING').length;
  const publishedCount = activities.filter((a) => a.isPublished).length;

  const filteredActivities = activities.filter((act) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PUBLISHED' && act.isPublished) ||
      (statusFilter === 'DRAFT' && !act.isPublished);

    const query = activitySearch.toLowerCase().trim();
    if (!query) return matchesStatus;

    return (
      matchesStatus &&
      (act.nama.toLowerCase().includes(query) ||
        (act.deskripsi && act.deskripsi.toLowerCase().includes(query)) ||
        act.jenis.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Panel Kepala Departemen
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              Super Admin
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Pengelolaan program kerja, penugasan staf pembina departemen, dan verifikasi perizinan seluruh pengurus.
          </p>
        </div>

        {/* Clean Primary Action */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCreateActivity}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Kegiatan</span>
          </button>
        </div>
      </div>

      {/* Structured Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Program Kerja</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-2">
            {activities.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Kegiatan terdaftar di sistem</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Proker Dipublikasikan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-2">
            {publishedCount}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Tampak di kalender anggota</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Menunggu Verifikasi</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-2">
            {pendingCount}
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-1">Permohonan izin & sakit</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Cakupan Supervisi</span>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-base font-bold text-slate-900 tracking-tight mt-2 flex items-center gap-1.5">
            Seluruh Departemen
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Wewenang persetujuan & tata kelola</p>
        </div>
      </div>

      {/* Section Kegiatan Proker with Search & Filter */}
      <div id="section-activities" className="space-y-4 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Program Kerja & Manajemen Presensi</h2>
            <p className="text-xs text-slate-500">
              Kelola jadwal kegiatan, publikasikan agenda ke kalender anggota, dan catat presensi.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium self-start sm:self-auto">
            {filteredActivities.length} dari {activities.length} Kegiatan
          </span>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={activitySearch}
              onChange={(e) => setActivitySearch(e.target.value)}
              placeholder="Cari kegiatan proker..."
              className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[38px]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {(
              [
                { id: 'ALL', label: 'Semua' },
                { id: 'PUBLISHED', label: 'Dipublikasikan' },
                { id: 'DRAFT', label: 'Draft Internal' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredActivities.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500 space-y-2">
            <p>Tidak ada kegiatan yang sesuai dengan kriteria filter.</p>
            <button
              type="button"
              onClick={() => {
                setActivitySearch('');
                setStatusFilter('ALL');
              }}
              className="text-xs font-semibold text-slate-900 hover:underline"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredActivities.map((act) => (
              <ActivityCard
                key={act.id}
                activity={act}
                userRole={currentUser.role}
                onOpenAttendance={onOpenAttendance}
                onTogglePublish={onTogglePublish}
                onDelete={onDeleteActivity}
                onViewDetail={onViewDetail}
              />
            ))}
          </div>
        )}
      </div>

      {/* Section Verifikasi Izin Seluruh Organisasi */}
      <div id="section-permissions" className="space-y-4 pt-2 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Verifikasi Permohonan Izin & Sakit (Seluruh Departemen)
            </h2>
            <p className="text-xs text-slate-500">
              Persetujuan permohonan akan secara otomatis tersinkronisasi ke catatan absensi peserta kegiatan.
            </p>
          </div>
          {pendingCount > 0 && (
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200 self-start sm:self-auto">
              {pendingCount} Butuh Tindakan
            </span>
          )}
        </div>

        <PermissionListTable
          permissions={permissions}
          currentUser={currentUser}
          onReview={onReviewPermission}
        />
      </div>
    </div>
  );
};
