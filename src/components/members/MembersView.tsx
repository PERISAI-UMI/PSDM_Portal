import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Building2,
  GraduationCap,
  Mail,
  Phone,
  LayoutGrid,
  List,
  ShieldCheck,
  UserCheck,
  Globe,
  Instagram,
  Linkedin,
  Plus,
  Edit2,
  Trash2,
  FileSpreadsheet,
} from 'lucide-react';
import type { AuthUser, DepartmentItem, ProgramStudiItem } from '../../types/index.ts';
import { MemberFormModal } from './MemberFormModal.tsx';
import { MemberImportModal } from './MemberImportModal.tsx';
import { ConfirmModal } from '../ui/ConfirmModal.tsx';

interface MembersViewProps {
  currentUser: AuthUser;
  users: AuthUser[];
  departments?: DepartmentItem[];
  programStudi?: ProgramStudiItem[];
  onCreateMember?: (newUser: Omit<AuthUser, 'id'>) => Promise<void>;
  onUpdateMember?: (id: string, updates: Partial<AuthUser>) => Promise<void>;
  onDeleteMember?: (id: string) => Promise<void>;
  onImportMembers?: (users: any[]) => Promise<{
    importedCount: number;
    updatedCount?: number;
    skippedCount: number;
    errors: { prn: string; reason: string }[];
  }>;
}

