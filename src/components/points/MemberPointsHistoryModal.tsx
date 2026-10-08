import React, { useEffect, useState } from 'react';
import { X, Calendar, Award, RefreshCw, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import type { MemberPointsHistoryData, AttendanceStatus } from '../../types/index.ts';
import { api } from '../../services/api.ts';

interface MemberPointsHistoryModalProps {
  userId: string | null;
  userName?: string;
  userPrn?: string;
  isOpen: boolean;
  onClose: () => void;
}

// Caching Intl.DateTimeFormat agar tidak mengalokasi ulang modul Intl di setiap render item
const idDateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export const MemberPointsHistoryModal: React.FC<MemberPointsHistoryModalProps> = ({
  userId,
  userName,
  userPrn,
  isOpen,
  onClose,
}) => {
  const [data, setData] = useState<MemberPointsHistoryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Kunci scroll body saat modal terbuka untuk mencegah double-scrolling / background lag
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && userId) {
      loadHistory(userId);
    } else {
      setData(null);
      setError(null);
    }
  }, [isOpen, userId]);

  // Listener tombol Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const loadHistory = async (targetId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMemberPointsHistory(targetId);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat rincian poin anggota');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'HADIR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shrink-0">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> HADIR
          </span>
        );
      case 'TELAT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 shrink-0">
            <Clock className="w-3 h-3 text-amber-500" /> TELAT
          </span>
        );
      case 'IZIN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 shrink-0">
            IZIN
          </span>
        );
      case 'SAKIT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 shrink-0">
            SAKIT
          </span>
        );
      case 'ALPHA':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 shrink-0">
            <AlertCircle className="w-3 h-3 text-rose-500" /> ALPHA
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateVal: string | Date) => {
    try {
      const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
      return idDateFormatter.format(d);
    } catch {
      return '-';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      {/* Backdrop layer terpisah dengan akselerasi GPU agar tidak memicu repaint berulang saat scroll */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity transform-gpu"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative z-10 bg-surface w-full max-w-xl rounded-xl shadow-xl border border-slate-200/80 max-h-[88vh] flex flex-col overflow-hidden isolate transform-gpu animate-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-surface shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Riwayat Poin Anggota
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {userName || 'Anggota'} {userPrn ? `(${userPrn})` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 modal-scroll flex-1">
          {error && (
            <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-brand dark:text-accent" />
              <p className="text-xs font-medium">Memuat riwayat perolehan poin...</p>
            </div>
          ) : data ? (
            <div className="space-y-4">
              {/* Total Summary Card */}
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500">
                    Akumulasi Poin Aktif
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">
                    {data.totalPoints} <span className="text-xs font-semibold text-slate-500">Poin</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-slate-500">Total Kegiatan</span>
                  <div className="text-sm font-bold text-slate-800">
                    {data.history.length} Presensi
                  </div>
                </div>
              </div>

              {/* List Riwayat Transaksi */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Riwayat Per Kegiatan
                </h3>

                {data.history.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    Belum ada riwayat pencatatan kehadiran untuk anggota ini.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-surface">
                    {data.history.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors [content-visibility:auto] [contain-intrinsic-size:auto_54px]"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {item.activityName}
                            </span>
                            {getStatusBadge(item.status)}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {formatDate(item.activityDate)}
                            </span>
                          </div>
                        </div>

                        {/* Awarded Points Badge */}
                        <div className="shrink-0 text-right">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                              item.awardedPoints > 0
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                : item.awardedPoints < 0
                                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {item.awardedPoints > 0 ? `+${item.awardedPoints}` : item.awardedPoints} Pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer min-h-[38px]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};


