import React, { useState, useEffect } from 'react';
import type {
  AuthUser,
  ActivityItem,
  AttendanceRecord,
  PermissionRecord,
  PermissionStatus,
  FakultasItem,
  ProgramStudiItem,
  DepartmentItem,
  PjMappingItem,
} from './types/index.ts';
import { api } from './services/api.ts';
import { Header } from './components/layout/Header.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { LoginForm } from './components/auth/LoginForm.tsx';
import { SuperAdminView } from './components/dashboard/SuperAdminView.tsx';
import { AdminView } from './components/dashboard/AdminView.tsx';
import { PengurusView } from './components/dashboard/PengurusView.tsx';
import { CreateActivityModal } from './components/activities/CreateActivityModal.tsx';
import { AttendanceScannerModal } from './components/attendances/AttendanceScannerModal.tsx';
import { PermissionFormModal } from './components/permissions/PermissionFormModal.tsx';
import { MasterDataModal } from './components/master/MasterDataModal.tsx';
import { MemberListModal } from './components/members/MemberListModal.tsx';
import { AuditModal } from './components/audit/AuditModal.tsx';
import { ProfileModal } from './components/profile/ProfileModal.tsx';
import { ActivityDetailModal } from './components/activities/ActivityDetailModal.tsx';
import { HelpWorkflowModal } from './components/help/HelpWorkflowModal.tsx';
import { ConfirmModal } from './components/ui/ConfirmModal.tsx';
import { ToastProvider, useToast } from './components/ui/Toast.tsx';
import { HelpCircle } from 'lucide-react';

