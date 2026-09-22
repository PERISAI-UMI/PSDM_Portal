import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { api, getStoredUser } from './services/api.ts';
import { broadcastRealtimeEvent, subscribeRealtimeEvents } from './utils/realtime.ts';
import { Header } from './components/layout/Header.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { LoginForm } from './components/auth/LoginForm.tsx';
import { SuperAdminView } from './components/dashboard/SuperAdminView.tsx';
import { AdminView } from './components/dashboard/AdminView.tsx';
import { PengurusView } from './components/dashboard/PengurusView.tsx';
import { ActivitiesView } from './components/activities/ActivitiesView.tsx';
import { PermissionsView } from './components/permissions/PermissionsView.tsx';
import { MembersView } from './components/members/MembersView.tsx';
import { CreateActivityModal } from './components/activities/CreateActivityModal.tsx';
import { AttendanceScannerModal } from './components/attendances/AttendanceScannerModal.tsx';
import { PermissionFormModal } from './components/permissions/PermissionFormModal.tsx';
import { MasterDataView, type MasterDataTab } from './components/master/MasterDataView.tsx';
import { AuditModal } from './components/audit/AuditModal.tsx';
import { ProfileModal } from './components/profile/ProfileModal.tsx';
import { ProfileView } from './components/profile/ProfileView.tsx';
import { ActivityDetailModal } from './components/activities/ActivityDetailModal.tsx';
import { ConfirmModal } from './components/ui/ConfirmModal.tsx';
import { ToastProvider, useToast } from './components/ui/Toast.tsx';

type ActiveSection = 'dashboard' | 'activities' | 'permissions' | 'members' | 'master-data' | 'profile';

