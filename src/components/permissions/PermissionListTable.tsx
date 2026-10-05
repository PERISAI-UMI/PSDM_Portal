import React, { useState, useEffect } from 'react';
import { Check, X, ExternalLink, Clock, ShieldAlert, Search, Filter, Eye, RotateCcw, Trash2 } from 'lucide-react';
import type { PermissionRecord, AuthUser, PermissionStatus } from '../../types/index.ts';
import { getEvidenceViewUrl } from '../../utils/storage.ts';
import { ConfirmModal } from '../ui/ConfirmModal.tsx';

interface PermissionListTableProps {
  permissions: PermissionRecord[];
  currentUser: AuthUser;
  onReview?: (permissionId: string, status: PermissionStatus) => Promise<void>;
  onDelete?: (permissionId: string) => Promise<void>;
}

export const PermissionListTable: React.FC<PermissionListTableProps> = ({
  permissions,
  currentUser,
  onReview,
  onDelete,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [previewPermission, setPreviewPermission] = useState<PermissionRecord | null>(null);
  const [confirmDeletePermission, setConfirmDeletePermission] = useState<PermissionRecord | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewPermission) {
        setPreviewPermission(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewPermission]);

  const canReviewPermission = (p: PermissionRecord): boolean => {
    if (!onReview) return false;
    // Role INTI bersifat read-only untuk pengawasan dan tidak memiliki wewenang mengeksekusi izin
    if (currentUser.role === 'INTI' || currentUser.role === 'PENGURUS') return false;
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
            className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand min-h-[38px]"
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
                  ? 'bg-brand text-white shadow-2xs'
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
                      <span>{new Date(p.createdAt).toLocaleDateString('id-ID', { timeZone: 'Asia/Makassar' })}</span>
                    </div>
                    <div className="font-semibold text-slate-900">{p.activityName}</div>

                    <div className="pt-1 flex items-center gap-2">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                        {p.jenisIzin}
                      </span>
                      {p.evidenceUrl ? (
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewPermission(p);
                            setImgLoaded(false);
                            setImgError(false);
                            setZoom(false);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 transition-colors cursor-pointer shadow-2xs"
                          title="Lihat bukti izin"
                        >
                          <Eye className="w-3.5 h-3.5 text-brand-600" />
                          Bukti
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Tanpa Bukti</span>
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
                        className="min-h-[40px] py-2 px-3 rounded-lg bg-brand hover:bg-brand-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Setujui
                      </button>
                      <button
                        type="button"
                        onClick={() => onReview?.(p.id, 'REJECTED')}
                        className="min-h-[40px] py-2 px-3 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Tolak
                      </button>
                    </div>
                  ) : currentUser.role === 'SUPER_ADMIN' && (p.status === 'APPROVED' || p.status === 'REJECTED') ? (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => onReview?.(p.id, 'PENDING')}
                        className="w-full min-h-[38px] py-1.5 px-3 rounded-lg bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                        title="Batalkan status izin dan kembalikan ke Pending"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                        Batalkan Keputusan (Reset ke Pending)
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

                  {currentUser.role === 'SUPER_ADMIN' && onDelete && (
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setConfirmDeletePermission(p)}
                        className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus Data Izin
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop & Tablet Table Layout (Hidden on mobile) */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[720px]">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium">
                  <tr>
                    <th className="py-3 px-4 min-w-[180px]">Nama & Departemen</th>
                    <th className="py-3 px-4 min-w-[160px]">Kegiatan Proker</th>
                    <th className="py-3 px-4 min-w-[180px]">Jenis & Alasan</th>
                    <th className="py-3 px-4 whitespace-nowrap">Bukti</th>
                    <th className="py-3 px-4 whitespace-nowrap">Status</th>
                    {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') && (
                      <th className="py-3 px-4 text-right whitespace-nowrap">Tindakan</th>
                    )}
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
                            Diajukan {new Date(p.createdAt).toLocaleDateString('id-ID', { timeZone: 'Asia/Makassar' })}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 mb-1">
                            {p.jenisIzin}
                          </span>
                          <p className="text-slate-600 line-clamp-2 text-[11px] leading-relaxed">{p.alasan}</p>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {p.evidenceUrl ? (
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewPermission(p);
                                setImgLoaded(false);
                                setImgError(false);
                                setZoom(false);
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 transition-colors cursor-pointer shadow-2xs"
                              title="Lihat bukti izin"
                            >
                              <Eye className="w-3.5 h-3.5 text-brand-600" />
                              Bukti
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Tidak ada</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {p.status === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-medium whitespace-nowrap bg-amber-50 text-amber-700 border border-amber-200/60">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          )}
                          {p.status === 'APPROVED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-medium whitespace-nowrap bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              <Check className="w-3 h-3" />
                              Disetujui
                            </span>
                          )}
                          {p.status === 'REJECTED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-medium whitespace-nowrap bg-rose-50 text-rose-700 border border-rose-200/60">
                              <X className="w-3 h-3" />
                              Ditolak
                            </span>
                          )}
                        </td>
                        {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') && (
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              {eligible ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => onReview?.(p.id, 'APPROVED')}
                                    className="px-2.5 py-1 rounded-md bg-brand hover:bg-brand-700 text-white font-semibold text-[11px] flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                                  >
                                    <Check className="w-3 h-3" />
                                    Setujui
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onReview?.(p.id, 'REJECTED')}
                                    className="px-2.5 py-1 rounded-md bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-200 font-medium text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                    Tolak
                                  </button>
                                </>
                              ) : currentUser.role === 'SUPER_ADMIN' && (p.status === 'APPROVED' || p.status === 'REJECTED') ? (
                                <button
                                  type="button"
                                  onClick={() => onReview?.(p.id, 'PENDING')}
                                  className="px-2.5 py-1 rounded-md bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-800 border border-slate-200 hover:border-amber-300 font-medium text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                  title="Batalkan status izin dan kembalikan ke Pending"
                                >
                                  <RotateCcw className="w-3 h-3 text-amber-600" />
                                  Batalkan
                                </button>
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

                              {currentUser.role === 'SUPER_ADMIN' && onDelete && (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeletePermission(p)}
                                  className="p-1 rounded-md bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-300 transition-colors cursor-pointer shadow-2xs"
                                  title="Hapus data izin"
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
        </>
      )}

      {/* Interactive Evidence Preview Modal */}
      {previewPermission && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/75 backdrop-blur-xs p-3 sm:p-6"
          onClick={() => setPreviewPermission(null)}
        >
          <div
            className="bg-white w-full max-w-2xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Bukti Lampiran Izin
                </h3>
                <p className="text-[11px] text-slate-500">
                  {previewPermission.userName} • {previewPermission.activityName} ({previewPermission.jenisIzin})
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <a
                  href={getEvidenceViewUrl(previewPermission.evidenceUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors flex items-center gap-1 text-xs"
                  title="Buka berkas di tab baru"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline text-[11px] font-medium">Buka Tab Baru</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewPermission(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
                  title="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Image Display Area */}
            <div className="relative flex-1 overflow-auto bg-brand/5 p-4 flex items-center justify-center min-h-[280px] max-h-[65vh]">
              {!imgLoaded && !imgError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-50/50">
                  <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-slate-500">Memuat lampiran dari storage...</span>
                </div>
              )}

              {imgError ? (
                <div className="text-center p-6 space-y-2 max-w-sm">
                  <p className="text-xs font-semibold text-rose-700">Berkas tidak dapat ditampilkan sebagai gambar</p>
                  <p className="text-[11px] text-slate-500">
                    Format berkas mungkin berupa dokumen atau link dapat diakses langsung.
                  </p>
                  <a
                    href={getEvidenceViewUrl(previewPermission.evidenceUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand rounded-lg hover:bg-brand-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Buka Berkas
                  </a>
                </div>
              ) : (
                <img
                  src={getEvidenceViewUrl(previewPermission.evidenceUrl)}
                  alt={`Bukti izin ${previewPermission.userName}`}
                  className={`max-h-[60vh] max-w-full object-contain rounded-lg transition-transform duration-200 ${
                    zoom ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
                  } ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setImgLoaded(true)}
                  onError={() => {
                    setImgLoaded(true);
                    setImgError(true);
                  }}
                  onClick={() => setZoom(!zoom)}
                />
              )}
            </div>

            {/* Modal Footer / Details */}
            <div className="px-5 py-3 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="text-slate-500 text-[11px]">
                  <span className="font-semibold text-slate-700">Alasan: </span>
                  {previewPermission.alasan}
                </div>
                <div className="text-[10px] text-slate-400">
                  Klik gambar untuk memperbesar (zoom)
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end">
                {canReviewPermission(previewPermission) && (
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        await onReview?.(previewPermission.id, 'APPROVED');
                        setPreviewPermission(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-700 text-white font-semibold text-xs flex items-center gap-1 transition-colors shadow-2xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Setujui
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await onReview?.(previewPermission.id, 'REJECTED');
                        setPreviewPermission(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-200 font-medium text-xs flex items-center gap-1 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Tolak
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewPermission(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Popup Modal for Delete */}
      <ConfirmModal
        isOpen={Boolean(confirmDeletePermission)}
        onClose={() => setConfirmDeletePermission(null)}
        onConfirm={() => {
          if (confirmDeletePermission && onDelete) {
            onDelete(confirmDeletePermission.id);
            setConfirmDeletePermission(null);
          }
        }}
        title="Hapus Data Perizinan"
        message={`Apakah Anda yakin ingin menghapus data perizinan dari ${confirmDeletePermission?.userName || 'anggota ini'} untuk kegiatan "${confirmDeletePermission?.activityName || ''}"? Presensi terkait jika sebelumnya disetujui juga akan dibersihkan.`}
        confirmLabel="Ya, Hapus Izin"
        cancelLabel="Batal"
        isDanger={true}
      />
    </div>
  );
};
