import React from 'react';
import { FileText, Plus, Clock, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import type { PermissionRecord, AuthUser, PermissionStatus, ActivityItem } from '../../types/index.ts';
import { PermissionListTable } from './PermissionListTable.tsx';

interface PermissionsViewProps {
  currentUser: AuthUser;
  permissions: PermissionRecord[];
  activities: ActivityItem[];
  onReviewPermission: (id: string, status: PermissionStatus) => Promise<void>;
  onOpenPermissionModal: () => void;
}

export const PermissionsView: React.FC<PermissionsViewProps> = ({
  currentUser,
  permissions,
  activities,
  onReviewPermission,
  onOpenPermissionModal,
}) => {
  const pendingCount = permissions.filter((p) => p.status === 'PENDING').length;
  const approvedCount = permissions.filter((p) => p.status === 'APPROVED').length;
  const rejectedCount = permissions.filter((p) => p.status === 'REJECTED').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {currentUser.role === 'PENGURUS'
                  ? 'Pengajuan & Riwayat Perizinan'
                  : 'Manajemen & Verifikasi Perizinan'}
              </h1>
              <p className="text-xs text-slate-500">
                {currentUser.role === 'SUPER_ADMIN'
                  ? 'Verifikasi dan kelola seluruh permohonan izin kehadiran kegiatan lintas departemen.'
                  : currentUser.role === 'ADMIN'
                  ? 'Validasi permohonan izin kegiatan untuk anggota di departemen binaan Anda.'
                  : 'Pantau status izin kehadiran kegiatan dan ajukan permohonan baru beserta berkas pendukung.'}
              </p>
            </div>
          </div>
        </div>

        {currentUser.role === 'PENGURUS' && (
          <button
            type="button"
            onClick={onOpenPermissionModal}
            className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Ajukan Izin Baru</span>
          </button>
        )}
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Permohonan</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-1.5">
            {permissions.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Semua riwayat permohonan</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Menunggu Verifikasi</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-1.5">
            {pendingCount}
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-0.5">
            {currentUser.role === 'PENGURUS' ? 'Sedang diproses admin PJ' : 'Memerlukan persetujuan'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Disetujui</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-1.5">
            {approvedCount}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Presensi telah disesuaikan</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Ditolak</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-1.5">
            {rejectedCount}
          </div>
          <p className="text-[11px] text-rose-600 font-medium mt-0.5">Tidak memenuhi syarat</p>
        </div>
      </div>

      {/* Permissions List Table */}
      <div className="space-y-3">
        <PermissionListTable
          permissions={permissions}
          currentUser={currentUser}
          onReview={onReviewPermission}
        />
      </div>
    </div>
  );
};