export const MembersView: React.FC<MembersViewProps> = ({
  currentUser,
  users,
  departments = [],
  programStudi = [],
  onCreateMember,
  onUpdateMember,
  onDeleteMember,
  onImportMembers,
}) => {
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedRole, setSelectedRole] = useState<'ALL' | 'SUPER_ADMIN' | 'ADMIN' | 'PENGURUS' | 'INTI'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<AuthUser | null>(null);
  const [deletingMember, setDeletingMember] = useState<AuthUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available departments
  const departmentOptions = useMemo(() => {
    if (departments.length > 0) {
      return departments.map((d) => ({ id: d.id, name: d.nama }));
    }
    const unique = Array.from(new Set(users.map((u) => u.departmentName || 'Umum')));
    return unique.map((d) => ({ id: d, name: d }));
  }, [departments, users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        u.namaLengkap.toLowerCase().includes(q) ||
        u.prn.toLowerCase().includes(q) ||
        (u.nim && u.nim.toLowerCase().includes(q)) ||
        (u.jabatan && u.jabatan.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.programStudiName && u.programStudiName.toLowerCase().includes(q));

      const matchDept =
        selectedDept === 'ALL' ||
        u.departmentId === selectedDept ||
        u.departmentName === selectedDept;

      const matchRole = selectedRole === 'ALL' || u.role === selectedRole;

      return matchSearch && matchDept && matchRole;
    });
  }, [users, search, selectedDept, selectedRole]);

  const superAdminCount = users.filter((u) => u.role === 'SUPER_ADMIN').length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const pengurusCount = users.filter((u) => u.role === 'PENGURUS').length;

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { label: 'Super Admin', className: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'ADMIN':
        return { label: 'Admin PJ', className: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'INTI':
        return { label: 'Pengurus Inti', className: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'PENGURUS':
      default:
        return { label: 'Pengurus', className: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      setIsSubmitting(true);
      if (editingMember) {
        if (onUpdateMember) {
          await onUpdateMember(editingMember.id, formData);
        }
      } else {
        if (onCreateMember) {
          await onCreateMember(formData);
        }
      }
      setIsFormModalOpen(false);
      setEditingMember(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingMember || !onDeleteMember) return;
    try {
      setIsSubmitting(true);
      await onDeleteMember(deletingMember.id);
      setDeletingMember(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Direktori Anggota
            </h1>
            <p className="text-xs text-slate-500">
              Pangkalan data seluruh fungsionaris, penanggung jawab, dan pengurus organisasi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Super Admin Action: Import Anggota */}
          {isSuperAdmin && onImportMembers && (
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import Excel / CSV</span>
            </button>
          )}

          {/* Super Admin Action: Tambah Anggota */}
          {isSuperAdmin && onCreateMember && (
            <button
              type="button"
              onClick={() => {
                setEditingMember(null);
                setIsFormModalOpen(true);
              }}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Anggota</span>
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Tampilan Kartu"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Kartu</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Tampilan Tabel"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Tabel</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Fungsionaris</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-1.5">
            {users.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Anggota terdaftar</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pengurus Aktif</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-1.5">
            {pengurusCount}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Fungsionaris departemen</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Admin PJ PSDM</span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-1.5">
            {adminCount}
          </div>
          <p className="text-[11px] text-blue-600 font-medium mt-0.5">Penanggung jawab wilayah</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Super Admin</span>
            <ShieldCheck className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-1.5">
            {superAdminCount}
          </div>
          <p className="text-[11px] text-rose-600 font-medium mt-0.5">Pimpinan departemen PSDM</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, PRN, NIM, jabatan, atau prodi..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="ALL">Semua Departemen</option>
            {departmentOptions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="ALL">Semua Role</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="INTI">Pengurus Inti</option>
            <option value="ADMIN">Admin PJ</option>
            <option value="PENGURUS">Pengurus</option>
          </select>
        </div>
      </div>

      {/* Member Directory Content */}
      {filteredUsers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">Tidak ada anggota ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Tidak ada data fungsionaris yang sesuai dengan filter atau kata kunci pencarian Anda.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setSelectedDept('ALL');
              setSelectedRole('ALL');
            }}
            className="mt-3 px-3 py-1.5 text-xs text-slate-600 font-medium hover:text-slate-900 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Reset Filter
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const badge = getRoleBadge(user.role);
            return (
              <div
                key={user.id}
                className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Avatar, PRN & Role */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-2xs">
                        {getInitials(user.namaLengkap)}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 leading-tight">
                          {user.namaLengkap}
                        </h3>
                        <span className="font-mono text-[11px] text-slate-500 tracking-wider">
                          {user.prn}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 py-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium truncate">
                        {user.departmentName || 'Departemen PSDM'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {user.programStudiName || 'Program Studi'} {user.angkatan ? `(${user.angkatan})` : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate text-[11px]">{user.email}</span>
                    </div>

                    {user.noTelp && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate text-[11px]">{user.noTelp}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Badges, Socials & Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="text-[11px] font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                    {user.jabatan || 'Pengurus'}
                  </span>

                  <div className="flex items-center gap-2">
                    {user.instagramUsername && (
                      <a
                        href={`https://instagram.com/${user.instagramUsername.replace('@', '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-slate-700 transition-colors"
                        title={`Instagram: ${user.instagramUsername}`}
                      >
                        <Instagram className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {user.linkedinUrl && (
                      <a
                        href={user.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-blue-600 transition-colors"
                        title="LinkedIn Profile"
                      >
                        <Linkedin className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {/* Super Admin Edit / Delete Buttons */}
                    {isSuperAdmin && onUpdateMember && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMember(user);
                          setIsFormModalOpen(true);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer ml-1"
                        title="Ubah Anggota"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isSuperAdmin && onDeleteMember && currentUser.id !== user.id && (
                      <button
                        type="button"
                        onClick={() => setDeletingMember(user)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Hapus Anggota"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table Mode */
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[840px]">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 min-w-[200px]">Anggota</th>
                  <th className="py-3 px-4 whitespace-nowrap">PRN & NIM</th>
                  <th className="py-3 px-4 whitespace-nowrap min-w-[130px]">Role</th>
                  <th className="py-3 px-4 whitespace-nowrap">Departemen</th>
                  <th className="py-3 px-4 whitespace-nowrap min-w-[150px]">Program Studi</th>
                  <th className="py-3 px-4 whitespace-nowrap min-w-[160px]">Kontak</th>
                  {isSuperAdmin && <th className="py-3 px-4 text-right whitespace-nowrap">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const badge = getRoleBadge(user.role);
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {getInitials(user.namaLengkap)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {user.namaLengkap}
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              {user.jabatan || 'Pengurus'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded inline-block font-medium">
                          {user.prn}
                        </span>
                        {user.nim && (
                          <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                            {user.nim}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap min-w-[130px]">
                        <span
                          className={`inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">
                        {user.departmentName || '-'}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <span>{user.programStudiName || '-'}</span>
                        {user.angkatan ? (
                          <span className="text-slate-400 block text-[11px]">
                            Angkatan {user.angkatan}
                          </span>
                        ) : null}
                      </td>

                      <td className="py-3 px-4 text-slate-600 space-y-0.5">
                        <span className="block text-[11px] truncate max-w-[160px]">
                          {user.email}
                        </span>
                        {user.noTelp && (
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {user.noTelp}
                          </span>
                        )}
                      </td>

                      {isSuperAdmin && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {onUpdateMember && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMember(user);
                                  setIsFormModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                title="Ubah Anggota"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {onDeleteMember && currentUser.id !== user.id && (
                              <button
                                type="button"
                                onClick={() => setDeletingMember(user)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                title="Hapus Anggota"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal (Create / Edit) */}
      {isFormModalOpen && (
        <MemberFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingMember(null);
          }}
          onSubmit={handleFormSubmit}
          member={editingMember}
          departments={departments}
          programStudi={programStudi}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Confirm Delete Modal */}
      {deletingMember && (
        <ConfirmModal
          isOpen={Boolean(deletingMember)}
          onClose={() => setDeletingMember(null)}
          onConfirm={handleDeleteConfirm}
          title="Hapus Anggota"
          message={`Apakah Anda yakin ingin menghapus akun anggota "${deletingMember.namaLengkap}" (${deletingMember.prn})? Data yang dihapus tidak dapat dipulihkan.`}
          confirmLabel="Hapus Anggota"
          isDanger
        />
      )}

      {/* Member Import Modal (Excel / CSV) */}
      {isImportModalOpen && onImportMembers && (
        <MemberImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={onImportMembers}
          departments={departments}
          programStudi={programStudi}
        />
      )}
    </div>
  );
};
