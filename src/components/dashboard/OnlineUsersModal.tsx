import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Users,
  Activity,
  RefreshCw,
  Search,
  Monitor,
  Smartphone,
  Shield,
  ShieldCheck,
  Clock,
  Globe,
  CheckCircle2,
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
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'SUPER_ADMIN' | 'ADMIN' | 'INTI' | 'PENGURUS'>('ALL');
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
    return onlineUsers.filter((u) => {
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const q = search.toLowerCase().trim();
      if (!q) return matchesRole;

      const matchesQuery =
        u.namaLengkap.toLowerCase().includes(q) ||
        u.prn.toLowerCase().includes(q) ||
        (u.jabatan && u.jabatan.toLowerCase().includes(q)) ||
        (u.departmentName && u.departmentName.toLowerCase().includes(q));

      return matchesRole && matchesQuery;
    });
  }, [onlineUsers, search, roleFilter]);

  if (!isOpen) return null;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <ShieldCheck className="w-3 h-3 text-purple-600" />
            SUPER ADMIN
          </span>
        );
      case 'INTI':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Shield className="w-3 h-3 text-indigo-600" />
            BPH INTI
          </span>
        );
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Shield className="w-3 h-3 text-blue-600" />
            ADMIN PJ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            PENGURUS
          </span>
        );
    }
  };

  const formatRelativeTime = (dateInput: string | Date) => {
    const timeMs = new Date(dateInput).getTime();
    const diffSec = Math.max(0, Math.floor((Date.now() - timeMs) / 1000));
    if (diffSec < 45) return 'Baru saja';
    if (diffSec < 90) return '1 menit lalu';
    const mins = Math.floor(diffSec / 60);
    if (mins < 60) return `${mins} menit lalu`;
    const hours = Math.floor(mins / 60);
    return `${hours} jam lalu`;
  };

  const getDeviceIcon = (userAgent?: string | null) => {
    if (!userAgent) return <Globe className="w-3.5 h-3.5 text-slate-400" />;
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="w-3.5 h-3.5 text-slate-500" />;
    }
    return <Monitor className="w-3.5 h-3.5 text-slate-500" />;
  };

  const getDeviceLabel = (userAgent?: string | null) => {
    if (!userAgent) return 'Web Browser';
    const ua = userAgent.toLowerCase();
    if (ua.includes('iphone')) return 'iPhone (Safari/Web)';
    if (ua.includes('android')) return 'Android Mobile';
    if (ua.includes('windows')) return 'Windows Desktop';
    if (ua.includes('macintosh') || ua.includes('mac os')) return 'Mac Desktop';
    if (ua.includes('linux')) return 'Linux Desktop';
    return 'Perangkat Web';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Pemantauan Pengguna Aktif
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Pengguna yang sedang aktif mengakses Portal PSDM secara real-time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing || isLoading}
              title="Segarkan data aktif"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 shrink-0"></span>
              <span className="font-semibold text-slate-700">
                {onlineCount} Pengguna Online
              </span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="text-slate-500">
              <span className="font-semibold text-slate-700">{activeSessionsCount}</span> Sesi Aktif
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>
              Sinkronisasi: {lastUpdated ? lastUpdated.toLocaleTimeString('id-ID') : 'Baru saja'}
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-white shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan nama, PRN, jabatan, atau departemen..."
              className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-slate-900"
            />
          </div>

          {/* Role Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
            {(['ALL', 'SUPER_ADMIN', 'ADMIN', 'INTI', 'PENGURUS'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                  roleFilter === r
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r === 'ALL'
                  ? 'Semua'
                  : r === 'SUPER_ADMIN'
                  ? 'Super Admin'
                  : r === 'INTI'
                  ? 'BPH Inti'
                  : r === 'ADMIN'
                  ? 'Admin PJ'
                  : 'Pengurus'}
              </button>
            ))}
          </div>
        </div>

        {/* List Pengguna Aktif */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                {search || roleFilter !== 'ALL'
                  ? 'Tidak ada pengguna yang cocok dengan kriteria filter'
                  : 'Tidak ada pengguna aktif lain saat ini'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {search || roleFilter !== 'ALL'
                  ? 'Coba ganti kata kunci pencarian atau ubah filter role di atas.'
                  : 'Sistem memantau pengguna yang mengakses portal dalam 5 menit terakhir.'}
              </p>
            </div>
          ) : (
            filteredUsers.map((u) => {
              const primaryDevice = u.devices && u.devices.length > 0 ? u.devices[0] : null;
              return (
                <div
                  key={u.id}
                  className="bg-white rounded-xl border border-slate-200/90 p-3.5 hover:border-slate-300 hover:shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* User Profile Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs overflow-hidden">
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
                      {/* Pulsing online badge */}
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm truncate">
                          {u.namaLengkap}
                        </span>
                        {getRoleBadge(u.role)}
                      </div>

                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="font-mono text-[11px] text-slate-600 font-medium">
                          {u.prn}
                        </span>
                        <span>•</span>
                        <span className="truncate">
                          {u.jabatan || 'Pengurus'} ({u.departmentName || 'Departemen PSDM'})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Device & Activity Status */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 text-right">
                    <div className="text-left sm:text-right">
                      <div className="flex items-center sm:justify-end gap-1.5 text-xs font-medium text-slate-700">
                        {getDeviceIcon(primaryDevice?.userAgent)}
                        <span>{getDeviceLabel(primaryDevice?.userAgent)}</span>
                      </div>
                      <div className="text-[11px] text-emerald-600 font-medium flex items-center sm:justify-end gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Aktif {formatRelativeTime(u.lastActiveAt)}</span>
                      </div>
                    </div>

                    {u.sessionCount > 1 && (
                      <span
                        title={`${u.sessionCount} perangkat aktif secara bersamaan`}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0"
                      >
                        {u.sessionCount} Sesi
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            Menampilkan <strong className="text-slate-800">{filteredUsers.length}</strong> dari{' '}
            <strong className="text-slate-800">{onlineCount}</strong> pengguna online
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
