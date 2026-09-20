import React, { useState } from 'react';
import { X, Users, Search, Shield, UserPlus } from 'lucide-react';
import type { AuthUser } from '../../types/index.ts';

interface MemberListModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: AuthUser[];
  currentUser: AuthUser;
}

export const MemberListModal: React.FC<MemberListModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
}) => {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  if (!isOpen) return null;

  const departmentsList = Array.from(new Set(users.map((u) => u.departmentName || 'PSDM')));

  const filtered = users.filter((u) => {
    const matchSearch =
      u.namaLengkap.toLowerCase().includes(search.toLowerCase()) ||
      u.prn.toLowerCase().includes(search.toLowerCase()) ||
      u.jabatan.toLowerCase().includes(search.toLowerCase());
    const matchDept = selectedDept === 'ALL' || (u.departmentName || 'PSDM') === selectedDept;
    return matchSearch && matchDept;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-200 max-h-[92vh] sm:max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-900" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Database Anggota & Pengurus</h2>
              <p className="text-xs text-slate-500">
                {currentUser.role === 'ADMIN' ? 'Akses Read-Only Staf PSDM' : 'Kelola Data Pengurus Organisasi'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="my-3 sm:my-4 flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, PRN, jabatan..."
              className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 min-h-[42px]"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
          </div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white min-h-[42px]"
          >
            <option value="ALL">Semua Departemen</option>
            {departmentsList.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* List of Members */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl pr-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">Tidak ada anggota yang sesuai.</div>
          ) : (
            filtered.map((m) => (
              <div key={m.id} className="p-3 sm:p-3.5 hover:bg-slate-50 transition-colors">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="font-bold text-xs sm:text-sm text-slate-900">{m.namaLengkap}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {m.prn}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      m.role === 'SUPER_ADMIN'
                        ? 'bg-red-100 text-red-800'
                        : m.role === 'ADMIN'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {m.role}
                  </span>
                </div>
                <div className="text-xs text-slate-600 font-medium mt-1">
                  {m.jabatan} • <span className="text-slate-500">{m.departmentName || 'PSDM'}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                  <span>NIM: {m.nim}</span>
                  <span>Prodi: {m.programStudiName || 'Informatika'}</span>
                  <span>Generasi {m.generasi}</span>
                  <span>Telp: {m.noTelp}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-3 sm:mt-4 pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg min-h-[40px]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
