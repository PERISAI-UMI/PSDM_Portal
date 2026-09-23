import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
} from 'lucide-react';
import type { ActivityItem, AuthUser, UserRole } from '../../types/index.ts';
import { ActivityCard } from './ActivityCard.tsx';

interface ActivitiesViewProps {
  currentUser: AuthUser;
  activities: ActivityItem[];
  onOpenCreateActivity: () => void;
  onOpenAttendance: (act: ActivityItem) => void;
  onTogglePublish: (id: string, current: boolean) => void;
  onToggleLock?: (id: string, current: boolean) => void;
  onEditActivity?: (act: ActivityItem) => void;
  onDeleteActivity: (id: string) => void;
  onViewDetail: (act: ActivityItem) => void;
  onRequestPermission?: (act: ActivityItem) => void;
  onAttendanceImportSuccess?: () => void;
}

export const ActivitiesView: React.FC<ActivitiesViewProps> = ({
  currentUser,
  activities,
  allUsers = [],
  onOpenCreateActivity,
  onOpenAttendance,
  onTogglePublish,
  onToggleLock,
  onEditActivity,
  onDeleteActivity,
  onViewDetail,
  onRequestPermission,
  onAttendanceImportSuccess,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [modeFilter, setModeFilter] = useState<'ALL' | 'OFFLINE' | 'ONLINE'>('ALL');

  const publishedCount = activities.filter((a) => a.isPublished).length;
  const draftCount = activities.filter((a) => !a.isPublished).length;

  const filteredActivities = activities.filter((act) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PUBLISHED' && act.isPublished) ||
      (statusFilter === 'DRAFT' && !act.isPublished);

    const matchesMode = modeFilter === 'ALL' || act.mode === modeFilter;

    const query = search.toLowerCase().trim();
    if (!query) return matchesStatus && matchesMode;

    const matchesSearch =
      act.nama.toLowerCase().includes(query) ||
      (act.deskripsi && act.deskripsi.toLowerCase().includes(query)) ||
      (act.lokasi && act.lokasi.toLowerCase().includes(query)) ||
      act.mode.toLowerCase().includes(query);

    return matchesStatus && matchesMode && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Kegiatan & Agenda
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {currentUser.role === 'SUPER_ADMIN'
                ? 'Kelola agenda kegiatan dan presensi organisasi.'
                : currentUser.role === 'INTI'
                ? 'Pantau agenda kegiatan dan rekapitulasi kehadiran.'
                : currentUser.role === 'ADMIN'
                ? 'Jadwal kegiatan dan presensi departemen binaan.'
                : 'Daftar agenda kegiatan organisasi.'}
            </p>
          </div>
        </div>

        {currentUser.role === 'SUPER_ADMIN' && (
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={onOpenCreateActivity}
              className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Kegiatan</span>
            </button>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Program Kerja</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-1.5">
            {activities.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Seluruh agenda kegiatan</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Aktif & Publikasi</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-1.5">
            {publishedCount}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Tampil pada kalender anggota</p>
        </div>

        {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'INTI') && (
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Draft Internal</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-1.5">
              {draftCount}
            </div>
            <p className="text-[11px] text-amber-600 font-medium mt-0.5">Belum dipublikasikan</p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Mode Pelaksanaan</span>
            <Filter className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 tabular-nums tracking-tight mt-1.5 flex items-baseline gap-2">
            <span>{activities.filter((a) => a.mode === 'ONLINE').length} <span className="text-xs font-semibold text-sky-600">Online</span></span>
            <span className="text-slate-300 font-normal">/</span>
            <span>{activities.filter((a) => a.mode === 'OFFLINE').length} <span className="text-xs font-semibold text-slate-600">Offline</span></span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Sebaran format kegiatan</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kegiatan berdasarkan nama, deskripsi, lokasi..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Filter */}
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value as 'ALL' | 'OFFLINE' | 'ONLINE')}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="ALL">Semua Format</option>
            <option value="OFFLINE">Offline (Tatap Muka)</option>
            <option value="ONLINE">Online (Daring)</option>
          </select>

          {/* Status Tabs */}
          {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'INTI') && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
              {(
                [
                  { id: 'ALL', label: 'Semua' },
                  { id: 'PUBLISHED', label: 'Aktif' },
                  { id: 'DRAFT', label: 'Draft' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activities Grid */}
      {filteredActivities.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">Tidak ada kegiatan ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || statusFilter !== 'ALL' || modeFilter !== 'ALL'
              ? 'Tidak ada kegiatan yang sesuai dengan filter pencarian Anda.'
              : 'Belum ada agenda kegiatan yang terdaftar dalam sistem.'}
          </p>
          {(search || statusFilter !== 'ALL' || modeFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('ALL');
                setModeFilter('ALL');
              }}
              className="mt-3 px-3 py-1.5 text-xs text-slate-600 font-medium hover:text-slate-900 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActivities.map((act) => (
            <ActivityCard
              key={act.id}
              activity={act}
              userRole={currentUser.role}
              onOpenAttendance={onOpenAttendance}
              onRequestPermission={onRequestPermission}
              onTogglePublish={onTogglePublish}
              onToggleLock={onToggleLock}
              onEdit={onEditActivity}
              onDelete={onDeleteActivity}
              onViewDetail={onViewDetail}
            />
          ))}
        </div>
      )}
    </div>
  );
};
