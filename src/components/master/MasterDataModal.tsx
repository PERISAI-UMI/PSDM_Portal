import React, { useState } from 'react';
import { X, Database, Plus, Trash2, Link } from 'lucide-react';
import type {
  FakultasItem,
  ProgramStudiItem,
  DepartmentItem,
  PjMappingItem,
  AuthUser,
} from '../../types/index.ts';

interface MasterDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  fakultas: FakultasItem[];
  programStudi: ProgramStudiItem[];
  departments: DepartmentItem[];
  pjMappings: PjMappingItem[];
  admins: AuthUser[];
  onAddFakultas: (nama: string) => Promise<void>;
  onAddProdi: (fakultasId: string, nama: string) => Promise<void>;
  onAddDept: (nama: string) => Promise<void>;
  onAssignPj: (adminId: string, departmentId: string) => Promise<void>;
  onRemovePj: (adminId: string, departmentId: string) => Promise<void>;
}

export const MasterDataModal: React.FC<MasterDataModalProps> = ({
  isOpen,
  onClose,
  fakultas,
  programStudi,
  departments,
  pjMappings,
  admins,
  onAddFakultas,
  onAddProdi,
  onAddDept,
  onAssignPj,
  onRemovePj,
}) => {
  const [activeTab, setActiveTab] = useState<'pj' | 'dept' | 'prodi' | 'fakultas'>('pj');
  const [selectedAdmin, setSelectedAdmin] = useState(admins[0]?.id || '');
  const [selectedDept, setSelectedDept] = useState(departments[0]?.id || '');
  const [newDeptName, setNewDeptName] = useState('');
  const [newFakultasName, setNewFakultasName] = useState('');
  const [newProdiName, setNewProdiName] = useState('');
  const [selectedFakultasId, setSelectedFakultasId] = useState(fakultas[0]?.id || '');

  if (!isOpen) return null;

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin || !selectedDept) return;
    await onAssignPj(selectedAdmin, selectedDept);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-200 max-h-[92vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-slate-900" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Kelola Master Data & Mapping PJ</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Responsive Tabs */}
        <div className="flex border-b border-slate-200 text-xs font-semibold my-3 sm:my-4 overflow-x-auto whitespace-nowrap">
          <button
            type="button"
            onClick={() => setActiveTab('pj')}
            className={`py-2 px-3 sm:px-4 border-b-2 transition-colors shrink-0 ${
              activeTab === 'pj' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500'
            }`}
          >
            Mapping PJ Departemen
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dept')}
            className={`py-2 px-3 sm:px-4 border-b-2 transition-colors shrink-0 ${
              activeTab === 'dept' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500'
            }`}
          >
            Master Departemen
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('prodi')}
            className={`py-2 px-3 sm:px-4 border-b-2 transition-colors shrink-0 ${
              activeTab === 'prodi' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500'
            }`}
          >
            Fakultas & Prodi
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'pj' && (
            <div className="space-y-4">
              <form onSubmit={handleAssign} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5" />
                  Tugaskan Staf PSDM sebagai PJ Departemen
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Staf PSDM (Admin)</label>
                    <select
                      value={selectedAdmin}
                      onChange={(e) => setSelectedAdmin(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white min-h-[42px]"
                    >
                      {admins.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.namaLengkap} ({a.prn})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Departemen Binaan</label>
                    <select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white min-h-[42px]"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 flex items-center justify-center gap-1.5 min-h-[42px] transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Simpan Penugasan PJ
                </button>
              </form>

              {/* List PJ */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700">Daftar Mapping PJ Aktif:</div>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {pjMappings.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">Belum ada penugasan PJ.</div>
                  ) : (
                    pjMappings.map((m) => (
                      <div key={`${m.adminId}-${m.departmentId}`} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                        <div>
                          <div className="font-bold text-slate-900">{m.adminName}</div>
                          <div className="text-slate-500 font-medium">
                            Membina: <span className="text-blue-700 font-semibold">{m.departmentName}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemovePj(m.adminId, m.departmentId)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Hapus Penugasan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dept' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="Nama Departemen Baru..."
                  className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 min-h-[42px]"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (newDeptName.trim()) {
                      await onAddDept(newDeptName.trim());
                      setNewDeptName('');
                    }
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 flex items-center justify-center gap-1 min-h-[42px] transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah
                </button>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {departments.map((d) => (
                  <div key={d.id} className="p-3 text-xs font-medium text-slate-800">
                    {d.nama}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'prodi' && (
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-700">Fakultas Terdaftar:</div>
              <div className="flex flex-wrap gap-2">
                {fakultas.map((f) => (
                  <span key={f.id} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-medium border">
                    {f.nama}
                  </span>
                ))}
              </div>

              <div className="text-xs font-bold text-slate-700 mt-4">Program Studi Terdaftar:</div>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {programStudi.map((p) => (
                  <div key={p.id} className="p-2.5 text-xs text-slate-800 flex justify-between">
                    <span>{p.nama}</span>
                    <span className="text-[11px] text-slate-400 font-mono">ID: {p.fakultasId}</span>
                  </div>
                ))}
              </div>
            </div>
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
