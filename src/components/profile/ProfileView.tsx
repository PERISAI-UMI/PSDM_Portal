import React, { useState } from 'react';
import {
  User,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  Globe,
  Instagram,
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  GraduationCap,
  MapPin,
  Save,
  Shield,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import type { AuthUser } from '../../types/index.ts';

interface ProfileViewProps {
  currentUser: AuthUser;
  onUpdateProfile: (updates: Partial<AuthUser>) => Promise<void>;
  onChangePassword: (
    oldPass: string,
    newPass: string
  ) => Promise<{ success: boolean; message: string }>;
  onBackToDashboard?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onUpdateProfile,
  onChangePassword,
  onBackToDashboard,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Profile Form States
  const [namaLengkap, setNamaLengkap] = useState(currentUser.namaLengkap);
  const [email, setEmail] = useState(currentUser.email);
  const [noTelp, setNoTelp] = useState(currentUser.noTelp);
  const [nim, setNim] = useState(currentUser.nim);
  const [angkatan, setAngkatan] = useState(currentUser.angkatan || 2022);
  const [alamat, setAlamat] = useState(currentUser.alamat || '');
  const [tempatLahir, setTempatLahir] = useState(currentUser.tempatLahir || '');
  const [tanggalLahir, setTanggalLahir] = useState(currentUser.tanggalLahir || '');
  const [linkedinUrl, setLinkedinUrl] = useState(currentUser.linkedinUrl || '');
  const [instagramUsername, setInstagramUsername] = useState(currentUser.instagramUsername || '');

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Status feedback
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!namaLengkap.trim()) {
      setProfileError('Nama lengkap tidak boleh kosong.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setProfileError('Format email tidak valid.');
      return;
    }
    if (!noTelp.trim()) {
      setProfileError('Nomor telepon tidak boleh kosong.');
      return;
    }

    try {
      setSavingProfile(true);
      await onUpdateProfile({
        namaLengkap: namaLengkap.trim(),
        email: email.trim(),
        noTelp: noTelp.trim(),
        nim: nim.trim(),
        angkatan: Number(angkatan),
        alamat: alamat.trim() || undefined,
        tempatLahir: tempatLahir.trim() || undefined,
        tanggalLahir: tanggalLahir || undefined,
        linkedinUrl: linkedinUrl.trim() || null,
        instagramUsername: instagramUsername.trim().replace(/^@/, '') || null,
      });
      setProfileSuccess('Profil berhasil diperbarui dan tersimpan di database.');
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal memperbarui profil.';
      setProfileError(errorMsg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Kata sandi saat ini harus diisi.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    try {
      setSavingPassword(true);
      const res = await onChangePassword(currentPassword, newPassword);
      if (res.success) {
        setPasswordSuccess(res.message || 'Kata sandi berhasil diubah.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(null), 4000);
      } else {
        setPasswordError(res.message || 'Gagal mengubah kata sandi.');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal mengubah kata sandi.';
      setPasswordError(errorMsg);
    } finally {
      setSavingPassword(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { label: 'Kepala Departemen PSDM', badge: 'Super Admin' };
      case 'ADMIN':
        return { label: 'Staf PSDM', badge: 'Admin PJ' };
      case 'INTI':
        return { label: 'Pengurus Inti Organisasi', badge: 'Pengurus Inti' };
      case 'PENGURUS':
      default:
        return { label: 'Pengurus Organisasi', badge: 'Pengurus' };
    }
  };

  const roleMeta = getRoleBadge(currentUser.role);

  return (
    <div className="space-y-6">
      {/* 1. Page Header (Standard Layout) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div>
          {onBackToDashboard && (
            <button
              type="button"
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 mb-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Dasbor</span>
            </button>
          )}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Profil & Pengaturan Akun
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data biodata anggota, informasi keorganisasian, serta keamanan akses akun Anda.
          </p>
        </div>

        {/* User Badges */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono">
            PRN: <span className="font-bold text-slate-900">{currentUser.prn}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono">
            NIM: <span className="font-bold text-slate-900">{currentUser.nim}</span>
          </div>
        </div>
      </div>

      {/* 2. Key Metadata Banner (Full-width grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Nama Lengkap</span>
          </div>
          <div className="text-sm font-bold text-slate-900 truncate">
            {currentUser.namaLengkap}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Departemen</span>
          </div>
          <div className="text-sm font-bold text-slate-900 truncate">
            {currentUser.departmentName || 'PSDM'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
            <span>Jabatan / Peran</span>
          </div>
          <div className="text-sm font-bold text-slate-900 truncate">
            {currentUser.jabatan}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Angkatan & Generasi</span>
          </div>
          <div className="text-sm font-bold text-slate-900 truncate">
            {currentUser.angkatan ? `Angkatan ${currentUser.angkatan}` : '-'} • Gen {currentUser.generasi}
          </div>
        </div>
      </div>

      {/* 3. Section Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`py-2.5 sm:pb-3 px-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Biodata Profil</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`py-2.5 sm:pb-3 px-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'security'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Keamanan & Sandi</span>
        </button>
      </div>

      {/* 4. Main Form Area - Maximized Full-Width Layout */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {profileSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          {/* Section A: Identitas & Kontak */}
          <div className="space-y-4">
            <div className="border-b border-slate-200/80 pb-2">
              <h2 className="text-sm font-bold text-slate-900">Identitas Diri & Kontak</h2>
              <p className="text-xs text-slate-500">Informasi personal dan nomor yang dapat dihubungi</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Alamat Email *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 pl-9 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nomor WhatsApp / Telepon *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={noTelp}
                    onChange={(e) => setNoTelp(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 pl-9 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Data Akademik & Kelahiran */}
          <div className="space-y-4 pt-2">
            <div className="border-b border-slate-200/80 pb-2">
              <h2 className="text-sm font-bold text-slate-900">Data Akademik & Tempat Lahir</h2>
              <p className="text-xs text-slate-500">Nomor induk mahasiswa dan keterangan kelahiran</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  NIM (Nomor Induk Mahasiswa) *
                </label>
                <input
                  type="text"
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tahun Angkatan *
                </label>
                <input
                  type="number"
                  value={angkatan}
                  onChange={(e) => setAngkatan(Number(e.target.value))}
                  min={2000}
                  max={2100}
                  required
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tempat Lahir
                </label>
                <input
                  type="text"
                  value={tempatLahir}
                  onChange={(e) => setTempatLahir(e.target.value)}
                  placeholder="Kota kelahiran"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tanggal Lahir
                </label>
                <input
                  type="date"
                  value={tanggalLahir}
                  onChange={(e) => setTanggalLahir(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section C: Media Sosial & Domisili */}
          <div className="space-y-4 pt-2">
            <div className="border-b border-slate-200/80 pb-2">
              <h2 className="text-sm font-bold text-slate-900">Media Sosial & Domisili</h2>
              <p className="text-xs text-slate-500">Tautan jejaring profesional dan alamat tempat tinggal</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Instagram (Username)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={instagramUsername}
                    onChange={(e) => setInstagramUsername(e.target.value)}
                    placeholder="username (tanpa @)"
                    className="w-full px-3.5 py-2.5 pl-9 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                  />
                  <Instagram className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  LinkedIn URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-3.5 py-2.5 pl-9 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                  />
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Alamat Domisili
                </label>
                <div className="relative">
                  <textarea
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    rows={3}
                    placeholder="Alamat domisili / tempat tinggal saat ini..."
                    className="w-full px-3.5 py-2.5 pl-9 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-4 border-t border-slate-200/80 flex items-center justify-end gap-3">
            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={savingProfile}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingProfile ? 'Menyimpan...' : 'Simpan Pembaruan Profil'}</span>
            </button>
          </div>
        </form>
      )}

      {/* 5. Security & Password Tab (Maximized Layout) */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {passwordSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Password Update Form (7 cols) */}
            <form onSubmit={handleSavePassword} className="lg:col-span-7 space-y-5">
              <div className="border-b border-slate-200/80 pb-2">
                <h2 className="text-sm font-bold text-slate-900">Formulir Perubahan Kata Sandi</h2>
                <p className="text-xs text-slate-500">
                  Perbarui kata sandi secara berkala demi menjaga keamanan data keorganisasian
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Kata Sandi Saat Ini *
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan kata sandi saat ini"
                      required
                      className="w-full px-3.5 py-2.5 pr-10 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Kata Sandi Baru *
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        required
                        minLength={6}
                        className="w-full px-3.5 py-2.5 pr-10 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Konfirmasi Kata Sandi Baru *
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi baru"
                      required
                      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border text-slate-900 bg-white focus:outline-none focus:ring-2 transition-all ${
                        confirmPassword && newPassword !== confirmPassword
                          ? 'border-rose-300 focus:ring-rose-200'
                          : 'border-slate-300 focus:ring-slate-900/10 focus:border-slate-900'
                      }`}
                    />
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-[11px] text-rose-600 mt-1.5">Konfirmasi kata sandi tidak cocok.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/80 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={savingPassword || (confirmPassword.length > 0 && newPassword !== confirmPassword)}
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{savingPassword ? 'Menyimpan...' : 'Perbarui Kata Sandi'}</span>
                </button>
              </div>
            </form>

            {/* Right Column: Security Guidelines & Policy (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>Standar Keamanan Akun PSDM</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-2.5">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>Gunakan minimal 8 karakter dengan kombinasi huruf, angka, dan simbol.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>Hindari memakai tanggal lahir, nomor telepon, atau data umum yang mudah ditebak.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>Kata sandi dienkripsi dengan PBKDF2 SHA-256 standard cloud security.</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 leading-relaxed">
                  <strong>Peringatan Keamanan:</strong> Jangan berikan kata sandi atau kode akses Anda kepada siapapun, termasuk sesama pengurus maupun pengelola sistem.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
