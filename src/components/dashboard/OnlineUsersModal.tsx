import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  RefreshCw,
  Search,
  Monitor,
  Smartphone,
  Clock,
  Globe,
} from 'lucide-react';
import type { OnlineUserItem } from '../../types/index.ts';

interface OnlineUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onlineUsers: OnlineUserItem[];
  onlineCount: number;
  activeSessionsCount: number;
  lastUpdated?: Date | null;
  onRefresh: () => Promise<void>;
  isLoading?: boolean;
}

export const OnlineUsersModal: React.FC<OnlineUsersModalProps> = ({
  isOpen,
  onClose,
  onlineUsers,
  onlineCount,
  activeSessionsCount,
  lastUpdated,
  onRefresh,
  isLoading = false,
}) => {
  const [search, setSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return onlineUsers;

    return onlineUsers.filter((u) => {
      return (
        u.namaLengkap.toLowerCase().includes(q) ||
        u.prn.toLowerCase().includes(q) ||
        (u.jabatan && u.jabatan.toLowerCase().includes(q)) ||
        (u.departmentName && u.departmentName.toLowerCase().includes(q)) ||
        (u.role && u.role.toLowerCase().includes(q))
      );
    });
  }, [onlineUsers, search]);

  if (!isOpen) return null;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
            Super Admin
          </span>
        );
      case 'INTI':
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300">
            BPH Inti
          </span>
        );
      case 'ADMIN':
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
            Admin PJ
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            Pengurus
          </span>
        );
    }
  };

  const formatRelativeTime = (dateInput: string | Date) => {
    const timeMs = new Date(dateInput).getTime();
    const diffSec = Math.max(0, Math.floor((Date.now() - timeMs) / 1000));
    if (diffSec < 45) return 'Baru saja';
    if (diffSec < 90) return '1 mnt lalu';
    const mins = Math.floor(diffSec / 60);
    if (mins < 60) return `${mins} mnt lalu`;
    const hours = Math.floor(mins / 60);
    return `${hours} jam lalu`;
  };

  const getDeviceIcon = (userAgent?: string | null) => {
    if (!userAgent) return <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    }
    return <Monitor className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  };

  const getDeviceLabel = (userAgent?: string | null) => {
    if (!userAgent) return 'Web';
    const ua = userAgent.toLowerCase();
    if (ua.includes('iphone')) return 'iPhone';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('macintosh') || ua.includes('mac os')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    return 'Web';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog (Clean & Minimalist, Centered on all devices) */}
      <div className="relative w-full max-w-lg bg-surface rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[88vh] z-10 animate-in zoom-in-95 duration-150">
        
        {/* Header Bersih */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-surface">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-semibold text-slate-900">
              Pengguna Online
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {onlineCount}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing || isLoading}
              title="Segarkan"
              aria-label="Segarkan"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Tutup"
              aria-label="Tutup"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Input Pencarian Ringkas */}
        <div className="p-3 sm:px-4 sm:py-2.5 border-b border-slate-200/80 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, PRN, atau jabatan..."
              className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-slate-100/70 border border-slate-200/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all text-slate-900 placeholder:text-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Daftar Pengguna Sederhana */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
          {filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              {search ? 'Pengguna tidak ditemukan' : 'Tidak ada pengguna online'}
            </div>
          ) : (
            filteredUsers.map((u) => {
              const primaryDevice = u.devices && u.devices.length > 0 ? u.devices[0] : null;
              return (
                <div
                  key={u.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors flex items-center justify-between gap-3"
                >
                  {/* Avatar & Identitas */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-bold text-xs overflow-hidden">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.namaLengkap}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          u.namaLengkap.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-surface"></span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm text-slate-900 truncate">
                          {u.namaLengkap}
                        </span>
                        {getRoleBadge(u.role)}
                        {u.sessionCount > 1 && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                            ({u.sessionCount} sesi)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        <span className="font-mono text-[11px] text-slate-700 font-medium">
                          {u.prn}
                        </span>
                        {u.jabatan ? ` • ${u.jabatan}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Status & Perangkat */}
                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>{formatRelativeTime(u.lastActiveAt)}</span>
                    </div>
                    <div className="flex items-center justify-end gap-1 text-[11px] text-slate-400 mt-0.5">
                      {getDeviceIcon(primaryDevice?.userAgent)}
                      <span>{getDeviceLabel(primaryDevice?.userAgent)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Minimalis */}
        <div className="px-4 sm:px-5 py-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-400 shrink-0 bg-surface">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>
              {lastUpdated
                ? lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                : 'Baru saja'}
            </span>
            <span>•</span>
            <span>{activeSessionsCount} sesi aktif</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};


