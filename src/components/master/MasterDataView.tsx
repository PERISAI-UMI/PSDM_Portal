import React, { useState, useEffect } from 'react';
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
  Layers,
  Filter,
} from 'lucide-react';
import type {
  FakultasItem,
  ProgramStudiItem,
  DepartmentItem,
  PjMappingItem,
  AuthUser,
} from '../../types/index.ts';

export type MasterDataTab = 'dept' | 'fakultas' | 'prodi' | 'pj';

interface MasterDataViewProps {
  currentUser?: AuthUser;
  fakultas: FakultasItem[];
  programStudi: ProgramStudiItem[];
  departments: DepartmentItem[];
  pjMappings: PjMappingItem[];
  admins: AuthUser[];
  initialTab?: MasterDataTab;
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
  currentUser,
  fakultas,
  programStudi,
  departments,
  pjMappings,
  admins,
  initialTab = 'dept',
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
  const isReadOnly = currentUser?.role === 'INTI';
  const [activeTab, setActiveTab] = useState<MasterDataTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Form states - Create
  const [selectedAdmin, setSelectedAdmin] = useState(admins[0]?.id || '');
  const [selectedDept, setSelectedDept] = useState(departments[0]?.id || '');
  const [newDeptName, setNewDeptName] = useState('');
  const [newFakultasName, setNewFakultasName] = useState('');
  const [newProdiName, setNewProdiName] = useState('');
  const [selectedFakultasForProdi, setSelectedFakultasForProdi] = useState(fakultas[0]?.id || '');

  // Search and Filter states
  const [deptSearch, setDeptSearch] = useState('');
  const [fakultasSearch, setFakultasSearch] = useState('');
  const [prodiSearch, setProdiSearch] = useState('');
  const [prodiFakultasFilter, setProdiFakultasFilter] = useState('');
  const [pjSearch, setPjSearch] = useState('');

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
  const filteredDepartments = departments.filter((d) => {
    const q = deptSearch.toLowerCase().trim();
    if (!q) return true;
    return d.nama.toLowerCase().includes(q) || d.id.toLowerCase().includes(q);
  });

  const filteredFakultas = fakultas.filter((f) => {
    const q = fakultasSearch.toLowerCase().trim();
    if (!q) return true;
    return f.nama.toLowerCase().includes(q) || f.id.toLowerCase().includes(q);
  });

  const filteredProdi = programStudi.filter((p) => {
    if (prodiFakultasFilter && p.fakultasId !== prodiFakultasFilter) {
      return false;
    }
    const q = prodiSearch.toLowerCase().trim();
    if (!q) return true;
    const fakultasNama = fakultas.find((f) => f.id === p.fakultasId)?.nama || '';
    return p.nama.toLowerCase().includes(q) || fakultasNama.toLowerCase().includes(q);
  });

