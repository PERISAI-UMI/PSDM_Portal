import React, { useState, useEffect } from 'react';
import { X, UserCheck, Check, Search, ShieldCheck } from 'lucide-react';
import type { ActivityItem, AuthUser, AttendanceStatus } from '../../types/index.ts';
import { api } from '../../services/api.ts';

interface AttendanceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityItem | null;
  currentAdmin: AuthUser;
  onSuccess: () => void;
}

export const AttendanceScannerModal: React.FC<AttendanceScannerModalProps> = ({
  isOpen,
  onClose,
  activity,
  currentAdmin,
  onSuccess,
}) => {
  const [usersList, setUsersList] = useState<AuthUser[]>([]);
  const [search, setSearch] = useState('');
  const [attendancesMap, setAttendancesMap] = useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && activity) {
      loadData();
    }
  }, [isOpen, activity]);

  const loadData = async () => {
    const allUsers = await api.getUsers();
    // Filter pengurus yang relevan
    setUsersList(allUsers);

    if (activity) {
      const atts = await api.getAttendances(currentAdmin, activity.id);
      const map: Record<string, AttendanceStatus> = {};
      atts.forEach((a) => {
        map[a.userId] = a.status;
      });
      setAttendancesMap(map);
    }
  };

  if (!isOpen || !activity) return null;

  const handleSetStatus = async (userId: string, status: AttendanceStatus) => {
    setAttendancesMap((prev) => ({ ...prev, [userId]: status }));
    await api.recordAttendance(activity.id, userId, status, currentAdmin.id);
    onSuccess();
  };

  const handleMarkAllHadir = async () => {
    setSaving(true);
    const items = filteredUsers.map((u) => ({
      userId: u.id,
      status: 'HADIR' as AttendanceStatus,
    }));
    await api.recordBatchAttendance(activity.id, items, currentAdmin.id);
    const newMap = { ...attendancesMap };
    items.forEach((it) => {
      newMap[it.userId] = 'HADIR';
    });
    setAttendancesMap(newMap);
    setSaving(false);
    onSuccess();
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.namaLengkap.toLowerCase().includes(search.toLowerCase()) ||
      u.prn.toLowerCase().includes(search.toLowerCase()) ||
      (u.departmentName && u.departmentName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-200 max-h-[92vh] sm:max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 sm:pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-slate-900" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Pencatatan Presensi Lapangan</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kegiatan: <span className="font-semibold text-slate-700">{activity.nama}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 min-h-[40px] min-w-[40px] flex items-center justify-center"
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

          <button
            type="button"
            onClick={handleMarkAllHadir}
            disabled={saving || filteredUsers.length === 0}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 min-h-[42px] shadow-xs"
          >
            <Check className="w-4 h-4" />
            Set Semua yang Difilter: HADIR
          </button>
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

                    <div className="grid grid-cols-4 gap-1.5">
                      {(['HADIR', 'ALPHA', 'IZIN', 'SAKIT'] as AttendanceStatus[]).map((st) => (
                        <button
                          key={`m-${st}`}
                          type="button"
                          onClick={() => handleSetStatus(u.id, st)}
                          className={`min-h-[40px] py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center ${
                            currentStatus === st
                              ? st === 'HADIR'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : st === 'ALPHA'
                                ? 'bg-red-600 text-white shadow-xs'
                                : st === 'IZIN'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-amber-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
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

                    {/* Tombol Status Presensi */}
                    <div className="flex items-center gap-1 shrink-0">
                      {(['HADIR', 'ALPHA', 'IZIN', 'SAKIT'] as AttendanceStatus[]).map((st) => (
                        <button
                          key={`d-${st}`}
                          type="button"
                          onClick={() => handleSetStatus(u.id, st)}
                          className={`px-2.5 py-1.5 rounded text-[11px] font-bold transition-all min-w-[56px] text-center ${
                            currentStatus === st
                              ? st === 'HADIR'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : st === 'ALPHA'
                                ? 'bg-red-600 text-white shadow-xs'
                                : st === 'IZIN'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-amber-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
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
              Operator:{' '}
              <strong className="text-slate-800 font-semibold">{currentAdmin.namaLengkap}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg min-h-[40px]"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
