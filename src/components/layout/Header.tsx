import React from 'react';
import {
  Menu,
  HelpCircle,
  Activity,
  User,
  ShieldCheck,
  Building2,
  UserCheck,
} from 'lucide-react';
import type { AuthUser } from '../../types/index.ts';

interface HeaderProps {
  user: AuthUser;
  onLogout: () => void;
  onSwitchUser: (prn: string) => void;
  onOpenAudit?: () => void;
  onOpenProfile?: () => void;
  onOpenHelp?: () => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onSwitchUser,
  onOpenAudit,
  onOpenProfile,
  onOpenHelp,
  onToggleSidebar,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 h-14">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Mobile View: Hamburger Button & Minimal App Title */}
        <div className="flex items-center gap-2.5 md:hidden">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-2 -ml-1 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Buka menu navigasi sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <span className="font-bold text-slate-900 text-sm">Portal PSDM</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
            {user.role === 'SUPER_ADMIN' ? 'Kadep' : user.role === 'ADMIN' ? 'Staf PJ' : 'Pengurus'}
          </span>
        </div>

        {/* Desktop View Left: Breadcrumb / Section Context (NO duplicate logo) */}
        <div className="hidden md:flex items-center gap-2.5 text-xs">
          <span className="font-semibold text-slate-800">Sistem Manajemen PSDM</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-500">
            {user.role === 'SUPER_ADMIN'
              ? 'Panel Eksekutif & Kalender Proker'
              : user.role === 'ADMIN'
              ? 'Wilayah Pembinaan & Validasi'
              : 'Agenda & Presensi Pengurus'}
          </span>
          <span className="ml-2 text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
            2026/2027
          </span>
        </div>

        {/* Desktop View Right: Minimal Quick Controls (NO duplicate user profile) */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Quick Role Simulation Switcher (Compact & Subtle) */}
          <div className="flex items-center bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/60 text-xs">
            <span className="text-[10px] font-medium text-slate-400 px-2 hidden sm:inline">
              Simulasi:
            </span>
            <button
              type="button"
              onClick={() => onSwitchUser('PSDM-001')}
              title="Peran: Kepala Departemen (Super Admin)"
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                user.role === 'SUPER_ADMIN'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kadep
            </button>
            <button
              type="button"
              onClick={() => onSwitchUser('PSDM-002')}
              title="Peran: Staf PSDM (PJ Departemen)"
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                user.role === 'ADMIN'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Staf PJ
            </button>
            <button
              type="button"
              onClick={() => onSwitchUser('RISTEK-001')}
              title="Peran: Anggota Pengurus"
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                user.prn === 'RISTEK-001'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pengurus
            </button>
          </div>

          {/* Quick Workflow Guide Trigger */}
          {onOpenHelp && (
            <button
              type="button"
              onClick={onOpenHelp}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Panduan alur presensi, izin, dan hak akses peran"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Panduan</span>
            </button>
          )}

          {/* Quiet System Diagnostics Button */}
          {onOpenAudit && (
            <button
              type="button"
              onClick={onOpenAudit}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Diagnostik sistem & integritas"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="hidden sm:inline">Diagnostik</span>
            </button>
          )}

          {/* Mobile Profile Trigger */}
          {onOpenProfile && (
            <button
              type="button"
              onClick={onOpenProfile}
              className="md:hidden p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
              title="Edit Profil"
            >
              <User className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
