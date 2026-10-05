import React from 'react';
import { FileText, Clock, CheckCircle2, XCircle } from 'lucide-react';
import type { PermissionRecord, AuthUser, PermissionStatus, ActivityItem } from '../../types/index.ts';
import { PermissionListTable } from './PermissionListTable.tsx';

interface PermissionsViewProps {
  currentUser: AuthUser;
  permissions: PermissionRecord[];
  activities: ActivityItem[];
  onReviewPermission: (id: string, status: PermissionStatus) => Promise<void>;
  onDeletePermission?: (id: string) => Promise<void>;
  onOpenPermissionModal?: () => void;
  activeTab?: 'pending' | 'history';
}

export const PermissionsView: React.FC<PermissionsViewProps> = ({
  currentUser,
  permissions,
  onReviewPermission,
  onDeletePermission,
  onOpenPermissionModal,
  activeTab = 'pending',
}) => {
  const pendingCount = permissions.filter((p) => p.status === 'PENDING').length;
  const approvedCount = permissions.filter((p) => p.status === 'APPROVED').length;
  const rejectedCount = permissions.filter((p) => p.status === 'REJECTED').length;
  const isNonAdmin = currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN';

  const displayedPermissions =
    activeTab === 'pending'
      ? permissions.filter((p) => p.status === 'PENDING')
      : activeTab === 'history'
      ? permissions.filter((p) => p.status !== 'PENDING')
      : permissions;

  const getHeaderTitle = () => {
    if (activeTab === 'pending') {
      if (currentUser.role === 'INTI') return 'Pengawasan Izin: Perlu Tindakan';
      if (isNonAdmin) return 'Status Perizinan: Sedang Diproses';
      return 'Verifikasi Perizinan: Perlu Tindakan';
    }
    if (activeTab === 'history') {
      return 'Riwayat & Arsip Perizinan';
    }
    return currentUser.role === 'INTI'
      ? 'Pengawasan Riwayat Perizinan'
      : isNonAdmin
      ? 'Riwayat & Status Perizinan'
      : 'Manajemen & Verifikasi Perizinan';
  };

  const getHeaderSubtitle = () => {
    if (activeTab === 'pending') {
      if (currentUser.role === 'SUPER_ADMIN') {
        return 'Tinjau dan ambil keputusan terhadap seluruh permohonan izin kehadiran yang masuk lintas departemen.';
      }
      if (currentUser.role === 'ADMIN') {
        return 'Tinjau dan validasi permohonan izin anggota di departemen binaan Anda yang sedang menunggu persetujuan.';
      }
      if (currentUser.role === 'INTI') {
        return 'Pantau antrean permohonan izin kegiatan pengurus yang saat ini sedang menunggu keputusan verifikasi admin.';
      }
      return 'Pantau status permohonan izin kehadiran kegiatan Anda yang saat ini sedang dalam antrean verifikasi.';
    }
    if (activeTab === 'history') {
      return 'Daftar riwayat keputusan perizinan kegiatan yang telah selesai diproses (Disetujui maupun Ditolak).';
    }
    return 'Verifikasi dan kelola seluruh permohonan izin kehadiran kegiatan organisasi.';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {getHeaderTitle()}
            </h1>
            {activeTab === 'pending' && pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                {pendingCount}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">{getHeaderSubtitle()}</p>
        </div>
      </div>

      {/* Dynamic KPI Metrics based on Active Sub-menu */}
      {activeTab === 'pending' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="bg-surface rounded-xl border border-amber-200/80 p-4 shadow-2xs bg-gradient-to-br from-amber-50/40 to-transparent">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900">Perlu Tindakan / Diproses</span>
              <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
            </div>
            <div className="text-2xl font-bold text-amber-950 tabular-nums tracking-tight mt-1.5">
              {pendingCount}
            </div>
            <p className="text-[11px] text-amber-700 font-medium mt-0.5">
              {currentUser.role === 'INTI'
                ? 'Menunggu verifikasi oleh admin'
                : isNonAdmin
                ? 'Dalam antrean verifikasi tim PSDM'
                : 'Menunggu keputusan persetujuan Anda'}
            </p>
          </div>

          <div className="bg-surface rounded-xl border border-slate-200/80 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Akumulasi Permohonan</span>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-1.5">
              {permissions.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Termasuk permohonan yang telah diarsipkan</p>
          </div>
        </div>
      ) : activeTab === 'history' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-surface rounded-xl border border-slate-200/80 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Arsip Selesai</span>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-1.5">
              {approvedCount + rejectedCount}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Keputusan telah diputuskan</p>
          </div>

          <div className="bg-surface rounded-xl border border-emerald-200/60 p-4 shadow-2xs bg-gradient-to-br from-emerald-50/30 to-transparent">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800">Disetujui</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-950 tabular-nums tracking-tight mt-1.5">
              {approvedCount}
            </div>
            <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Presensi telah disesuaikan</p>
          </div>

          <div className="bg-surface rounded-xl border border-rose-200/60 p-4 shadow-2xs bg-gradient-to-br from-rose-50/30 to-transparent">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-800">Ditolak</span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-rose-950 tabular-nums tracking-tight mt-1.5">
              {rejectedCount}
            </div>
            <p className="text-[11px] text-rose-700 font-medium mt-0.5">Tidak memenuhi syarat</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-surface rounded-xl border border-slate-200/80 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Permohonan</span>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-1.5">
              {permissions.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Semua riwayat permohonan</p>
          </div>

          <div className="bg-surface rounded-xl border border-slate-200/80 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Menunggu Verifikasi</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-1.5">
              {pendingCount}
            </div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
              {currentUser.role === 'INTI' ? 'Menunggu verifikasi admin' : isNonAdmin ? 'Sedang diproses Admin' : 'Memerlukan persetujuan'}
            </p>
          </div>

          <div className="bg-surface rounded-xl border border-slate-200/80 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Disetujui</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-1.5">
              {approvedCount}
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Presensi telah disesuaikan</p>
          </div>

          <div className="bg-surface rounded-xl border border-slate-200/80 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Ditolak</span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-1.5">
              {rejectedCount}
            </div>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-0.5">Tidak memenuhi syarat</p>
          </div>
        </div>
      )}

      {/* Permissions List Table with filterMode matching activeTab */}
      <div className="space-y-3">
        <PermissionListTable
          permissions={displayedPermissions}
          currentUser={currentUser}
          onReview={onReviewPermission}
          onDelete={onDeletePermission}
          filterMode={activeTab || 'all'}
        />
      </div>
    </div>
  );
};
