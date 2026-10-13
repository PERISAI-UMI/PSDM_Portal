import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  Search,
  Calendar,
  Clock,
  MapPin,
  Globe,
  Lock,
  Users,
  Send,
  AlertCircle,
  CheckCircle2,
  Settings,
  ArrowRight,
  Filter,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import type { ActivityItem, AuthUser, WaBotConnectionStatus } from '../../types/index.ts';
import { formatWitaDate, formatWitaTime } from '../../utils/date.ts';
import { api } from '../../services/api.ts';

interface BroadcastViewProps {
  currentUser: AuthUser;
  activities: ActivityItem[];
  onOpenBroadcastModal: (activity: ActivityItem) => void;
  onNavigateToSettings?: () => void;
  onBackToDashboard?: () => void;
}

export const BroadcastView: React.FC<BroadcastViewProps> = ({
  currentUser,
  activities,
  onOpenBroadcastModal,
  onNavigateToSettings,
  onBackToDashboard,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'LOCKED'>('ALL');
  const [botStatus, setBotStatus] = useState<WaBotConnectionStatus>('NOT_CONFIGURED');
  const [isCheckingBot, setIsCheckingBot] = useState(false);

  // Cek status bot WhatsApp saat komponen dibuka
  const checkBot = async () => {
    setIsCheckingBot(true);
    try {
      const res = await api.getBotStatus();
      const rawStatus = ((res.status as unknown as string) || '').toUpperCase();
      const isReadyOrConnected = ['READY', 'CONNECTED', 'OPEN'].includes(rawStatus);
      setBotStatus(isReadyOrConnected ? 'CONNECTED' : res.status);
    } catch {
      setBotStatus('ERROR');
    } finally {
      setIsCheckingBot(false);
    }
  };

  useEffect(() => {
    checkBot();
  }, []);

  if (currentUser.role !== 'SUPER_ADMIN') {
    return (
      <div className="bg-surface rounded-xl border border-slate-200/80 p-12 text-center shadow-2xs">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Akses Terbatas</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Fitur Broadcast WhatsApp hanya dapat diakses secara eksklusif oleh Super Administrator.
        </p>
      </div>
    );
  }

  const filteredActivities = activities.filter((act) => {
    if (statusFilter === 'ACTIVE' && act.isLocked) return false;
    if (statusFilter === 'LOCKED' && !act.isLocked) return false;

    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      act.nama.toLowerCase().includes(q) ||
      (act.lokasi && act.lokasi.toLowerCase().includes(q)) ||
      (act.categoryName && act.categoryName.toLowerCase().includes(q))
    );
  });

  const totalActivities = activities.length;
  const lockedCount = activities.filter((a) => a.isLocked).length;
  const activeCount = activities.filter((a) => !a.isLocked).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200 shadow-2xs">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Pusat Broadcast WhatsApp
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Kirim pengumuman, pengingat, dan notifikasi kehadiran langsung ke kontak WhatsApp anggota.
              </p>
            </div>
          </div>
        </div>

        {/* Bot Status & Settings */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Status Badge */}
          <button
            type="button"
            onClick={checkBot}
            disabled={isCheckingBot}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold bg-surface hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Klik untuk memuat ulang status bot"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                botStatus === 'CONNECTED'
                  ? 'bg-emerald-500'
                  : botStatus === 'QR_READY' || botStatus === 'CONNECTING'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-slate-700">
              {isCheckingBot
                ? 'Memeriksa...'
                : botStatus === 'CONNECTED'
                ? 'Bot Terhubung'
                : botStatus === 'QR_READY'
                ? 'Scan QR Diperlukan'
                : botStatus === 'CONNECTING'
                ? 'Menghubungkan...'
                : 'Bot Belum Terhubung'}
            </span>
            <RefreshCw className={`w-3 h-3 text-slate-400 ${isCheckingBot ? 'animate-spin' : ''}`} />
          </button>

          {currentUser.role === 'SUPER_ADMIN' && onNavigateToSettings && (
            <button
              type="button"
              onClick={onNavigateToSettings}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Buka Pengaturan Bot WA"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>Pengaturan Bot</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-surface rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Kegiatan</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-1">
            {totalActivities}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Dapat dipilih untuk broadcast</p>
        </div>

        <div className="bg-surface rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Kegiatan Berlangsung</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 tabular-nums tracking-tight mt-1">
            {activeCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Presensi aktif & terbuka</p>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-surface rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Kegiatan Terkunci</span>
            <Lock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight mt-1">
            {lockedCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Siap rekap & broadcast evaluasi</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kegiatan untuk di-broadcast..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Semua ({activities.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
                statusFilter === 'ACTIVE'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Aktif ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('LOCKED')}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
                statusFilter === 'LOCKED'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Terkunci ({lockedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Activities Grid */}
      {filteredActivities.length === 0 ? (
        <div className="bg-surface rounded-xl border border-slate-200/80 p-12 text-center shadow-2xs">
          <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700">Tidak ada agenda kegiatan ditemukan</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {search ? 'Coba ubah kata kunci pencarian Anda.' : 'Belum ada agenda kegiatan yang terdaftar.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActivities.map((act) => {
            const summary = act.attendanceSummary || { HADIR: 0, IZIN: 0, SAKIT: 0, ALPHA: 0, TELAT: 0 };
            const formattedDate = formatWitaDate(act.startDate, {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
            const formattedTime = formatWitaTime(act.startDate);

            return (
              <div
                key={act.id}
                className="bg-surface rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Category & Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200/80 truncate">
                      {act.categoryName || 'Kegiatan'}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        act.isLocked
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {act.isLocked ? 'Terkunci' : 'Aktif'}
                    </span>
                  </div>

                  {/* Activity Name */}
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
                    {act.nama}
                  </h3>

                  {/* Metadata */}
                  <div className="mt-2 space-y-1 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{formattedDate} • {formattedTime} WITA</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {act.mode === 'ONLINE' ? (
                        <>
                          <Globe className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                          <span className="truncate">Online</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{act.lokasi || 'Offline'}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Summary Badges */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-center gap-1">
                    <div className="flex-1 min-w-0 bg-slate-50 rounded p-1">
                      <div className="text-[9px] text-slate-500 font-medium truncate">Hadir</div>
                      <div className="text-xs font-bold text-emerald-600">{(summary.HADIR || 0) + (summary.TELAT || 0)}</div>
                    </div>
                    <div className="flex-1 min-w-0 bg-slate-50 rounded p-1">
                      <div className="text-[9px] text-slate-500 font-medium truncate">Izin/Skt</div>
                      <div className="text-xs font-bold text-blue-600">{(summary.IZIN || 0) + (summary.SAKIT || 0)}</div>
                    </div>
                    <div className="flex-1 min-w-0 bg-slate-50 rounded p-1">
                      <div className="text-[9px] text-slate-500 font-medium truncate">Alpha</div>
                      <div className="text-xs font-bold text-rose-600">{summary.ALPHA || 0}</div>
                    </div>
                  </div>
                </div>

                {/* Primary Broadcast CTA */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onOpenBroadcastModal(act)}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer group-hover:bg-emerald-700"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Kelola Broadcast WA</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