  const filteredPjMappings = pjMappings.filter((m) => {
    const q = pjSearch.toLowerCase().trim();
    if (!q) return true;
    const adminName = (m.adminName || '').toLowerCase();
    const deptName = (m.departmentName || '').toLowerCase();
    return adminName.includes(q) || deptName.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-5 border-b border-slate-200/80">
        <div>
          <button
            type="button"
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Dasbor</span>
          </button>
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Master Data & Manajemen Struktur
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {isReadOnly
              ? 'Daftar struktur organisasi untuk Departemen, Fakultas, Jurusan / Program Studi, serta Penugasan PJ.'
              : 'Kelola penuh (CRUD: Tambah, Ubah, Hapus) untuk Departemen, Fakultas, Jurusan / Program Studi, serta Penugasan PJ.'}
          </p>
        </div>
      </div>

      {/* 4 Dedicated Tabs - Horizontally scrollable on mobile */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-b border-slate-200 text-xs font-semibold overflow-x-auto pb-px -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
        {/* Tab 1: Departemen */}
        <button
          type="button"
          onClick={() => setActiveTab('dept')}
          className={`py-2.5 sm:pb-3 px-3 sm:px-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'dept'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Departemen</span>
          <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
            {departments.length}
          </span>
        </button>

        {/* Tab 2: Fakultas */}
        <button
          type="button"
          onClick={() => setActiveTab('fakultas')}
          className={`py-2.5 sm:pb-3 px-3 sm:px-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'fakultas'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Fakultas</span>
          <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
            {fakultas.length}
          </span>
        </button>

        {/* Tab 3: Jurusan / Program Studi */}
        <button
          type="button"
          onClick={() => setActiveTab('prodi')}
          className={`py-2.5 sm:pb-3 px-3 sm:px-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'prodi'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Jurusan / Prodi</span>
          <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
            {programStudi.length}
          </span>
        </button>

        {/* Tab 4: Penugasan PJ */}
        <button
          type="button"
          onClick={() => setActiveTab('pj')}
          className={`py-2.5 sm:pb-3 px-3 sm:px-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'pj'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          <span>Penugasan PJ</span>
          <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
            {pjMappings.length}
          </span>
        </button>
      </div>

      {/* ────────────────── TAB 1: DEPARTEMEN ────────────────── */}
      {activeTab === 'dept' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Create Dept Form (Hidden for Read-Only) */}
          {!isReadOnly && (
            <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                <Plus className="w-4 h-4 text-slate-900" />
                <h2 className="text-sm font-bold text-slate-900">Tambah Departemen Baru</h2>
              </div>

              <form onSubmit={handleCreateDept} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Departemen
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
          )}

          {/* List Departemen with Edit & Delete */}
          <div className={`${isReadOnly ? 'lg:col-span-3' : 'lg:col-span-2'} bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs`}>
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
                  placeholder="Cari departemen..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 w-full sm:w-56"
                />
              </div>
            </div>

            {filteredDepartments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                {deptSearch ? 'Tidak ada departemen yang sesuai kata kunci.' : 'Belum ada departemen yang terdaftar.'}
              </div>
            ) : (
              <div className={`grid grid-cols-1 ${isReadOnly ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
                {filteredDepartments.map((d, idx) => (
                  <div
                    key={d.id}
                    className="p-3 sm:p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between hover:bg-slate-50 transition-all gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="text-xs font-mono font-bold text-slate-400 shrink-0">
                        #{String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">
                          {d.nama}
                        </span>
                      </div>
                    </div>

                    {!isReadOnly && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditModal({ type: 'dept', id: d.id, name: d.nama })}
                          className="p-2 sm:p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                          title="Edit Departemen"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingTarget({ type: 'dept', id: d.id, name: d.nama })}
                          className="p-2 sm:p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
                          title="Hapus Departemen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────── TAB 2: FAKULTAS ────────────────── */}
      {activeTab === 'fakultas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Create Fakultas Form (Hidden for Read-Only) */}
          {!isReadOnly && (
            <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                <Plus className="w-4 h-4 text-slate-900" />
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
          )}

          {/* List Fakultas with Edit & Delete */}
          <div className={`${isReadOnly ? 'lg:col-span-3' : 'lg:col-span-2'} bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-900" />
                <h2 className="text-sm font-bold text-slate-900">Daftar Fakultas Terdaftar</h2>
                <span className="text-xs text-slate-400 font-medium">
                  ({filteredFakultas.length})
                </span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={fakultasSearch}
                  onChange={(e) => setFakultasSearch(e.target.value)}
                  placeholder="Cari fakultas..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 w-full sm:w-56"
                />
              </div>
            </div>

            {filteredFakultas.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                {fakultasSearch ? 'Tidak ada fakultas yang cocok.' : 'Belum ada fakultas terdaftar.'}
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredFakultas.map((f, idx) => {
                  const prodisCount = programStudi.filter((p) => p.fakultasId === f.id).length;
                  return (
                    <div
                      key={f.id}
                      className="p-3 sm:p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <span className="text-xs font-mono font-bold text-slate-400 shrink-0">
                          #{String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 block truncate">
                            {f.nama}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span className="font-semibold text-slate-700">{prodisCount} Program Studi</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 shrink-0 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setProdiFakultasFilter(f.id);
                            setActiveTab('prodi');
                          }}
                          className="px-2.5 py-1.5 min-h-[36px] text-[11px] font-medium text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                          title="Lihat jurusan di fakultas ini"
                        >
                          <Layers className="w-3 h-3" />
                          <span>Jurusan</span>
                        </button>
                        {!isReadOnly && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditModal({ type: 'fakultas', id: f.id, name: f.nama })}
                              className="p-2 sm:p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                              title="Edit Fakultas"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingTarget({ type: 'fakultas', id: f.id, name: f.nama })}
                              className="p-2 sm:p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
                              title="Hapus Fakultas"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
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

      {/* ────────────────── TAB 3: JURUSAN / PROGRAM STUDI ────────────────── */}
      {activeTab === 'prodi' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Create Prodi Form (Hidden for Read-Only) */}
          {!isReadOnly && (
            <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                <Plus className="w-4 h-4 text-slate-900" />
                <h2 className="text-sm font-bold text-slate-900">Tambah Jurusan Baru</h2>
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
                    Nama Jurusan / Program Studi
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
                  <span>{isSubmitting ? 'Menyimpan...' : 'Tambah Jurusan'}</span>
                </button>
              </form>
            </div>
          )}

          {/* List Prodi with Filter, Edit & Delete */}
          <div className={`${isReadOnly ? 'lg:col-span-3' : 'lg:col-span-2'} bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs`}>
            <div className="flex flex-col gap-3 pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-slate-900" />
                  <h2 className="text-sm font-bold text-slate-900">Daftar Jurusan / Program Studi</h2>
                  <span className="text-xs text-slate-400 font-medium">
                    ({filteredProdi.length})
                  </span>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={prodiSearch}
                    onChange={(e) => setProdiSearch(e.target.value)}
                    placeholder="Cari nama jurusan..."
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 w-full"
                  />
                </div>

                <div className="relative">
                  <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <select
                    value={prodiFakultasFilter}
                    onChange={(e) => setProdiFakultasFilter(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 w-full"
                  >
                    <option value="">Semua Fakultas</option>
                    {fakultas.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {filteredProdi.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                {prodiSearch || prodiFakultasFilter ? 'Tidak ada jurusan yang sesuai filter.' : 'Belum ada jurusan terdaftar.'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProdi.map((p, idx) => {
                  const parentFak = fakultas.find((f) => f.id === p.fakultasId);
                  return (
                    <div
                      key={p.id}
                      className="p-3 sm:p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <span className="text-xs font-mono font-bold text-slate-400 shrink-0">
                          #{String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 block truncate">
                            {p.nama}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span className="px-2 py-0.2 rounded bg-white text-slate-700 font-semibold border border-slate-200 text-[10px]">
                              {parentFak?.nama || 'Fakultas'}
                            </span>
                          </span>
                        </div>
                      </div>

                      {!isReadOnly && (
                        <div className="flex items-center justify-end gap-1 shrink-0 self-end sm:self-auto">
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
                            className="p-2 sm:p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                            title="Edit Jurusan / Pindah Fakultas"
                          >
                            <Pencil className="w-3.5 h-3.5" />
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
                            className="p-2 sm:p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
                            title="Hapus Jurusan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────── TAB 4: PENUGASAN PJ ────────────────── */}
      {activeTab === 'pj' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Form Assign PJ (Hidden for Read-Only) */}
          {!isReadOnly && (
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
          )}

          {/* List Penugasan PJ */}
          <div className={`${isReadOnly ? 'lg:col-span-3' : 'lg:col-span-2'} bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs`}>
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
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {(m.adminName || 'PJ').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900">
                            {m.adminName || 'Admin PSDM'}
                          </span>
                          {m.adminPrn && (
                            <span className="font-mono text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {m.adminPrn}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>Membina:</span>
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-200/60">
                            {m.departmentName || 'Departemen'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => onRemovePj(m.adminId, m.departmentId)}
                        className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Hapus Penugasan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────── REUSABLE EDIT MODAL ────────────────── */}
      {editingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-slate-900" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingTarget.type === 'dept' && 'Edit Nama Departemen'}
                  {editingTarget.type === 'fakultas' && 'Edit Nama Fakultas'}
                  {editingTarget.type === 'prodi' && 'Edit Jurusan / Program Studi'}
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
                  Nama {editingTarget.type === 'dept' ? 'Departemen' : editingTarget.type === 'fakultas' ? 'Fakultas' : 'Jurusan / Program Studi'}
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

      {/* ────────────────── REUSABLE DELETE MODAL ────────────────── */}
      {deletingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Konfirmasi Hapus Data
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus {deletingTarget.type === 'dept' ? 'Departemen' : deletingTarget.type === 'fakultas' ? 'Fakultas' : 'Jurusan'}{' '}
                  <span className="font-semibold text-slate-900">"{deletingTarget.name}"</span>?
                </p>
                <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg p-2 mt-2 text-left">
                  ⚠️ Perhatian: Data yang masih digunakan atau berelasi dengan anggota pengurus aktif tidak dapat dihapus.
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
