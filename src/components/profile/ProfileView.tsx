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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-5 border-b border-slate-200/80">
        {onBackToDashboard && (
          <button
            type="button"
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 mb-2.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Dasbor</span>
          </button>
        )}
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Profil & Akun
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Informasi identitas personal, data keanggotaan, dan keamanan akun.
        </p>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* User Summary Strip */}
        <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
              {currentUser.namaLengkap.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base">{currentUser.namaLengkap}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                  {currentUser.role}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-0.5">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{currentUser.jabatan}</span>
                </span>
                <span>•</span>
                <span>{currentUser.departmentName || 'Organisasi'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
              PRN: <strong className="text-slate-900">{currentUser.prn}</strong>
            </span>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
              NIM: <strong className="text-slate-900">{currentUser.nim}</strong>
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-4 sm:px-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-slate-900 text-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Biodata Profil</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'security'
                ? 'border-slate-900 text-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Keamanan & Sandi</span>
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {/* Tab 1: Profil & Biodata */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-3xl">
              {profileSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              {profileError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    value={namaLengkap}
                    onChange={(e) => setNamaLengkap(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp / Telepon *
                  </label>
                  <input
                    type="tel"
                    value={noTelp}
                    onChange={(e) => setNoTelp(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NIM (Nomor Induk Mahasiswa) *
                  </label>
                  <input
                    type="text"
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tahun Angkatan *
                  </label>
                  <input
                    type="number"
                    value={angkatan}
                    onChange={(e) => setAngkatan(Number(e.target.value))}
                    min={2000}
                    max={2100}
                    required
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tempat Lahir
                  </label>
                  <input
                    type="text"
                    value={tempatLahir}
                    onChange={(e) => setTempatLahir(e.target.value)}
                    placeholder="Kota kelahiran"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    value={tanggalLahir}
                    onChange={(e) => setTanggalLahir(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Instagram (Username)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={instagramUsername}
                      onChange={(e) => setInstagramUsername(e.target.value)}
                      placeholder="username (tanpa @)"
                      className="w-full px-3.5 py-2.5 pl-9 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                    />
                    <Instagram className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  LinkedIn URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-3.5 py-2.5 pl-9 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                  <Globe className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Domisili
                </label>
                <textarea
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  rows={3}
                  placeholder="Alamat domisili saat ini..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {savingProfile ? 'Menyimpan...' : 'Simpan Pembaruan Profil'}
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Ganti Kata Sandi */}
          {activeTab === 'security' && (
            <form onSubmit={handleSavePassword} className="space-y-4 max-w-xl">
              {passwordSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi Saat Ini *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan kata sandi saat ini"
                    required
                    className="w-full px-3.5 py-2.5 pr-10 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                    className="w-full px-3.5 py-2.5 pr-10 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Konfirmasi Kata Sandi Baru *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  required
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border text-slate-900 focus:outline-none focus:ring-2 ${
                    confirmPassword && newPassword !== confirmPassword
                      ? 'border-rose-300 focus:ring-rose-200'
                      : 'border-slate-300 focus:ring-slate-900/10 focus:border-slate-900'
                  }`}
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[11px] text-rose-600 mt-1">Konfirmasi kata sandi tidak cocok.</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={savingPassword || (confirmPassword.length > 0 && newPassword !== confirmPassword)}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {savingPassword ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
