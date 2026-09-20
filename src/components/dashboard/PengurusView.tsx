import React, { useState } from 'react';
import {
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  Search,
  UserCheck,
} from 'lucide-react';
import type { ActivityItem, PermissionRecord, AttendanceRecord, AuthUser } from '../../types/index.ts';
import { ActivityCard } from '../activities/ActivityCard.tsx';
import { PermissionListTable } from '../permissions/PermissionListTable.tsx';

interface PengurusViewProps {
  currentUser: AuthUser;
  activities: ActivityItem[];
  myPermissions: PermissionRecord[];
  myAttendances: AttendanceRecord[];
  onOpenPermissionModal: (act?: ActivityItem) => void;
  onOpenProfile?: () => void;
  onViewDetail?: (act: ActivityItem) => void;
}

export const PengurusView: React.FC<PengurusViewProps> = ({
  currentUser,
  activities,
  myPermissions,
  myAttendances,
  onOpenPermissionModal,
  onOpenProfile,
  onViewDetail,
}) => {
  const [search, setSearch] = useState('');
  const hadirCount = myAttendances.filter((a) => a.status === 'HADIR').length;
  const izinCount = myAttendances.filter((a) => a.status === 'IZIN' || a.status === 'SAKIT').length;
  const alphaCount = myAttendances.filter((a) => a.status === 'ALPHA').length;
  const totalRecorded = myAttendances.length;
  const attendanceRate = totalRecorded > 0 ? Math.round((hadirCount / totalRecorded) * 100) : 100;

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
              Dasbor Anggota Pengurus
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              {currentUser.departmentName || 'Pengurus'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Selamat datang, <span className="font-semibold text-slate-700">{currentUser.namaLengkap}</span> ({currentUser.jabatan}). Pantau jadwal proker dan status kehadiran Anda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenPermissionModal()}
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <FileText className="w-4 h-4" />
            <span>Ajukan Izin / Sakit</span>
          </button>
        </div>
      </div>

      {/* Attendance Summary Panel */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-sm text-slate-900">
              Tingkat Kehadiran: <span className="text-emerald-600 font-bold">{attendanceRate}%</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tercatat {hadirCount} hadir dari {totalRecorded || activities.length} kegiatan aktif pada periode ini.
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
          PRN: {currentUser.prn}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Kegiatan Terjadwal</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-2">
            {activities.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Agenda resmi organisasi</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Presensi Hadir</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 tabular-nums tracking-tight mt-2">
            {hadirCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Kehadiran terkonfirmasi</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Izin / Sakit Disetujui</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 tabular-nums tracking-tight mt-2">
            {izinCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Disahkan oleh PJ PSDM</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Alpha / Tanpa Kabar</span>
            <AlertCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-2">
            {alphaCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Tidak tercatat di absensi</p>
        </div>
      </div>

      {/* Agenda Kegiatan & Kalender Proker */}
      <div id="section-activities" className="space-y-4 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Agenda Kegiatan Organisasi</h2>
            <p className="text-xs text-slate-500">
              Kegiatan program kerja yang telah dipublikasikan resmi oleh pengurus dan departemen.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama agenda..."
              className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
            />
          </div>
        </div>

        {filteredActivities.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
            {search ? 'Tidak ada agenda kegiatan yang cocok dengan pencarian.' : 'Belum ada kegiatan yang dipublikasikan saat ini.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredActivities.map((act) => (
              <ActivityCard
                key={act.id}
                activity={act}
                userRole={currentUser.role}
                onRequestPermission={() => onOpenPermissionModal(act)}
                onViewDetail={onViewDetail}
              />
            ))}
          </div>
        )}
      </div>

      {/* Riwayat Pengajuan Izin Saya */}
      <div id="section-permissions" className="space-y-4 pt-2 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Riwayat Permohonan Izin Saya</h2>
            <p className="text-xs text-slate-500">
              Pantau proses validasi permohonan izin atau surat keterangan sakit Anda oleh Staf PSDM.
            </p>
          </div>
        </div>

        <PermissionListTable
          permissions={myPermissions}
          currentUser={currentUser}
          onReview={async () => {}}
        />
      </div>
    </div>
  );
};
