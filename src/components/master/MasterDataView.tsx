import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Pencil,
  Link as LinkIcon,
  Building2,
  GraduationCap,
  ArrowLeft,
  Search,
  UserCheck,
  Shield,
  BookOpen,
  X,
  AlertTriangle,
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
  onUpdateFakultas: (id: string, nama: string) => Promise<void>;
  onDeleteFakultas: (id: string) => Promise<void>;
  onAddProdi: (fakultasId: string, nama: string) => Promise<void>;
  onUpdateProdi: (id: string, fakultasId: string, nama: string) => Promise<void>;
  onDeleteProdi: (id: string) => Promise<void>;
  onAddDept: (nama: string) => Promise<void>;
  onUpdateDept: (id: string, nama: string) => Promise<void>;
  onDeleteDept: (id: string) => Promise<void>;
  onAssignPj: (adminId: string, departmentId: string) => Promise<void>;
  onRemovePj: (adminId: string, departmentId: string) => Promise<void>;
}

type EditTarget =
  | { type: 'dept'; id: string; name: string }
  | { type: 'fakultas'; id: string; name: string }
  | { type: 'prodi'; id: string; name: string; fakultasId: string };

type DeleteTarget = {
  type: 'dept' | 'fakultas' | 'prodi';
  id: string;
  name: string;
};

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  fakultas,
  programStudi,
  departments,
  pjMappings,
  admins,
  onBackToDashboard,
  onAddFakultas,
  onUpdateFakultas,
  onDeleteFakultas,
  onAddProdi,
  onUpdateProdi,
  onDeleteProdi,
  onAddDept,
  onUpdateDept,
  onDeleteDept,
  onAssignPj,
  onRemovePj,
}) => {
  const [activeTab, setActiveTab] = useState<'pj' | 'dept' | 'prodi'>('pj');

  // Form states - Create
  const [selectedAdmin, setSelectedAdmin] = useState(admins[0]?.id || '');
  const [selectedDept, setSelectedDept] = useState(departments[0]?.id || '');
  const [newDeptName, setNewDeptName] = useState('');
  const [newFakultasName, setNewFakultasName] = useState('');
  const [newProdiName, setNewProdiName] = useState('');
  const [selectedFakultasForProdi, setSelectedFakultasForProdi] = useState(fakultas[0]?.id || '');

  // Search filter states
  const [pjSearch, setPjSearch] = useState('');
  const [deptSearch, setDeptSearch] = useState('');
  const [academicSearch, setAcademicSearch] = useState('');

  // Edit and Delete Modals
  const [editingTarget, setEditingTarget] = useState<EditTarget | null>(null);
  const [editName, setEditName] = useState('');
  const [editFakultasId, setEditFakultasId] = useState('');

  const [deletingTarget, setDeletingTarget] = useState<DeleteTarget | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Handler Create ──
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

  // ── Handler Edit ──
  const openEditModal = (target: EditTarget) => {
    setEditingTarget(target);
    setEditName(target.name);
    if (target.type === 'prodi') {
      setEditFakultasId(target.fakultasId);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTarget || !editName.trim()) return;
    try {
      setIsSubmitting(true);
      if (editingTarget.type === 'dept') {
        await onUpdateDept(editingTarget.id, editName.trim());
      } else if (editingTarget.type === 'fakultas') {
        await onUpdateFakultas(editingTarget.id, editName.trim());
      } else if (editingTarget.type === 'prodi') {
        await onUpdateProdi(editingTarget.id, editFakultasId, editName.trim());
      }
      setEditingTarget(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Handler Delete ──
  const handleConfirmDelete = async () => {
    if (!deletingTarget) return;
    try {
      setIsSubmitting(true);
      if (deletingTarget.type === 'dept') {
        await onDeleteDept(deletingTarget.id);
      } else if (deletingTarget.type === 'fakultas') {
        await onDeleteFakultas(deletingTarget.id);
      } else if (deletingTarget.type === 'prodi') {
        await onDeleteProdi(deletingTarget.id);
      }
      setDeletingTarget(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered lists
  const filteredPjMappings = pjMappings.filter((m) => {
    const q = pjSearch.toLowerCase().trim();
    if (!q) return true;
    const adminName = (m.adminName || '').toLowerCase();
    const deptName = (m.departmentName || '').toLowerCase();
    return adminName.includes(q) || deptName.includes(q);
  });

  const filteredDepartments = departments.filter((d) => {
    const q = deptSearch.toLowerCase().trim();
    if (!q) return true;
    return d.nama.toLowerCase().includes(q) || d.id.toLowerCase().includes(q);
  });

  const filteredFakultas = fakultas.filter((f) => {
    const q = academicSearch.toLowerCase().trim();
    if (!q) return true;
    const matchFak = f.nama.toLowerCase().includes(q);
    const matchProdi = programStudi.some(
      (p) => p.fakultasId === f.id && p.nama.toLowerCase().includes(q)
    );
    return matchFak || matchProdi;
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
              Master Data & Direktori Akademik
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-900 text-white">
              Super Admin
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan penuh (CRUD) Departemen Organisasi, Fakultas, Program Studi, serta Penugasan PJ.
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
            {fakultas.length} Fak • {programStudi.length} Prodi
          </span>
        </button>
      </div>

      {/* Tab 1: Penugasan PJ */}
      {activeTab === 'pj' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Form Assign PJ */}
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

          {/* List Penugasan PJ */}
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

      {/* Tab 2: Master Departemen (Full CRUD) */}
      {activeTab === 'dept' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Create Dept Form */}
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

          {/* List Departemen with Edit & Delete */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-900" />
                <h2 className="text-sm font-bold text-slate-900">Daftar Departemen Terdaftar</h2>
                <span className="text-xs text-slate-400 font-medium">
                  ({filteredDepartments.length})
                </span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  placeholder="Cari nama departemen..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 w-full sm:w-56"
                />
              </div>
            </div>

            {filteredDepartments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                {deptSearch ? 'Tidak ada departemen yang sesuai kata kunci.' : 'Belum ada departemen yang terdaftar.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredDepartments.map((d, idx) => (
                  <div
                    key={d.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between hover:bg-slate-50/90 transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="text-xs font-mono font-bold text-slate-400 shrink-0">
                        #{String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">
                          {d.nama}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 block truncate">
                          ID: {d.id.slice(0, 12)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditModal({ type: 'dept', id: d.id, name: d.nama })}
                        className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                        title="Edit Nama Departemen"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingTarget({ type: 'dept', id: d.id, name: d.nama })}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
                        title="Hapus Departemen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Fakultas & Program Studi (Full CRUD) */}
      {activeTab === 'prodi' && (
        <div className="space-y-6">
          {/* Creation Forms Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Form Tambah Fakultas */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                <BookOpen className="w-4 h-4 text-slate-900" />
                <h2 className="text-sm font-bold text-slate-900">Tambah Fakultas Baru</h2>
              </div>

              <form onSubmit={handleCreateFakultas} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Fakultas
                  </label>
                  <input
                    type="text"
                    value={newFakultasName}
                    onChange={(e) => setNewFakultasName(e.target.value)}
                    placeholder="Contoh: Fakultas Ilmu Komputer (FIKOM)"
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
                <h2 className="text-sm font-bold text-slate-900">Tambah Program Studi Baru</h2>
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
                    Nama Program Studi / Jurusan
                  </label>
                  <input
                    type="text"
                    value={newProdiName}
                    onChange={(e) => setNewProdiName(e.target.value)}
                    placeholder="Contoh: S1 Teknik Informatika"
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
                  <span>{isSubmitting ? 'Menyimpan...' : 'Tambah Program Studi'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Directory of Fakultas & Prodi with full Edit/Delete actions */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Direktori Akademik Terdaftar</h2>
                <span className="text-xs text-slate-400 font-medium">
                  {fakultas.length} Fakultas • {programStudi.length} Program Studi
                </span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={academicSearch}
                  onChange={(e) => setAcademicSearch(e.target.value)}
                  placeholder="Cari fakultas atau prodi..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 w-full sm:w-64"
                />
              </div>
            </div>

            {filteredFakultas.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                {academicSearch ? 'Tidak ada fakultas/prodi yang sesuai pencarian.' : 'Belum ada data fakultas.'}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFakultas.map((f) => {
                  const prodis = programStudi.filter((p) => p.fakultasId === f.id);
                  const searchFilteredProdis = academicSearch.trim()
                    ? prodis.filter((p) =>
                        p.nama.toLowerCase().includes(academicSearch.toLowerCase().trim())
                      )
                    : prodis;

                  return (
                    <div
                      key={f.id}
                      className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3"
                    >
                      {/* Faculty Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-slate-700 shrink-0" />
                          <span className="text-xs font-bold text-slate-900">{f.nama}</span>
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-full">
                            {prodis.length} Prodi
                          </span>
                        </div>

                        {/* Faculty Action Buttons */}
                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFakultasForProdi(f.id);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer"
                            title="Tambah prodi ke fakultas ini"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Tambah Prodi</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal({ type: 'fakultas', id: f.id, name: f.nama })}
                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-md border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                            title="Edit Nama Fakultas"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingTarget({ type: 'fakultas', id: f.id, name: f.nama })}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
                            title="Hapus Fakultas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Programs List */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                        {prodis.length === 0 ? (
                          <div className="col-span-full text-[11px] text-slate-400 italic py-1">
                            Belum ada program studi di fakultas ini.
                          </div>
                        ) : (
                          (academicSearch.trim() ? searchFilteredProdis : prodis).map((p) => (
                            <div
                              key={p.id}
                              className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-medium shadow-2xs flex items-center justify-between gap-2 hover:border-slate-300 transition-all group"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{p.nama}</span>
                              </div>

                              <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditModal({
                                      type: 'prodi',
                                      id: p.id,
                                      name: p.nama,
                                      fakultasId: p.fakultasId,
                                    })
                                  }
                                  className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                  title="Edit Program Studi"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeletingTarget({
                                      type: 'prodi',
                                      id: p.id,
                                      name: p.nama,
                                    })
                                  }
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                  title="Hapus Program Studi"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Reusable Edit Modal ── */}
      {editingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-slate-900" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingTarget.type === 'dept' && 'Edit Departemen'}
                  {editingTarget.type === 'fakultas' && 'Edit Fakultas'}
                  {editingTarget.type === 'prodi' && 'Edit Program Studi'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              {editingTarget.type === 'prodi' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fakultas Induk
                  </label>
                  <select
                    value={editFakultasId}
                    onChange={(e) => setEditFakultasId(e.target.value)}
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
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama {editingTarget.type === 'dept' ? 'Departemen' : editingTarget.type === 'fakultas' ? 'Fakultas' : 'Program Studi'}
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTarget(null)}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !editName.trim()}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reusable Delete Confirmation Modal ── */}
      {deletingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Konfirmasi Hapus Data
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus {deletingTarget.type === 'dept' ? 'Departemen' : deletingTarget.type === 'fakultas' ? 'Fakultas' : 'Program Studi'}{' '}
                  <span className="font-semibold text-slate-900">"{deletingTarget.name}"</span>?
                </p>
                <p className="text-[11px] text-amber-600 bg-amber-50 rounded-lg p-2 mt-2 text-left">
                  ⚠️ Perhatian: Data yang masih digunakan atau berelasi dengan anggota pengurus aktif tidak dapat dihapus secara sembarangan.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setDeletingTarget(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
