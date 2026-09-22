import React, { useState, useEffect } from 'react';
import { X, UserCheck, Check, Search, ShieldCheck, RotateCcw, Download, FileSpreadsheet } from 'lucide-react';
import type { ActivityItem, AuthUser, AttendanceStatus } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useToast } from '../ui/Toast.tsx';
import { broadcastRealtimeEvent, subscribeRealtimeEvents } from '../../utils/realtime.ts';
import { AttendanceImportModal } from './AttendanceImportModal.tsx';

interface AttendanceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityItem | null;
  currentAdmin: AuthUser;
  onSuccess: () => void;
  users?: AuthUser[];
}

export const AttendanceScannerModal: React.FC<AttendanceScannerModalProps> = ({
  isOpen,
  onClose,
  activity,
  currentAdmin,
  onSuccess,
  users: initialUsers,
}) => {
  const { showToast } = useToast();
  const [usersList, setUsersList] = useState<AuthUser[]>(initialUsers || []);
  const [search, setSearch] = useState('');
  const [attendancesMap, setAttendancesMap] = useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    if (isOpen && activity) {
      loadData();
    }
  }, [isOpen, activity]);

  // Real-time synchronization: memperbarui status absensi modal seketika jika admin lain mencatat absensi
  useEffect(() => {
    if (!isOpen || !activity) return;
    const unsubscribe = subscribeRealtimeEvents((event) => {
      if (event.type === 'ATTENDANCE_CHANGED' && activity) {
        api.getAttendances(currentAdmin, activity.id).then((atts) => {
          const map: Record<string, AttendanceStatus> = {};
          atts.forEach((a) => {
            map[a.userId] = a.status;
          });
          setAttendancesMap(map);
        }).catch(() => {});
      }
    });
    return unsubscribe;
  }, [isOpen, activity, currentAdmin]);

  useEffect(() => {
    if (initialUsers && initialUsers.length > 0) {
      setUsersList(initialUsers);
    }
  }, [initialUsers]);

  const loadData = async () => {
    try {
      let list = initialUsers && initialUsers.length > 0 ? initialUsers : [];
      if (list.length === 0) {
        list = await api.getUsers();
        setUsersList(list);
      }

      if (activity) {
        const atts = await api.getAttendances(currentAdmin, activity.id);
        const map: Record<string, AttendanceStatus> = {};
        atts.forEach((a) => {
          map[a.userId] = a.status;
        });
        setAttendancesMap(map);
      }
    } catch (err) {
      console.error('Failed to load attendance data:', err);
    }
  };

  const isMonitorOnly = currentAdmin.role === 'INTI';

  if (!isOpen || !activity) return null;

  const handleSetStatus = async (userId: string, status: AttendanceStatus) => {
    if (isMonitorOnly) return;
    const prevStatus = attendancesMap[userId];

    // Toggle off: jika status yang sama diklik lagi, batalkan / reset status pengurus tersebut
    if (prevStatus === status) {
      const optimisticMap = { ...attendancesMap };
      delete optimisticMap[userId];
      setAttendancesMap(optimisticMap);
      try {
        await api.resetAttendance(activity.id, [userId]);
        broadcastRealtimeEvent('ATTENDANCE_CHANGED');
        onSuccess();
      } catch (err: any) {
        console.error('Failed to un-mark attendance:', err);
        setAttendancesMap((prev) => ({ ...prev, [userId]: prevStatus }));
        showToast(err.message || 'Gagal membatalkan status presensi.', 'error');
      }
      return;
    }

    setAttendancesMap((prev) => ({ ...prev, [userId]: status }));
    try {
      await api.recordAttendance(activity.id, userId, status, currentAdmin.id);
      broadcastRealtimeEvent('ATTENDANCE_CHANGED');
      onSuccess();
    } catch (err: any) {
      console.error('Failed to record attendance:', err);
      setAttendancesMap((prev) => ({ ...prev, [userId]: prevStatus }));
      showToast(err.message || 'Gagal mengubah status presensi.', 'error');
    }
  };

  const handleMarkAllHadir = async () => {
    if (isMonitorOnly) return;
    const targets = search.trim() ? filteredUsers : usersList;
    if (targets.length === 0) return;

    // 1. Simpan snapshot untuk rollback jika gagal
    const prevMap = { ...attendancesMap };

    // 2. OPTIMISTIC UPDATE: Langsung ubah seluruh tombol menjadi HADIR seketika saat ditekan
    const optimisticMap = { ...attendancesMap };
    const items = targets.map((u) => {
      optimisticMap[u.id] = 'HADIR';
      return {
        userId: u.id,
        status: 'HADIR' as AttendanceStatus,
      };
    });
    setAttendancesMap(optimisticMap);
    setSaving(true);

    try {
      await api.recordBatchAttendance(activity.id, items, currentAdmin.id);
      broadcastRealtimeEvent('ATTENDANCE_CHANGED');
      onSuccess();
      showToast(`Berhasil menandai ${items.length} pengurus hadir!`, 'success');
    } catch (err: any) {
      console.error('Failed to batch record attendances:', err);
      // Rollback jika terjadi kegagalan jaringan atau server
      setAttendancesMap(prevMap);
      showToast(err.message || 'Gagal memperbarui presensi massal.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenResetConfirm = () => {
    if (isMonitorOnly) return;
    const targets = search.trim() ? filteredUsers : usersList;
    if (targets.length === 0) return;

    const countToReset = targets.filter((u) => attendancesMap[u.id]).length;
    if (countToReset === 0) {
      showToast('Belum ada status presensi yang tercatat untuk di-reset.', 'info');
      return;
    }

    setShowResetConfirmModal(true);
  };

  const handleCloseResetConfirm = () => {
    setShowResetConfirmModal(false);
  };

  const handleExport = async () => {
    if (!activity) return;
    try {
      setExporting(true);
      await api.exportAttendanceCSV(activity.id, activity.nama);
      showToast('Berkas CSV presensi berhasil diunduh!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengekspor presensi', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleExecuteReset = async () => {
    setShowResetConfirmModal(false);
    const targets = search.trim() ? filteredUsers : usersList;
    if (targets.length === 0) return;

    const prevMap = { ...attendancesMap };
    const optimisticMap = { ...attendancesMap };
    const targetUserIds = targets.map((u) => {
      delete optimisticMap[u.id];
      return u.id;
    });

    setAttendancesMap(optimisticMap);
    setSaving(true);

    try {
      await api.resetAttendance(
        activity.id,
        search.trim() ? targetUserIds : undefined
      );
      broadcastRealtimeEvent('ATTENDANCE_CHANGED');
      onSuccess();
      showToast('Status presensi berhasil di-reset!', 'success');
    } catch (err: any) {
      console.error('Failed to reset attendances:', err);
      setAttendancesMap(prevMap);
      showToast(err.message || 'Gagal mereset presensi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.namaLengkap.toLowerCase().includes(search.toLowerCase()) ||
      u.prn.toLowerCase().includes(search.toLowerCase()) ||
      (u.departmentName && u.departmentName.toLowerCase().includes(search.toLowerCase()))
  );

  const hadirCount = usersList.filter((u) => attendancesMap[u.id] === 'HADIR' || attendancesMap[u.id] === 'TELAT').length;
  const recordedCount = usersList.filter((u) => attendancesMap[u.id]).length;
  const targetCount = (search.trim() ? filteredUsers : usersList).length;

  const renderStatusBadge = (st: string) => {
    switch (st) {
      case 'HADIR':
        return (
          <span className="px-3 py-1 text-xs font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            HADIR
          </span>
        );
      case 'TELAT':
        return (
          <span className="px-3 py-1 text-xs font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200">
            TELAT
          </span>
        );
      case 'ALPHA':
        return (
          <span className="px-3 py-1 text-xs font-bold rounded-md bg-rose-50 text-rose-700 border border-rose-200">
            ALPHA
          </span>
        );
      case 'IZIN':
        return (
          <span className="px-3 py-1 text-xs font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            IZIN
          </span>
        );
      case 'SAKIT':
        return (
          <span className="px-3 py-1 text-xs font-bold rounded-md bg-purple-50 text-purple-700 border border-purple-200">
            SAKIT
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-500 border border-slate-200">
            Belum Presensi
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-200 max-h-[92vh] sm:max-h-[88vh] flex flex-col">
        <div className="flex items-start justify-between pb-3 sm:pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-slate-900" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {isMonitorOnly ? 'Rekap Presensi Kegiatan' : 'Presensi Kegiatan'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kegiatan: <span className="font-semibold text-slate-700">{activity.nama}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Quick Actions */}
        <div className="my-3 sm:my-4 flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, PRN, departemen..."
              className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[42px]"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 justify-between sm:justify-end">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
              Hadir: <strong className="text-emerald-700 font-bold">{hadirCount}</strong> / {usersList.length}
            </span>

            {currentAdmin.role === 'SUPER_ADMIN' && (
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="px-3.5 py-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-h-[42px] cursor-pointer shadow-xs active:scale-95"
                title="Khusus Super Admin: Import data presensi manual dari Excel / CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                <span>Import Excel</span>
              </button>
            )}

            {(currentAdmin.role === 'SUPER_ADMIN' || currentAdmin.role === 'ADMIN') && (
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="px-3.5 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-h-[42px] cursor-pointer shadow-xs active:scale-95"
                title="Export rekapan presensi ke CSV (Excel)"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                {exporting ? 'Mengekspor...' : 'Export CSV'}
              </button>
            )}

            {!isMonitorOnly && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenResetConfirm}
                  disabled={saving || recordedCount === 0}
                  className="px-3.5 py-2.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 min-h-[42px] cursor-pointer active:scale-95 shadow-xs"
                  title="Reset presensi menjadi belum absen"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>

                <button
                  type="button"
                  onClick={handleMarkAllHadir}
                  disabled={saving || targetCount === 0}
                  className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 min-h-[42px] shadow-xs active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {saving ? 'Menyimpan...' : `Tandai Semua Hadir (${targetCount})`}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* List Peserta */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl pr-1">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">Tidak ada anggota yang cocok.</div>
          ) : (
            filteredUsers.map((u) => {
              const currentStatus = attendancesMap[u.id] || 'BELUM_ABSEN';
              return (
                <div key={u.id} className="p-3 sm:p-3.5 hover:bg-slate-50 transition-colors">
                  {/* Mobile Layout (Stacked with wide touch grid) */}
                  <div className="sm:hidden space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-xs text-slate-900">{u.namaLengkap}</div>
                        <div className="text-[11px] text-slate-500">
                          {u.jabatan} • {u.departmentName || 'PSDM'}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                        {u.prn}
                      </span>
                    </div>

                    {isMonitorOnly ? (
                      <div className="pt-1 flex justify-end">
                        {renderStatusBadge(currentStatus)}
                      </div>
                    ) : (
                      <div className="grid grid-cols-5 gap-1">
                        {(['HADIR', 'TELAT', 'IZIN', 'SAKIT', 'ALPHA'] as AttendanceStatus[]).map((st) => (
                          <button
                            key={`m-${st}`}
                            type="button"
                            onClick={() => handleSetStatus(u.id, st)}
                            className={`min-h-[40px] py-1.5 px-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all flex items-center justify-center ${
                              currentStatus === st
                                ? st === 'HADIR'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : st === 'TELAT'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : st === 'ALPHA'
                                  ? 'bg-red-600 text-white shadow-xs'
                                  : st === 'IZIN'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-purple-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tablet & Desktop Layout (Side by Side) */}
                  <div className="hidden sm:flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">{u.namaLengkap}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                          {u.prn}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {u.jabatan} • {u.departmentName || 'PSDM'}
                      </div>
                    </div>

                    {/* Status Presensi Badge (Monitor) or Action Buttons (Admin/SuperAdmin) */}
                    {isMonitorOnly ? (
                      <div className="shrink-0">
                        {renderStatusBadge(currentStatus)}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 shrink-0">
                        {(['HADIR', 'TELAT', 'IZIN', 'SAKIT', 'ALPHA'] as AttendanceStatus[]).map((st) => (
                          <button
                            key={`d-${st}`}
                            type="button"
                            onClick={() => handleSetStatus(u.id, st)}
                            className={`px-2 py-1.5 rounded text-[11px] font-bold transition-all min-w-[50px] text-center ${
                              currentStatus === st
                                ? st === 'HADIR'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : st === 'TELAT'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : st === 'ALPHA'
                                  ? 'bg-red-600 text-white shadow-xs'
                                  : st === 'IZIN'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-purple-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Operator Badge Footer */}
        <div className="mt-3 sm:mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-center sm:text-left">
            <ShieldCheck className="w-4 h-4 text-slate-700 shrink-0" />
            <span>
              {isMonitorOnly ? 'Akses:' : 'Pencatat:'}{' '}
              <strong className="text-slate-800 font-semibold">{currentAdmin.namaLengkap}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg min-h-[40px] cursor-pointer"
          >
            {isMonitorOnly ? 'Tutup' : 'Selesai'}
          </button>
        </div>
      </div>

      {/* Custom Integrated Confirmation Modal for Reset */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200/90 flex flex-col animate-in zoom-in-95 duration-150">
            {/* Header with Danger/Warning Accent */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0 shadow-2xs">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Reset Presensi Kegiatan
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Konfirmasi pembatalan status presensi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Context Details Card */}
            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-medium">Kegiatan:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[210px]">
                  {activity.nama}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-medium">Target pengurus:</span>
                <span className="font-bold text-slate-900">
                  {targetCount} Orang {search.trim() ? '(Filter Pencarian)' : '(Seluruh Pengurus)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-medium">Sudah tercatat:</span>
                <span className="font-semibold text-rose-600">
                  {(search.trim() ? filteredUsers : usersList).filter((u) => attendancesMap[u.id]).length} Presensi akan dihapus
                </span>
              </div>
            </div>

            {/* Notice */}
            <p className="mt-3 text-xs text-slate-500 leading-relaxed">
              Tindakan ini akan menghapus catatan kehadiran anggota terpilih pada kegiatan ini dan mengembalikan status mereka menjadi <strong className="text-slate-700">Belum Absen</strong>.
            </p>

            {/* Actions */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl min-h-[38px] transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl min-h-[38px] transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Ya, Reset Presensi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Import Excel Modal */}
      <AttendanceImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        activity={activity}
        users={usersList}
        onSuccess={() => {
          loadData();
          onSuccess();
        }}
      />
    </div>
  );
};
