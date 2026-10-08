import React, { useEffect, useRef, useState } from 'react';
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

export const MemberPointsHistoryModal: React.FC<MemberPointsHistoryModalProps> = ({
  userId,
  userName,
  userPrn,
  isOpen,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [data, setData] = useState<MemberPointsHistoryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && userId) {
      if (!dialog.open) {
        dialog.showModal();
      }
      loadHistory(userId);
    } else {
      if (dialog.open) {
        dialog.close();
      }
      setData(null);
      setError(null);
    }
  }, [isOpen, userId]);

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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" /> HADIR
          </span>
        );
      case 'TELAT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
            <Clock className="w-3 h-3" /> TELAT
          </span>
        );
      case 'IZIN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
            IZIN
          </span>
        );
      case 'SAKIT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300">
            SAKIT
          </span>
        );
      case 'ALPHA':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
            <AlertCircle className="w-3 h-3" /> ALPHA
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateVal: string | Date) => {
    try {
      const d = new Date(dateVal);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-auto backdrop:bg-slate-900/60 backdrop:backdrop-blur-xs rounded-2xl p-0 shadow-2xl border border-slate-200 dark:border-slate-800 bg-surface text-slate-800 dark:text-slate-100 max-w-xl w-full max-h-[85vh] overflow-hidden"
    >
      <div className="flex flex-col h-full max-h-[85vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 dark:bg-accent/30 text-ink flex items-center justify-center font-bold">
              <Award className="w-5 h-5 text-amber-600 dark:text-accent" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Buku Besar Poin Kehadiran
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {userName || 'Anggota'} {userPrn ? `(${userPrn})` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 mb-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-brand" />
              <p className="text-xs">Memuat riwayat perolehan poin...</p>
            </div>
          ) : data ? (
            <div className="space-y-4">
              {/* Total Summary Card */}
              <div className="p-4 rounded-xl bg-brand/5 dark:bg-brand/10 border border-brand/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Akumulasi Poin Aktif
                  </span>
                  <div className="text-2xl font-black text-brand dark:text-accent mt-0.5">
                    {data.totalPoints} <span className="text-xs font-semibold text-slate-500">Poin</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Total Kegiatan</span>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {data.history.length} Event
                  </div>
                </div>
              </div>

              {/* List Riwayat Transaksi */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Riwayat Per Kegiatan
                </h3>

                {data.history.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    Belum ada riwayat pencatatan kehadiran untuk anggota ini.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900/40">
                    {data.history.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                              {item.activityName}
                            </span>
                            {getStatusBadge(item.status)}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(item.activityDate)}
                            </span>
                          </div>
                        </div>

                        {/* Awarded Points Badge */}
                        <div className="shrink-0 text-right">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black ${
                              item.awardedPoints > 0
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                : item.awardedPoints < 0
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
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
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </dialog>
  );
};