function MainAppContent() {
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getStoredUser());
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
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
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedActivityDetail, setSelectedActivityDetail] = useState<ActivityItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [activeScannerActivity, setActiveScannerActivity] = useState<ActivityItem | null>(null);
  const [activePermissionActivity, setActivePermissionActivity] = useState<ActivityItem | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const [masterDataTab, setMasterDataTab] = useState<MasterDataTab>('dept');

  // Real-time Live Sync States
  const [isLiveSyncing, setIsLiveSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const syncHashRef = useRef<string>('');
  const isSyncingRef = useRef<boolean>(false);

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

    // Hydrate currentUser departmentName & programStudiName if missing
    const dept = master.departments.find((d) => d.id === user.departmentId);
    const prodiItem = master.programStudi.find((p) => p.id === user.programStudiId);
    if (dept || prodiItem) {
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              departmentName: dept?.nama || prev.departmentName,
              programStudiName: prodiItem?.nama || prev.programStudiName,
            }
          : prev
      );
    }
  };

  // Real-time live synchronization callback (ringan, ~70 byte jika tidak ada perubahan)
  const syncRealtime = useCallback(
    async (force = false) => {
      if (!currentUser || isSyncingRef.current) return;
      isSyncingRef.current = true;
      setIsLiveSyncing(true);

      try {
        const res = await api.getLiveSync(force ? undefined : syncHashRef.current);
        if (res.success) {
          syncHashRef.current = res.hash;
          if (res.changed && res.data) {
            setActivities(res.data.activities);
            setPermissions(res.data.permissions);
            setAttendances(res.data.attendances);
          }
          setLastSyncedAt(new Date());
        }
      } catch (err) {
        console.debug('Real-time sync skipped:', err);
      } finally {
        isSyncingRef.current = false;
        setIsLiveSyncing(false);
      }
    },
    [currentUser]
  );

  // Engine Real-Time Adaptive Sync (Polling adaptif + tab visibility + cross-tab broadcast)
  useEffect(() => {
    if (!currentUser) return;

    // 1. Initial live sync
    syncRealtime(true);

    // 2. Interval adaptif hemat kuota: 15 detik saat tab aktif, 45 detik saat tab di background
    let timer: ReturnType<typeof setTimeout>;

    const scheduleNextSync = () => {
      const isHidden = typeof document !== 'undefined' && document.hidden;
      const delay = isHidden ? 45000 : 15000;
      timer = setTimeout(async () => {
        await syncRealtime(false);
        scheduleNextSync();
      }, delay);
    };

    scheduleNextSync();

    // 3. Sinkronisasi instan seketika saat user kembali ke tab browser
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        syncRealtime(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 4. Sinkronisasi instan saat window/layar difokuskan
    const handleFocus = () => {
      syncRealtime(true);
    };
    window.addEventListener('focus', handleFocus);

    // 5. Sinkronisasi saat koneksi internet kembali online
    const handleOnline = () => {
      syncRealtime(true);
    };
    window.addEventListener('online', handleOnline);

    // 6. Listener event lintas tab (BroadcastChannel)
    const unsubscribeCrossTab = subscribeRealtimeEvents((_event) => {
      syncRealtime(true);
    });

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      unsubscribeCrossTab();
    };
  }, [currentUser, syncRealtime]);

  useEffect(() => {
    let isMounted = true;

    async function checkAuthSession() {
      try {
        const res = await api.getMe();
        if (!isMounted) return;

        if (res.success && res.user) {
          setCurrentUser(res.user);
          await reloadData(res.user);
        } else {
          setCurrentUser(null);
          await api.logout();
        }
      } catch {
        if (!isMounted) return;
        const cached = getStoredUser();
        if (cached) {
          try {
            await reloadData(cached);
          } catch {
            // Keep cached user offline
          }
        } else {
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    }

    checkAuthSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async (prn: string, password?: string) => {
    setLoginError(null);
    const res = await api.login(prn, password);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      await reloadData(res.user);
    } else {
      setLoginError(res.message || 'PRN atau kata sandi tidak sesuai');
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    showToast('Anda telah keluar dari sistem.', 'info');
  };

  // Activity Actions
  const handleCreateActivity = async (data: Omit<ActivityItem, 'id' | 'attendanceSummary'>) => {
    await api.createActivity(data);
    broadcastRealtimeEvent('ACTIVITY_CHANGED');
    if (currentUser) await reloadData(currentUser);
    showToast('Program kerja berhasil dibuat!', 'success');
  };

  const handleTogglePublish = async (id: string, current: boolean) => {
    await api.updateActivity(id, { isPublished: !current });
    broadcastRealtimeEvent('ACTIVITY_CHANGED');
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
    broadcastRealtimeEvent('ACTIVITY_CHANGED');
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
    broadcastRealtimeEvent('PERMISSION_CHANGED');
    await reloadData(currentUser);
    showToast('Permohonan izin berhasil dikirim! Menunggu validasi PJ.', 'success');
  };

  const handleReviewPermission = async (permissionId: string, status: PermissionStatus) => {
    if (!currentUser) return;
    const res = await api.reviewPermission(permissionId, status, currentUser);
    if (!res.success) {
      showToast(res.message || 'Gagal memproses permohonan', 'error');
    } else {
      broadcastRealtimeEvent('PERMISSION_CHANGED');
      broadcastRealtimeEvent('ATTENDANCE_CHANGED');
      showToast(
        status === 'APPROVED'
          ? 'Permohonan izin disetujui & absensi peserta diperbarui!'
          : status === 'PENDING'
          ? 'Status izin berhasil dibatalkan dan dikembalikan ke Pending!'
          : 'Permohonan izin ditolak.',
        status === 'APPROVED' ? 'success' : 'info'
      );
    }
    await reloadData(currentUser);
  };

  const handleDeletePermission = async (id: string) => {
    if (!currentUser) return;
    const res = await api.deletePermission(id);
    if (!res.success) {
      showToast(res.message || 'Gagal menghapus permohonan izin', 'error');
    } else {
      broadcastRealtimeEvent('PERMISSION_CHANGED');
      broadcastRealtimeEvent('ATTENDANCE_CHANGED');
      showToast('Data izin berhasil dihapus.', 'info');
    }
    await reloadData(currentUser);
  };

  // Master Data Actions
  const handleAssignPj = async (adminId: string, departmentId: string) => {
    await api.assignPjDepartment(adminId, departmentId);
    broadcastRealtimeEvent('MASTER_DATA_CHANGED');
    if (currentUser) await reloadData(currentUser);
    showToast('Penugasan PJ Departemen berhasil disimpan!', 'success');
  };

  const handleRemovePj = async (adminId: string, departmentId: string) => {
    await api.removePjDepartment(adminId, departmentId);
    broadcastRealtimeEvent('MASTER_DATA_CHANGED');
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

  if (isCheckingAuth && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white p-2.5 flex items-center justify-center shadow-lg animate-pulse">
            <img
              src="/favicon.ico"
              alt="Logo Portal PSDM"
              className="w-full h-full object-contain aspect-square select-none pointer-events-none"
            />
          </div>
          <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Memulihkan sesi portal...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} error={loginError} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Professional Sidebar Navigation */}
      <Sidebar
        user={currentUser}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenCreateActivity={() => setShowCreateActivity(true)}
        onOpenMasterData={() => {
          setActiveSection('master-data');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenMemberList={currentUser.role !== 'PENGURUS' ? () => {
          setActiveSection('members');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } : undefined}
        onOpenProfile={() => {
          setActiveSection('profile');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAudit={() => setShowAuditModal(true)}
        onOpenPermissionForm={() => {
          setActivePermissionActivity(null);
          setShowPermissionModal(true);
        }}
        onLogout={handleLogout}
        activeSection={activeSection}
        activeMasterDataTab={masterDataTab}
        onOpenMasterDataTab={(tab) => {
          setMasterDataTab(tab);
          setActiveSection('master-data');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectSection={(sec) => {
          if (currentUser.role === 'PENGURUS' && sec === 'members') {
            return;
          }
          if (currentUser.role !== 'SUPER_ADMIN' && sec === 'master-data') {
            return;
          }
          setActiveSection(sec as ActiveSection);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        counts={{
          activitiesCount: activities.length,
          pendingPermissionsCount: permissions.filter((p) => p.status === 'PENDING').length,
        }}
      />

      {/* Main Content Area (Offset for Desktop Sidebar >= 1024px) */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <Header
          user={currentUser}
          onLogout={handleLogout}
          onOpenProfile={() => {
            setActiveSection('profile');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          isLiveSyncing={isLiveSyncing}
          onManualSync={() => syncRealtime(true)}
          lastSyncedAt={lastSyncedAt}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-x-hidden">
          {/* 0. Profile Layout (Full-page layout for all roles) */}
          {activeSection === 'profile' && (
            <ProfileView
              currentUser={currentUser}
              onUpdateProfile={handleUpdateProfile}
              onChangePassword={handleChangePassword}
              onBackToDashboard={() => setActiveSection('dashboard')}
            />
          )}

          {/* 1. Activities Layout */}
          {activeSection === 'activities' && (
            <ActivitiesView
              currentUser={currentUser}
              activities={activities}
              onOpenCreateActivity={() => setShowCreateActivity(true)}
              onOpenAttendance={(act) => setActiveScannerActivity(act)}
              onTogglePublish={handleTogglePublish}
              onDeleteActivity={handleDeleteActivity}
              onViewDetail={(act) => setSelectedActivityDetail(act)}
              onRequestPermission={(act) => {
                setActivePermissionActivity(act);
                setShowPermissionModal(true);
              }}
              allUsers={allUsers}
              onAttendanceImportSuccess={() => syncRealtime(true)}
            />
          )}

          {/* 2. Permissions Layout */}
          {activeSection === 'permissions' && (
            <PermissionsView
              currentUser={currentUser}
              permissions={permissions}
              activities={activities}
              onReviewPermission={handleReviewPermission}
              onDeletePermission={handleDeletePermission}
              onOpenPermissionModal={() => {
                setActivePermissionActivity(null);
                setShowPermissionModal(true);
              }}
            />
          )}

          {/* 3. Members Directory Layout */}
          {activeSection === 'members' && currentUser.role !== 'PENGURUS' && (
            <MembersView
              currentUser={currentUser}
              users={allUsers}
              departments={departments}
              programStudi={prodi}
              onCreateMember={async (newUser) => {
                try {
                  await api.createUser(newUser);
                  await reloadData(currentUser);
                  showToast('Anggota baru berhasil ditambahkan!', 'success');
                } catch (err: any) {
                  showToast(err?.message || 'Gagal menambahkan anggota', 'error');
                  throw err;
                }
              }}
              onUpdateMember={async (id, updates) => {
                try {
                  await api.updateUser(id, updates);
                  await reloadData(currentUser);
                  showToast('Data anggota berhasil diperbarui!', 'success');
                } catch (err: any) {
                  showToast(err?.message || 'Gagal memperbarui data anggota', 'error');
                  throw err;
                }
              }}
              onDeleteMember={async (id) => {
                try {
                  await api.deleteUser(id);
                  await reloadData(currentUser);
                  showToast('Anggota berhasil dihapus!', 'success');
                } catch (err: any) {
                  showToast(err?.message || 'Gagal menghapus anggota', 'error');
                  throw err;
                }
              }}
              onImportMembers={async (userList) => {
                try {
                  const res = await api.batchImportUsers(userList);
                  await reloadData(currentUser);
                  const toastText = `Import selesai: ${res.importedCount} baru ditambahkan${
                    res.updatedCount && res.updatedCount > 0 ? `, ${res.updatedCount} diperbarui` : ''
                  }${res.skippedCount > 0 ? `, ${res.skippedCount} dilewati` : ''}`;
                  showToast(toastText, 'success');
                  return res;
                } catch (err: any) {
                  showToast(err?.message || 'Gagal mengimpor anggota', 'error');
                  throw err;
                }
              }}
            />
          )}

          {/* 4. Master Data Layout (Super Admin only) */}
          {activeSection === 'master-data' && currentUser.role === 'SUPER_ADMIN' && (
            <MasterDataView
              currentUser={currentUser}
              initialTab={masterDataTab}
              fakultas={fakultas}
              programStudi={prodi}
              departments={departments}
              pjMappings={pjMappings}
              admins={allUsers.filter((u) => u.role === 'ADMIN')}
              onBackToDashboard={() => setActiveSection('dashboard')}
              onAddFakultas={async (nama) => {
                await api.addFakultas(nama);
                await reloadData(currentUser);
                showToast('Fakultas baru berhasil ditambahkan!', 'success');
              }}
              onUpdateFakultas={async (id, nama) => {
                await api.updateFakultas(id, nama);
                await reloadData(currentUser);
                showToast('Fakultas berhasil diperbarui!', 'success');
              }}
              onDeleteFakultas={async (id) => {
                try {
                  await api.deleteFakultas(id);
                  await reloadData(currentUser);
                  showToast('Fakultas berhasil dihapus!', 'success');
                } catch (err: any) {
                  showToast(err?.message || 'Gagal menghapus fakultas', 'error');
                  throw err;
                }
              }}
              onAddProdi={async (fId, nama) => {
                await api.addProdi(fId, nama);
                await reloadData(currentUser);
                showToast('Program studi baru berhasil ditambahkan!', 'success');
              }}
              onUpdateProdi={async (id, fId, nama) => {
                await api.updateProdi(id, fId, nama);
                await reloadData(currentUser);
                showToast('Program studi berhasil diperbarui!', 'success');
              }}
              onDeleteProdi={async (id) => {
                try {
                  await api.deleteProdi(id);
                  await reloadData(currentUser);
                  showToast('Program studi berhasil dihapus!', 'success');
                } catch (err: any) {
                  showToast(err?.message || 'Gagal menghapus program studi', 'error');
                  throw err;
                }
              }}
              onAddDept={async (nama) => {
                await api.addDepartment(nama);
                await reloadData(currentUser);
                showToast('Departemen baru berhasil ditambahkan!', 'success');
              }}
              onUpdateDept={async (id, nama) => {
                await api.updateDepartment(id, nama);
                await reloadData(currentUser);
                showToast('Departemen berhasil diperbarui!', 'success');
              }}
              onDeleteDept={async (id) => {
                try {
                  await api.deleteDepartment(id);
                  await reloadData(currentUser);
                  showToast('Departemen berhasil dihapus!', 'success');
                } catch (err: any) {
                  showToast(err?.message || 'Gagal menghapus departemen', 'error');
                  throw err;
                }
              }}
              onAssignPj={handleAssignPj}
              onRemovePj={handleRemovePj}
            />
          )}

          {/* 5. Dashboard Layout */}
          {activeSection === 'dashboard' && (
            <>
              {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'INTI') && (
                <SuperAdminView
                  currentUser={currentUser}
                  activities={activities}
                  permissions={permissions}
                  onOpenCreateActivity={() => setShowCreateActivity(true)}
                  onOpenMasterData={() => setActiveSection('master-data')}
                  onOpenMemberList={() => setActiveSection('members')}
                  onOpenAttendance={(act) => setActiveScannerActivity(act)}
                  onTogglePublish={handleTogglePublish}
                  onDeleteActivity={handleDeleteActivity}
                  onReviewPermission={handleReviewPermission}
                  onOpenAudit={() => setShowAuditModal(true)}
                  onOpenProfile={() => {
                    setActiveSection('profile');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onViewDetail={(act) => setSelectedActivityDetail(act)}
                  onNavigateTo={(sec) => setActiveSection(sec)}
                />
              )}

              {currentUser.role === 'ADMIN' && (
                <AdminView
                  currentUser={currentUser}
                  activities={activities}
                  permissions={permissions}
                  onOpenMemberList={() => setActiveSection('members')}
                  onOpenAttendance={(act) => setActiveScannerActivity(act)}
                  onReviewPermission={handleReviewPermission}
                  onOpenProfile={() => {
                    setActiveSection('profile');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onViewDetail={(act) => setSelectedActivityDetail(act)}
                  onNavigateTo={(sec) => setActiveSection(sec as any)}
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
                  onOpenProfile={() => {
                    setActiveSection('profile');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onViewDetail={(act) => setSelectedActivityDetail(act)}
                  onNavigateTo={(sec) => setActiveSection(sec)}
                />
              )}
            </>
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
          users={allUsers}
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
          allUsers={allUsers}
          onImportSuccess={() => syncRealtime(true)}
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
