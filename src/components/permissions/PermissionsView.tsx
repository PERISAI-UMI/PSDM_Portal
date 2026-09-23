import React from 'react';
import { FileText, Clock, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import type { PermissionRecord, AuthUser, PermissionStatus, ActivityItem } from '../../types/index.ts';
import { PermissionListTable } from './PermissionListTable.tsx';

interface PermissionsViewProps {
  currentUser: AuthUser;
  permissions: PermissionRecord[];
  activities: ActivityItem[];
  onReviewPermission: (id: string, status: PermissionStatus) => Promise<void>;
  onDeletePermission?: (id: string) => Promise<void>;
  onOpenPermissionModal?: () => void;
}

export const PermissionsView: React.FC<PermissionsViewProps> = ({
  currentUser,
  permissions,
  onReviewPermission,
  onDeletePermission,
}) => {
  const pendingCount = permissions.filter((p) => p.status === 'PENDING').length;
  const approvedCount = permissions.filter((p) => p.status === 'APPROVED').length;
  const rejectedCount = permissions.filter((p) => p.status === 'REJECTED').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {currentUser.role === 'PENGURUS'
                ? 'Riwayat & Status Perizinan'
                : currentUser.role === 'INTI'
                  ? 'Pemantauan & Rekapitulasi Perizinan'
                  : 'Manajemen & Verifikasi Perizinan'}
            </h1>
            <p className="text-xs text-slate-500">
              {currentUser.role === 'SUPER_ADMIN'
                ? 'Verifikasi dan kelola seluruh permohonan izin kehadiran kegiatan lintas departemen.'
                : currentUser.role === 'INTI'
                  ? 'Pantau seluruh permohonan izin kehadiran kegiatan di semua departemen secara transparan.'
                  : currentUser.role === 'ADMIN'
                    ? 'Validasi permohonan izin kegiatan untuk anggota di departemen binaan Anda.'
                    : 'Pantau status verifikasi izin kehadiran kegiatan Anda.'}
            </p>
          </div>
        </div>
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
            {currentUser.role === 'PENGURUS' ? 'Sedang diproses Admin' : 'Memerlukan persetujuan'}
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
          onDelete={onDeletePermission}
        />
      </div>
    </div>
  );
};
