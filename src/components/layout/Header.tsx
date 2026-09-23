import {
  Menu,
  User,
  RefreshCw,
} from 'lucide-react';
import type { AuthUser } from '../../types/index.ts';
import { RealtimeClockWidget } from './RealtimeClockWidget.tsx';

interface HeaderProps {
  user: AuthUser;
  onLogout: () => void;
  onOpenProfile?: () => void;
  onToggleSidebar?: () => void;
  isLiveSyncing?: boolean;
  onManualSync?: () => void;
  lastSyncedAt?: Date | null;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenProfile,
  onToggleSidebar,
  isLiveSyncing = false,
  onManualSync,
  lastSyncedAt: _lastSyncedAt,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 h-14">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Mobile & Tablet View (< 1024px) */}
        <div className="flex items-center gap-2.5 lg:hidden">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-1.5 -ml-1 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <span className="font-bold text-slate-900 text-sm">Portal PSDM</span>
        </div>

        {/* Desktop View Left (>= 1024px) */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
        </div>

        {/* Actions Right */}
        <div className="flex items-center gap-2 sm:gap-2.5 ml-auto">
          {/* Realtime WITA Clock Widget */}
          <RealtimeClockWidget />

          {/* Real-time Live Status Badge */}
          <button
            type="button"
            onClick={onManualSync}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 transition-all cursor-pointer shadow-2xs group"
            title="Real-time aktif: Data disinkronkan otomatis tanpa perlu refresh. Klik untuk sinkronisasi instan."
          >
            <span className="relative flex h-2 w-2">
              {isLiveSyncing ? (
                <span className="animate-spin rounded-full h-2 w-2 border border-indigo-600 border-t-transparent" />
              ) : (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 duration-1000" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </>
              )}
            </span>
            <span className="hidden sm:inline font-mono text-[10px]">
              {isLiveSyncing ? 'Sinkronisasi...' : 'Live Real-time'}
            </span>
            <RefreshCw
              className={`w-3 h-3 text-slate-400 group-hover:text-slate-700 transition-transform duration-300 ${
                isLiveSyncing ? 'animate-spin text-indigo-600' : 'group-hover:rotate-180'
              }`}
            />
          </button>

          {/* Mobile Profile Trigger */}
          {onOpenProfile && (
            <button
              type="button"
              onClick={onOpenProfile}
              className="lg:hidden p-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer overflow-hidden flex items-center justify-center min-w-[34px] min-h-[34px]"
              title="Profil"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.namaLengkap} className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
