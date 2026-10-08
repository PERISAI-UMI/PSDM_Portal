import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  Database,
  User,
  Activity,
  LogOut,
  X,
  Plus,
  ShieldCheck,
  Building2,
  ChevronRight,
  UserCheck,
  BookOpen,
  GraduationCap,
  Clock,
  CheckCircle2,
  KeyRound,
  Trophy,
  Award,
  Layers,
  BookMarked,
} from 'lucide-react';
import type { AuthUser } from '../../types/index.ts';

interface SidebarProps {
  user: AuthUser;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenCreateActivity?: () => void;
  onOpenMasterData?: () => void;
  onOpenMemberList?: () => void;
  onOpenProfile?: () => void;
  onOpenAudit?: () => void;
  onOpenPermissionForm?: () => void;
  onLogout: () => void;
  activeSection?: string;
  onSelectSection?: (sectionId: string) => void;
  onOpenMasterDataTab?: (tab: 'dept' | 'fakultas' | 'prodi' | 'pj' | 'category' | 'points-log') => void;
  activeMasterDataTab?: 'dept' | 'fakultas' | 'prodi' | 'pj' | 'category' | 'points-log';
  onOpenProfileTab?: (tab: 'profile' | 'security') => void;
  activeProfileTab?: 'profile' | 'security';
  onOpenPermissionTab?: (tab: 'pending' | 'history') => void;
  activePermissionTab?: 'pending' | 'history';
  counts?: {
    activitiesCount: number;
    pendingPermissionsCount: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  isOpenMobile,
  onCloseMobile,
  onOpenCreateActivity,
  onOpenMasterData,
  onOpenMemberList,
  onOpenProfile,
  onOpenAudit,
  onOpenPermissionForm,
  onLogout,
  activeSection = 'dashboard',
  onSelectSection,
  onOpenMasterDataTab,
  activeMasterDataTab = 'dept',
  onOpenProfileTab,
  activeProfileTab = 'profile',
  onOpenPermissionTab,
  activePermissionTab = 'pending',
  counts = { activitiesCount: 0, pendingPermissionsCount: 0 },
}) => {
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleNavClick = (sectionId: string, action?: () => void) => {
    if (action) {
      action();
    } else if (onSelectSection) {
      onSelectSection(sectionId);
    }
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-surface text-slate-800 border-r border-slate-200 select-none">
      {/* Brand Header: perfectly aligned with h-14 Header */}
      <div className="h-14 px-4 border-b border-slate-200/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 p-1 flex items-center justify-center shadow-2xs shrink-0 transition-colors">
            <img
              src="/favicon.ico"
              alt="Logo"
              className="w-full h-full object-contain aspect-square select-none pointer-events-none"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-900 text-sm tracking-normal shrink-0 brand-text">Portal PSDM</span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate" title={user.departmentName || 'Departemen PSDM'}>
              {user.departmentName || 'Departemen PSDM'}
            </p>
          </div>
        </div>

        {/* Mobile / Tablet Close Button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Tutup menu sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        {/* Navigation Group 1: Menu Utama */}
        <div>
          <span className="px-2 text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
            Menu Utama
          </span>
          <nav className="space-y-0.5">
            <button
              type="button"
              onClick={() => handleNavClick('dashboard')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeSection === 'dashboard'
                  ? 'bg-slate-100 text-slate-900 font-semibold shadow-[inset_3px_0_0_var(--color-accent)]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-slate-500" />
                <span>Dasbor</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('activities')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeSection === 'activities'
                  ? 'bg-slate-100 text-slate-900 font-semibold shadow-[inset_3px_0_0_var(--color-accent)]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Kegiatan</span>
              </div>
              {counts.activitiesCount > 0 && (
                <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                  {counts.activitiesCount}
                </span>
              )}
            </button>

            {/* Perizinan dengan Sub-menu Dropdown */}
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  if (onOpenPermissionTab) {
                    onOpenPermissionTab(activePermissionTab || 'pending');
                  } else {
                    handleNavClick('permissions');
                  }
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeSection === 'permissions'
                    ? 'bg-slate-100 text-slate-900 font-semibold shadow-[inset_3px_0_0_var(--color-accent)]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>
                    {user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' ? 'Perizinan' : 'Verifikasi Izin'}
                  </span>
                </div>
                {counts.pendingPermissionsCount > 0 && (
                  <span className="text-[11px] font-semibold bg-accent text-ink px-1.5 py-0.2 rounded">
                    {counts.pendingPermissionsCount}
                  </span>
                )}
              </button>

              {/* Sub-menu Perizinan when active */}
              {activeSection === 'permissions' && (
                <div className="pl-5 pr-1 py-1 space-y-1 border-l-2 border-slate-200 ml-4">
                  <button
                    type="button"
                    onClick={() => onOpenPermissionTab?.('pending')}
                    className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] transition-colors flex items-center justify-between cursor-pointer ${
                      activePermissionTab === 'pending'
                        ? 'bg-brand text-white font-semibold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{user.role === 'PENGURUS' ? 'Izin Diproses' : 'Perlu Tindakan'}</span>
                    </div>
                    {counts.pendingPermissionsCount > 0 && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          activePermissionTab === 'pending'
                            ? 'bg-white/20 text-white'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {counts.pendingPermissionsCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenPermissionTab?.('history')}
                    className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] transition-colors flex items-center gap-2 cursor-pointer ${
                      activePermissionTab === 'history'
                        ? 'bg-brand text-white font-semibold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Riwayat & Arsip</span>
                  </button>
                </div>
              )}
            </div>

            {/* Klasemen & Poin: Hanya untuk SUPER_ADMIN, ADMIN, dan INTI (PENGURUS tidak memiliki akses) */}
            {user.role !== 'PENGURUS' && (
              <button
                type="button"
                onClick={() => handleNavClick('leaderboard')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeSection === 'leaderboard'
                    ? 'bg-slate-100 text-slate-900 font-semibold shadow-[inset_3px_0_0_var(--color-accent)]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Trophy className="w-4 h-4 text-slate-500" />
                <span>Klasemen & Poin</span>
              </button>
            )}

            {/* Member Directory: For all roles except PENGURUS */}
            {user.role !== 'PENGURUS' && (
              <button
                type="button"
                onClick={() => handleNavClick('members')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeSection === 'members'
                    ? 'bg-slate-100 text-slate-900 font-semibold shadow-[inset_3px_0_0_var(--color-accent)]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span>Anggota</span>
                </div>
              </button>
            )}

            {/* Master Data: SuperAdmin only */}
            {user.role === 'SUPER_ADMIN' && (
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenMasterDataTab) {
                      onOpenMasterDataTab(activeMasterDataTab || 'dept');
                    } else {
                      handleNavClick('master-data');
                    }
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeSection === 'master-data'
                      ? 'bg-slate-100 text-slate-900 font-semibold shadow-[inset_3px_0_0_var(--color-accent)]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Database className="w-4 h-4 text-slate-500" />
                    <span>Master Data</span>
                  </div>
                </button>

                {/* Sub-menu Master Data when active */}
                {activeSection === 'master-data' && (
                  <div className="pl-5 pr-1 py-1 space-y-1 border-l-2 border-slate-200 ml-4">
                    <button
                      type="button"
                      onClick={() => {
                        onOpenMasterDataTab?.('dept');
                        onCloseMobile();
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] transition-colors flex items-center gap-2 cursor-pointer ${
                        activeMasterDataTab === 'dept'
                          ? 'bg-brand text-white font-semibold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Departemen</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onOpenMasterDataTab?.('fakultas');
                        onCloseMobile();
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] transition-colors flex items-center gap-2 cursor-pointer ${
                        activeMasterDataTab === 'fakultas'
                          ? 'bg-brand text-white font-semibold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Fakultas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onOpenMasterDataTab?.('prodi');
                        onCloseMobile();
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] transition-colors flex items-center gap-2 cursor-pointer ${
                        activeMasterDataTab === 'prodi'
                          ? 'bg-brand text-white font-semibold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Jurusan / Prodi</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onOpenMasterDataTab?.('pj');
                        onCloseMobile();
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] transition-colors flex items-center gap-2 cursor-pointer ${
                        activeMasterDataTab === 'pj'
                          ? 'bg-brand text-white font-semibold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Penugasan PJ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onOpenMasterDataTab?.('category');
                        onCloseMobile();
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] transition-colors flex items-center gap-2 cursor-pointer ${
                        activeMasterDataTab === 'category'
                          ? 'bg-brand text-white font-semibold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Kategori Kegiatan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onOpenMasterDataTab?.('points-log');
                        onCloseMobile();
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] transition-colors flex items-center gap-2 cursor-pointer ${
                        activeMasterDataTab === 'points-log'
                          ? 'bg-brand text-white font-semibold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <BookMarked className="w-3.5 h-3.5" />
                      <span>Buku Besar Poin</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* Navigation Group 2: Pengaturan & Sistem */}
        <div>
          <span className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Pengaturan
          </span>
          <nav className="space-y-0.5">
            {onOpenProfile && (
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenProfileTab) {
                      onOpenProfileTab(activeProfileTab || 'profile');
                    } else {
                      handleNavClick('profile', onOpenProfile);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeSection === 'profile'
                      ? 'bg-slate-100 text-slate-900 font-semibold shadow-[inset_3px_0_0_var(--color-accent)]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-slate-500" />
                    <span>Profil & Akun</span>
                  </div>
                </button>

                {/* Sub-menu Profil when active */}
                {activeSection === 'profile' && (
                  <div className="pl-5 pr-1 py-1 space-y-1 border-l-2 border-slate-200 ml-4">
                    <button
                      type="button"
                      onClick={() => onOpenProfileTab?.('profile')}
                      className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] transition-colors flex items-center gap-2 cursor-pointer ${
                        activeProfileTab === 'profile'
                          ? 'bg-brand text-white font-semibold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Biodata Diri</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenProfileTab?.('security')}
                      className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] transition-colors flex items-center gap-2 cursor-pointer ${
                        activeProfileTab === 'security'
                          ? 'bg-brand text-white font-semibold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Keamanan & Sandi</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {onOpenAudit && user.role === 'SUPER_ADMIN' && (
              <button
                type="button"
                onClick={() => handleNavClick('audit', onOpenAudit)}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-slate-500" />
                  <span>Diagnostik</span>
                </div>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              </button>
            )}
          </nav>
        </div>

      </div>

      {/* Single Source of Truth: User Profile Card & Logout */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => handleNavClick('profile', onOpenProfile)}
            title="Kelola profil & ubah kata sandi Anda"
            className="flex items-center gap-2.5 min-w-0 text-left hover:bg-slate-100/80 p-1 rounded-lg transition-colors flex-1"
          >
            <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.namaLengkap} className="w-full h-full object-cover" />
              ) : (
                getInitials(user.namaLengkap)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-900 truncate">
                {user.namaLengkap}
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {user.prn} • {user.departmentName || 'PSDM'}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={onLogout}
            title="Keluar dari sistem"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (>= 1024px) */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30 shadow-xs">
        {sidebarContent}
      </aside>

      {/* Mobile & Tablet Drawer Backdrop & Sidebar (< 1024px) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Off-canvas Panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-surface shadow-xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
