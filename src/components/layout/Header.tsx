import {
  Menu,
  User,
  RefreshCw,
} from 'lucide-react';
import type { AuthUser } from '../../types/index.ts';

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
  const getRoleBadge = () => {
    switch (user.role) {
      case 'SUPER_ADMIN':
        return { label: 'Kepala Departemen', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'ADMIN':
        return { label: 'Staf PSDM', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      default:
        return { label: 'Pengurus', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const badge = getRoleBadge();

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
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${badge.color}`}>
            {badge.label}
          </span>
        </div>

        {/* Desktop View Left (>= 1024px) */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
        </div>

        {/* Actions Right */}
        <div className="flex items-center gap-2 ml-auto">
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
              className="lg:hidden p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
              title="Profil"
            >
              <User className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
