import React, { useState } from 'react';
import {
  Database,
  Plus,
  Trash2,
  Link as LinkIcon,
  Building2,
  GraduationCap,
  ArrowLeft,
  Search,
  UserCheck,
  Shield,
  BookOpen,
} from 'lucide-react';
import type {
  FakultasItem,
  ProgramStudiItem,
  DepartmentItem,
  PjMappingItem,
  AuthUser,
} from '../../types/index.ts';

interface MasterDataViewProps {
  fakultas: FakultasItem[];
  programStudi: ProgramStudiItem[];
  departments: DepartmentItem[];
  pjMappings: PjMappingItem[];
  admins: AuthUser[];
  onBackToDashboard: () => void;
  onAddFakultas: (nama: string) => Promise<void>;
  onAddProdi: (fakultasId: string, nama: string) => Promise<void>;
  onAddDept: (nama: string) => Promise<void>;
  onAssignPj: (adminId: string, departmentId: string) => Promise<void>;
  onRemovePj: (adminId: string, departmentId: string) => Promise<void>;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  fakultas,
  programStudi,
  departments,
  pjMappings,
  admins,
  onBackToDashboard,
  onAddFakultas,
  onAddProdi,
  onAddDept,
  onAssignPj,
  onRemovePj,
}) => {
  const [activeTab, setActiveTab] = useState<'pj' | 'dept' | 'prodi'>('pj');

  // Form states
  const [selectedAdmin, setSelectedAdmin] = useState(admins[0]?.id || '');
  const [selectedDept, setSelectedDept] = useState(departments[0]?.id || '');
  const [newDeptName, setNewDeptName] = useState('');
  const [newFakultasName, setNewFakultasName] = useState('');
  const [newProdiName, setNewProdiName] = useState('');
  const [selectedFakultasForProdi, setSelectedFakultasForProdi] = useState(fakultas[0]?.id || '');

  // Search filter for PJ
  const [pjSearch, setPjSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin || !selectedDept) return;
    try {
      setIsSubmitting(true);
      await onAssignPj(selectedAdmin, selectedDept);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    try {
      setIsSubmitting(true);
      await onAddDept(newDeptName.trim());
      setNewDeptName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateFakultas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFakultasName.trim()) return;
    try {
      setIsSubmitting(true);
      await onAddFakultas(newFakultasName.trim());
      setNewFakultasName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateProdi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdiName.trim() || !selectedFakultasForProdi) return;
    try {
      setIsSubmitting(true);
      await onAddProdi(selectedFakultasForProdi, newProdiName.trim());
      setNewProdiName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPjMappings = pjMappings.filter((m) => {
    const q = pjSearch.toLowerCase().trim();
    if (!q) return true;
    const adminName = (m.adminName || '').toLowerCase();
    const deptName = (m.departmentName || '').toLowerCase();
    return adminName.includes(q) || deptName.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200/80">
        <div>
          <button
            type="button"
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Dasbor</span>
          </button>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Master Data & Penugasan PJ
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-900 text-white">
              Super Admin
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan penugasan PJ departemen, direktori unit kerja, serta fakultas dan program studi.
          </p>
        </div>
      </div>

      {/* Modern Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('pj')}
          className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'pj'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          <span>Penugasan PJ Departemen</span>
          <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
            {pjMappings.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dept')}
          className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'dept'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Master Departemen</span>
          <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
            {departments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('prodi')}
          className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'prodi'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Fakultas & Program Studi</span>
          <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
            {programStudi.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Penugasan PJ */}
      {activeTab === 'pj' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Form Assign PJ (1 Col) */}
          <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
              <UserCheck className="w-4 h-4 text-slate-900" />
              <h2 className="text-sm font-bold text-slate-900">Tugaskan PJ Baru</h2>
            </div>

            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Staf Admin PSDM
                </label>
                <select
                  value={selectedAdmin}
                  onChange={(e) => setSelectedAdmin(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                >
                  {admins.length === 0 ? (
                    <option value="">Tidak ada akun Admin</option>
                  ) : (
                    admins.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.namaLengkap} ({a.prn})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Departemen Binaan
                </label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                >
                  {departments.length === 0 ? (
                    <option value="">Tidak ada data Departemen</option>
                  ) : (
                    departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nama}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || admins.length === 0 || departments.length === 0}
                className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Penugasan'}</span>
              </button>
            </form>
          </div>

          {/* List Penugasan PJ (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-900" />
                <h2 className="text-sm font-bold text-slate-900">Daftar Penugasan PJ Aktif</h2>
                <span className="text-xs text-slate-400 font-normal">
                  ({filteredPjMappings.length})
                </span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={pjSearch}
                  onChange={(e) => setPjSearch(e.target.value)}
                  placeholder="Cari admin atau departemen..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 w-full sm:w-56"
                />
              </div>
            </div>

            {filteredPjMappings.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                {pjSearch ? 'Tidak ada penugasan yang sesuai pencarian.' : 'Belum ada penugasan PJ yang terdaftar.'}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden">
                {filteredPjMappings.map((m) => (
                  <div
                    key={`${m.adminId}-${m.departmentId}`}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {(m.adminName || 'PJ').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-slate-900">
                          {m.adminName || 'Admin PSDM'}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>Membina:</span>
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-200/60">
                            {m.departmentName || 'Departemen'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemovePj(m.adminId, m.departmentId)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Penugasan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Master Departemen */}
      {activeTab === 'dept' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
              <Plus className="w-4 h-4 text-slate-900" />
              <h2 className="text-sm font-bold text-slate-900">Tambah Departemen</h2>
            </div>

            <form onSubmit={handleCreateDept} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Departemen Baru
                </label>
                <input
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="Contoh: Riset & Teknologi"
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !newDeptName.trim()}
                className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Tambah Departemen'}</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-900" />
                <h2 className="text-sm font-bold text-slate-900">Daftar Departemen Terdaftar</h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Total: {departments.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {departments.map((d, idx) => (
                <div
                  key={d.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      #{String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{d.nama}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-500 border border-slate-200">
                    ID: {d.id.slice(0, 8)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Fakultas & Program Studi */}
      {activeTab === 'prodi' && (
        <div className="space-y-6">
          {/* Forms Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Form Tambah Fakultas */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                <BookOpen className="w-4 h-4 text-slate-900" />
                <h2 className="text-sm font-bold text-slate-900">Tambah Fakultas</h2>
              </div>

              <form onSubmit={handleCreateFakultas} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Fakultas Baru
                  </label>
                  <input
                    type="text"
                    value={newFakultasName}
                    onChange={(e) => setNewFakultasName(e.target.value)}
                    placeholder="Contoh: Fakultas Ilmu Komputer"
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !newFakultasName.trim()}
                  className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Tambah Fakultas'}</span>
                </button>
              </form>
            </div>

            {/* Form Tambah Prodi */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                <GraduationCap className="w-4 h-4 text-slate-900" />
                <h2 className="text-sm font-bold text-slate-900">Tambah Program Studi</h2>
              </div>

              <form onSubmit={handleCreateProdi} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pilih Fakultas Induk
                  </label>
                  <select
                    value={selectedFakultasForProdi}
                    onChange={(e) => setSelectedFakultasForProdi(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  >
                    {fakultas.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Program Studi
                  </label>
                  <input
                    type="text"
                    value={newProdiName}
                    onChange={(e) => setNewProdiName(e.target.value)}
                    placeholder="Contoh: Teknik Informatika"
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !newProdiName.trim() || fakultas.length === 0}
                  className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Tambah Prodi'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* List Data Fakultas & Prodi Terdaftar */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Direktori Akademik Terdaftar</h2>
              <span className="text-xs text-slate-400 font-medium">
                {fakultas.length} Fakultas • {programStudi.length} Program Studi
              </span>
            </div>

            <div className="space-y-4">
              {fakultas.map((f) => {
                const prodis = programStudi.filter((p) => p.fakultasId === f.id);
                return (
                  <div
                    key={f.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-slate-700" />
                        <span className="text-xs font-bold text-slate-900">{f.nama}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {prodis.length} Prodi
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {prodis.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic">
                          Belum ada program studi.
                        </span>
                      ) : (
                        prodis.map((p) => (
                          <span
                            key={p.id}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-medium shadow-2xs"
                          >
                            {p.nama}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