function MainAppContent() {
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  // App Data
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [allUsers, setAllUsers] = useState<AuthUser[]>([]);

  // Master Data
  const [fakultas, setFakultas] = useState<FakultasItem[]>([]);
  const [prodi, setProdi] = useState<ProgramStudiItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [pjMappings, setPjMappings] = useState<PjMappingItem[]>([]);

  // Modal States
  const [showCreateActivity, setShowCreateActivity] = useState(false);
  const [showMasterData, setShowMasterData] = useState(false);
  const [showMemberList, setShowMemberList] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [selectedActivityDetail, setSelectedActivityDetail] = useState<ActivityItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [activeScannerActivity, setActiveScannerActivity] = useState<ActivityItem | null>(null);
  const [activePermissionActivity, setActivePermissionActivity] = useState<ActivityItem | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'activities' | 'permissions'>('dashboard');

  // Auto-login default user for quick preview test
  useEffect(() => {
    handleLogin('PSDM-001');
  }, []);

  const reloadData = async (user: AuthUser) => {
    const [acts, perms, atts, users, master] = await Promise.all([
      api.getActivities(user),
      api.getPermissions(user),
      api.getAttendances(user),
      api.getUsers(),
      api.getMasterData(),
    ]);

    setActivities(acts);
    setPermissions(perms);
    setAttendances(atts);
    setAllUsers(users);
    setFakultas(master.fakultas);
    setProdi(master.programStudi);
    setDepartments(master.departments);
    setPjMappings(master.pjMappings);
  };

  const handleLogin = async (prn: string, password?: string) => {
    setLoginError(null);
    const res = await api.login(prn, password);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      await reloadData(res.user);
    } else {
      setLoginError(res.message || 'Login gagal');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast('Anda telah keluar dari sistem.', 'info');
  };

  const handleSwitchUser = async (prn: string) => {
    const res = await api.login(prn);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      await reloadData(res.user);
      const roleName =
        res.user.role === 'SUPER_ADMIN'
          ? 'Kepala Departemen'
          : res.user.role === 'ADMIN'
          ? 'Staf PSDM (PJ Departemen)'
          : 'Anggota Pengurus';
      showToast(`Beralih ke peran: ${roleName} (${res.user.namaLengkap})`, 'info');
    }
  };

  // Activity Actions
  const handleCreateActivity = async (data: Omit<ActivityItem, 'id' | 'attendanceSummary'>) => {
    await api.createActivity(data);
    if (currentUser) await reloadData(currentUser);
    showToast('Program kerja berhasil dibuat!', 'success');
  };

  const handleTogglePublish = async (id: string, current: boolean) => {
    await api.updateActivity(id, { isPublished: !current });
    if (currentUser) await reloadData(currentUser);
    showToast(
      !current
        ? 'Kegiatan dipublikasikan ke kalender pengurus!'
        : 'Kegiatan dikembalikan ke status Draft.',
      'success'
    );
  };

  const handleDeleteActivity = async (id: string) => {
    setConfirmDeleteId(id);
  };

  const executeDeleteActivity = async () => {
    if (!confirmDeleteId) return;
    await api.deleteActivity(confirmDeleteId);
    setConfirmDeleteId(null);
    if (currentUser) await reloadData(currentUser);
    showToast('Kegiatan proker berhasil dihapus.', 'info');
  };

  // Permission Actions
  const handleRequestPermission = async (data: {
    activityId: string;
    jenisIzin: string;
    alasan: string;
    evidenceUrl?: string | null;
  }) => {
    if (!currentUser) return;
    await api.requestPermission(currentUser, data);
    await reloadData(currentUser);
    showToast('Permohonan izin berhasil dikirim! Menunggu validasi PJ.', 'success');
  };

  const handleReviewPermission = async (permissionId: string, status: PermissionStatus) => {
    if (!currentUser) return;
    const res = await api.reviewPermission(permissionId, status, currentUser);
    if (!res.success) {
      showToast(res.message || 'Gagal memproses permohonan', 'error');
    } else {
      showToast(
        status === 'APPROVED'
          ? 'Permohonan izin disetujui & absensi peserta diperbarui!'
          : 'Permohonan izin ditolak.',
        status === 'APPROVED' ? 'success' : 'info'
      );
    }
    await reloadData(currentUser);
  };

  // Master Data Actions
  const handleAssignPj = async (adminId: string, departmentId: string) => {
    await api.assignPjDepartment(adminId, departmentId);
    if (currentUser) await reloadData(currentUser);
    showToast('Penugasan PJ Departemen berhasil disimpan!', 'success');
  };

  const handleRemovePj = async (adminId: string, departmentId: string) => {
    await api.removePjDepartment(adminId, departmentId);
    if (currentUser) await reloadData(currentUser);
    showToast('Penugasan PJ Departemen telah dihapus.', 'info');
  };

  // Self Profile & Password Actions
  const handleUpdateProfile = async (updates: Partial<AuthUser>) => {
    if (!currentUser) return;
    const updated = await api.updateProfile(currentUser.id, updates);
    setCurrentUser(updated);
    await reloadData(updated);
    showToast('Profil Anda berhasil diperbarui!', 'success');
  };

  const handleChangePassword = async (oldPass: string, newPass: string) => {
    if (!currentUser) return { success: false, message: 'Sesi kedaluwarsa.' };
    const res = await api.changePassword(currentUser.id, oldPass, newPass);
    if (res.success) {
      showToast('Kata sandi Anda berhasil diubah!', 'success');
    }
    return res;
  };

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} error={loginError} />;
  }

  const roleLabel =
    currentUser.role === 'SUPER_ADMIN'
      ? 'Kepala Departemen (Super Admin)'
      : currentUser.role === 'ADMIN'
      ? 'Staf PSDM (PJ Departemen)'
      : 'Anggota Pengurus Organisasi';

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Professional Sidebar Navigation */}
      <Sidebar
        user={currentUser}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenCreateActivity={() => setShowCreateActivity(true)}
        onOpenMasterData={() => setShowMasterData(true)}
        onOpenMemberList={() => setShowMemberList(true)}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenHelp={() => setShowHelpModal(true)}
        onOpenAudit={() => setShowAuditModal(true)}
        onOpenPermissionForm={() => {
          setActivePermissionActivity(null);
          setShowPermissionModal(true);
        }}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
        activeSection={activeSection}
        onSelectSection={(sec) => {
          setActiveSection(sec as any);
          if (sec === 'activities') {
            document.getElementById('section-activities')?.scrollIntoView({ behavior: 'smooth' });
          } else if (sec === 'permissions') {
            document.getElementById('section-permissions')?.scrollIntoView({ behavior: 'smooth' });
          } else if (sec === 'dashboard') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        counts={{
          activitiesCount: activities.length,
          pendingPermissionsCount: permissions.filter((p) => p.status === 'PENDING').length,
        }}
      />

      {/* Main Content Area (Offset for Desktop Sidebar) */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <Header
          user={currentUser}
          onLogout={handleLogout}
          onSwitchUser={handleSwitchUser}
          onOpenAudit={() => setShowAuditModal(true)}
          onOpenProfile={() => setShowProfileModal(true)}
          onOpenHelp={() => setShowHelpModal(true)}
          onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {currentUser.role === 'SUPER_ADMIN' && (
            <SuperAdminView
              currentUser={currentUser}
              activities={activities}
              permissions={permissions}
              onOpenCreateActivity={() => setShowCreateActivity(true)}
              onOpenMasterData={() => setShowMasterData(true)}
              onOpenMemberList={() => setShowMemberList(true)}
              onOpenAttendance={(act) => setActiveScannerActivity(act)}
              onTogglePublish={handleTogglePublish}
              onDeleteActivity={handleDeleteActivity}
              onReviewPermission={handleReviewPermission}
              onOpenAudit={() => setShowAuditModal(true)}
              onOpenProfile={() => setShowProfileModal(true)}
              onViewDetail={(act) => setSelectedActivityDetail(act)}
            />
          )}

          {currentUser.role === 'ADMIN' && (
            <AdminView
              currentUser={currentUser}
              activities={activities}
              permissions={permissions}
              onOpenMemberList={() => setShowMemberList(true)}
              onOpenAttendance={(act) => setActiveScannerActivity(act)}
              onReviewPermission={handleReviewPermission}
              onOpenProfile={() => setShowProfileModal(true)}
              onViewDetail={(act) => setSelectedActivityDetail(act)}
            />
          )}

          {currentUser.role === 'PENGURUS' && (
            <PengurusView
              currentUser={currentUser}
              activities={activities}
              myPermissions={permissions}
              myAttendances={attendances}
              onOpenPermissionModal={(act) => {
                setActivePermissionActivity(act || null);
                setShowPermissionModal(true);
              }}
              onOpenProfile={() => setShowProfileModal(true)}
              onViewDetail={(act) => setSelectedActivityDetail(act)}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      {showCreateActivity && (
        <CreateActivityModal
          isOpen={showCreateActivity}
          onClose={() => setShowCreateActivity(false)}
          onSubmit={handleCreateActivity}
          creatorId={currentUser.id}
          creatorName={currentUser.namaLengkap}
        />
      )}

      {activeScannerActivity && (
        <AttendanceScannerModal
          isOpen={Boolean(activeScannerActivity)}
          onClose={() => setActiveScannerActivity(null)}
          activity={activeScannerActivity}
          currentAdmin={currentUser}
          onSuccess={() => {
            reloadData(currentUser);
            showToast('Presensi peserta berhasil diperbarui!', 'success');
          }}
        />
      )}

      {showPermissionModal && (
        <PermissionFormModal
          isOpen={showPermissionModal}
          onClose={() => {
            setShowPermissionModal(false);
            setActivePermissionActivity(null);
          }}
          activities={activities}
          defaultActivity={activePermissionActivity}
          currentUser={currentUser}
          onSubmit={handleRequestPermission}
        />
      )}

      {showMasterData && (
        <MasterDataModal
          isOpen={showMasterData}
          onClose={() => setShowMasterData(false)}
          fakultas={fakultas}
          programStudi={prodi}
          departments={departments}
          pjMappings={pjMappings}
          admins={allUsers.filter((u) => u.role === 'ADMIN')}
          onAddFakultas={async (nama) => {
            await api.addFakultas(nama);
            await reloadData(currentUser);
            showToast('Fakultas baru berhasil ditambahkan!', 'success');
          }}
          onAddProdi={async (fId, nama) => {
            await api.addProdi(fId, nama);
            await reloadData(currentUser);
            showToast('Program studi baru berhasil ditambahkan!', 'success');
          }}
          onAddDept={async (nama) => {
            await api.addDepartment(nama);
            await reloadData(currentUser);
            showToast('Departemen baru berhasil ditambahkan!', 'success');
          }}
          onAssignPj={handleAssignPj}
          onRemovePj={handleRemovePj}
        />
      )}

      {showMemberList && (
        <MemberListModal
          isOpen={showMemberList}
          onClose={() => setShowMemberList(false)}
          users={allUsers}
          currentUser={currentUser}
        />
      )}

      {showAuditModal && (
        <AuditModal
          isOpen={showAuditModal}
          onClose={() => setShowAuditModal(false)}
        />
      )}

      {showProfileModal && currentUser && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          currentUser={currentUser}
          onUpdateProfile={handleUpdateProfile}
          onChangePassword={handleChangePassword}
        />
      )}

      {/* Activity Detail Modal */}
      {selectedActivityDetail && (
        <ActivityDetailModal
          isOpen={Boolean(selectedActivityDetail)}
          onClose={() => setSelectedActivityDetail(null)}
          activity={selectedActivityDetail}
          userRole={currentUser.role}
          onOpenAttendance={(act) => {
            setSelectedActivityDetail(null);
            setActiveScannerActivity(act);
          }}
          onRequestPermission={(act) => {
            setSelectedActivityDetail(null);
            setActivePermissionActivity(act);
            setShowPermissionModal(true);
          }}
          onTogglePublish={handleTogglePublish}
          onDelete={handleDeleteActivity}
        />
      )}

      {/* Help & Workflow Guide Modal */}
      {showHelpModal && (
        <HelpWorkflowModal
          isOpen={showHelpModal}
          onClose={() => setShowHelpModal(false)}
          onSwitchUser={handleSwitchUser}
        />
      )}

      {/* Friendly Confirmation Modal for Delete */}
      <ConfirmModal
        isOpen={Boolean(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={executeDeleteActivity}
        title="Hapus Kegiatan Program Kerja"
        message="Apakah Anda yakin ingin menghapus kegiatan ini? Seluruh data presensi dan riwayat izin terkait kegiatan ini akan ikut dihapus."
        confirmLabel="Ya, Hapus Kegiatan"
        cancelLabel="Batal"
        isDanger={true}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainAppContent />
    </ToastProvider>
  );
}
