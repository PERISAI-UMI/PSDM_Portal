import React, { useState } from 'react';
import {
  Calendar,
  Users,
  Building2,
  Clock,
  ShieldCheck,
  User,
  Search,
} from 'lucide-react';
import type { ActivityItem, PermissionRecord, AuthUser, PermissionStatus } from '../../types/index.ts';
import { ActivityCard } from '../activities/ActivityCard.tsx';
import { PermissionListTable } from '../permissions/PermissionListTable.tsx';

interface AdminViewProps {
  currentUser: AuthUser;
  activities: ActivityItem[];
  permissions: PermissionRecord[];
  onOpenMemberList: () => void;
  onOpenAttendance: (act: ActivityItem) => void;
  onReviewPermission: (id: string, status: PermissionStatus) => Promise<void>;
  onOpenProfile?: () => void;
  onViewDetail?: (act: ActivityItem) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  currentUser,
  activities,
  permissions,
  onOpenMemberList,
  onOpenAttendance,
  onReviewPermission,
  onOpenProfile,
  onViewDetail,
}) => {
  const [search, setSearch] = useState('');
  const assignedDepts = currentUser.pjDepartments || [];
  const assignedDeptIds = assignedDepts.map((pj) => pj.departmentId);

  // Filter izin khusus departemen binaan PJ ini
  const myAssignedPermissions = permissions.filter((p) =>
    assignedDeptIds.includes(p.userDepartmentId || '')
  );
  const pendingCount = myAssignedPermissions.filter((p) => p.status === 'PENDING').length;

  const filteredActivities = activities.filter((act) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      act.nama.toLowerCase().includes(q) ||
      (act.deskripsi && act.deskripsi.toLowerCase().includes(q)) ||
      act.jenis.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Panel Staf Pembina (PJ)
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              Admin PJ
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Pencatatan presensi kehadiran kegiatan dan verifikasi izin pengurus pada departemen binaan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenMemberList}
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Users className="w-4 h-4" />
            <span>Direktori Anggota</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Program Kerja Tersedia</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-2">
            {activities.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Siap untuk input presensi</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Departemen Binaan</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-sm font-bold text-slate-900 tracking-tight mt-2">
            Riset & Teknologi
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Penugasan resmi PJ</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Izin Butuh Validasi</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-2">
            {pendingCount}
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-1">Khusus Departemen Binaan</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Lingkup Validasi</span>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-sm font-bold text-slate-900 tracking-tight mt-2">
            Departemen Binaan
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Sesuai penugasan PJ resmi</p>
        </div>
      </div>

      {/* Section Input Presensi Lapangan */}
      <div id="section-activities" className="space-y-4 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Program Kerja & Input Presensi</h2>
            <p className="text-xs text-slate-500">
              Pilih kegiatan yang aktif untuk membuka formulir dan scanner absensi kehadiran anggota di lokasi.
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari agenda proker..."
              className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
            />
          </div>
        </div>

        {filteredActivities.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
            Tidak ada kegiatan yang cocok dengan pencarian.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredActivities.map((act) => (
              <ActivityCard
                key={act.id}
                activity={act}
                userRole={currentUser.role}
                onOpenAttendance={onOpenAttendance}
                onViewDetail={onViewDetail}
              />
            ))}
          </div>
        )}
      </div>

      {/* Section Verifikasi Izin Departemen Binaan */}
      <div id="section-permissions" className="space-y-4 pt-2 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Verifikasi Permohonan Izin Departemen Binaan
            </h2>
            <p className="text-xs text-slate-500">
              Pengurus dari Departemen Riset dan Teknologi yang mengajukan izin ketidakhadiran proker.
            </p>
          </div>
          {pendingCount > 0 && (
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200 self-start sm:self-auto">
              {pendingCount} Permohonan Tertunda
            </span>
          )}
        </div>

        <PermissionListTable
          permissions={myAssignedPermissions}
          currentUser={currentUser}
          onReview={onReviewPermission}
        />
      </div>
    </div>
  );
};
