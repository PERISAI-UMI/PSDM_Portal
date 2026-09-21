import React, { useState } from 'react';
import { Check, X, ExternalLink, Clock, ShieldAlert, Search, Filter } from 'lucide-react';
import type { PermissionRecord, AuthUser, PermissionStatus } from '../../types/index.ts';

interface PermissionListTableProps {
  permissions: PermissionRecord[];
  currentUser: AuthUser;
  onReview?: (permissionId: string, status: PermissionStatus) => Promise<void>;
}

export const PermissionListTable: React.FC<PermissionListTableProps> = ({
  permissions,
  currentUser,
  onReview,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  const canReviewPermission = (p: PermissionRecord): boolean => {
    if (!onReview) return false;
    if (p.status !== 'PENDING') return false;
    if (currentUser.role === 'SUPER_ADMIN') return true;
    if (currentUser.role === 'ADMIN') {
      const assigned = currentUser.pjDepartments?.some(
        (pj) => pj.departmentId === p.userDepartmentId
      );
      return Boolean(assigned);
    }
    return false;
  };

  const filteredPermissions = permissions.filter((p) => {
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const query = search.toLowerCase().trim();
    if (!query) return matchesStatus;

    const matchesSearch =
      (p.userName && p.userName.toLowerCase().includes(query)) ||
      (p.userPrn && p.userPrn.toLowerCase().includes(query)) ||
      (p.activityName && p.activityName.toLowerCase().includes(query)) ||
      (p.jenisIzin && p.jenisIzin.toLowerCase().includes(query)) ||
      (p.alasan && p.alasan.toLowerCase().includes(query));

    return matchesStatus && matchesSearch;
  });

  if (permissions.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200/80 shadow-2xs">
        <p className="text-xs text-slate-500">Tidak ada data perizinan yang tercatat saat ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, PRN, atau kegiatan..."
            className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[38px]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: 'ALL', label: 'Semua' },
              { id: 'PENDING', label: 'Menunggu' },
              { id: 'APPROVED', label: 'Disetujui' },
              { id: 'REJECTED', label: 'Ditolak' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filteredPermissions.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs text-slate-500">
            Tidak ada permohonan yang sesuai dengan filter pencarian.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatusFilter('ALL');
            }}
            className="mt-2 text-xs font-semibold text-slate-900 hover:underline"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout (Hidden on md and up) */}
          <div className="md:hidden space-y-3">
            {filteredPermissions.map((p) => {
              const eligible = canReviewPermission(p);
              return (
                <div
                  key={`mob-${p.id}`}
                  className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-3"
                >
                  {/* Card Header: User & Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{p.userName}</div>
                      <div className="text-xs text-slate-500 font-mono">
                        {p.userPrn} • {p.userDepartmentName || 'Departemen'}
                      </div>
                    </div>

                    <div>
                      {p.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                      {p.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <Check className="w-3 h-3" />
                          Disetujui
                        </span>
                      )}
                      {p.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
                          <X className="w-3 h-3" />
                          Ditolak
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Proker & Category */}
                  <div className="bg-slate-50/70 p-3 rounded-lg space-y-1.5 text-xs border border-slate-100">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-medium text-slate-700">Kegiatan:</span>
                      <span>{new Date(p.createdAt).toLocaleDateString('id-ID')}</span>
                    </div>
                    <div className="font-semibold text-slate-900">{p.activityName}</div>

                    <div className="pt-1 flex items-center gap-2">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                        {p.jenisIzin}
                      </span>
                      {p.evidenceUrl ? (
                        <a
                          href={p.evidenceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 hover:text-slate-900 underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Dokumen Lampiran
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Tanpa Lampiran</span>
                      )}
                    </div>

                    <p className="text-slate-600 text-xs pt-1.5 border-t border-slate-200/60 leading-relaxed">
                      {p.alasan}
                    </p>
                  </div>

                  {/* Action Buttons for Mobile */}
                  {eligible ? (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onReview?.(p.id, 'APPROVED')}
                        className="min-h-[40px] py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Setujui
                      </button>
                      <button
                        type="button"
                        onClick={() => onReview?.(p.id, 'REJECTED')}
                        className="min-h-[40px] py-2 px-3 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <X className="w-3.5 h-3.5" />
                        Tolak
                      </button>
                    </div>
                  ) : (
                    p.status === 'PENDING' &&
                    currentUser.role === 'ADMIN' && (
                      <div className="text-[11px] text-slate-500 italic flex items-center justify-center gap-1 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                        <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                        Khusus PJ Departemen terkait
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop & Tablet Table Layout (Hidden on mobile) */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium">
                  <tr>
                    <th className="py-3 px-4">Nama & Departemen</th>
                    <th className="py-3 px-4">Kegiatan Proker</th>
                    <th className="py-3 px-4">Jenis & Alasan</th>
                    <th className="py-3 px-4">Dokumen</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredPermissions.map((p) => {
                    const eligible = canReviewPermission(p);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{p.userName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {p.userPrn} • {p.userDepartmentName || 'Departemen'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800 line-clamp-1">{p.activityName}</div>
                          <div className="text-[10px] text-slate-400">
                            Diajukan {new Date(p.createdAt).toLocaleDateString('id-ID')}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 mb-1">
                            {p.jenisIzin}
                          </span>
                          <p className="text-slate-600 line-clamp-2 text-[11px] leading-relaxed">{p.alasan}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          {p.evidenceUrl ? (
                            <a
                              href={p.evidenceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 hover:text-slate-900 underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Lampiran
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Tidak ada</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {p.status === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          )}
                          {p.status === 'APPROVED' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              <Check className="w-3 h-3" />
                              Disetujui
                            </span>
                          )}
                          {p.status === 'REJECTED' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
                              <X className="w-3 h-3" />
                              Ditolak
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {eligible ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onReview?.(p.id, 'APPROVED')}
                                className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] flex items-center gap-1 transition-colors shadow-2xs"
                              >
                                <Check className="w-3 h-3" />
                                Setujui
                              </button>
                              <button
                                type="button"
                                onClick={() => onReview?.(p.id, 'REJECTED')}
                                className="px-2.5 py-1 rounded-md bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-200 font-medium text-[11px] flex items-center gap-1 transition-colors"
                              >
                                <X className="w-3 h-3" />
                                Tolak
                              </button>
                            </div>
                          ) : (
                            p.status === 'PENDING' &&
                            currentUser.role === 'ADMIN' && (
                              <span
                                className="text-[10px] text-slate-400 italic flex items-center justify-end gap-1"
                                title="Bukan anggota departemen binaan Anda"
                              >
                                <ShieldAlert className="w-3 h-3" />
                                Bukan PJ Dept
                              </span>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
