import React, { useState } from 'react';
import {
  X,
  User,
  KeyRound,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  Globe,
  Instagram,
} from 'lucide-react';
import type { AuthUser } from '../../types/index.ts';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  onUpdateProfile: (updates: Partial<AuthUser>) => Promise<void>;
  onChangePassword: (
    oldPass: string,
    newPass: string
  ) => Promise<{ success: boolean; message: string }>;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile,
  onChangePassword,
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

  if (!isOpen) return null;

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
      setProfileSuccess('Profil berhasil diperbarui.');
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
      setPasswordError('Masukkan kata sandi saat ini.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
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
        setPasswordSuccess(res.message);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(null), 4000);
      } else {
        setPasswordError(res.message);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal memperbarui kata sandi.';
      setPasswordError(errorMsg);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-200/80 max-h-[92vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
              {currentUser.namaLengkap.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Profil & Akun
              </h2>
              <p className="text-xs text-slate-500">
                Informasi identitas dan keamanan akun.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Read-Only Position & Role Info Strip */}
        <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-900">{currentUser.jabatan}</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">{currentUser.departmentName || 'Organisasi'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
              PRN: {currentUser.prn}
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-800">
              {currentUser.role}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 text-xs font-semibold mt-4 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-3 sm:px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-slate-900 text-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profil</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`pb-2.5 px-3 sm:px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'security'
                ? 'border-slate-900 text-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Keamanan</span>
          </button>
        </div>

        {/* Tab 1: Profil & Biodata */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto pr-1 space-y-4">
            {profileSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 pl-9 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Telepon *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={noTelp}
                    onChange={(e) => setNoTelp(e.target.value)}
                    required
                    className="w-full px-3 py-2 pl-9 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIM
                </label>
                <input
                  type="text"
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Angkatan
                </label>
                <input
                  type="number"
                  value={angkatan}
                  onChange={(e) => setAngkatan(Number(e.target.value))}
                  min={2018}
                  max={2030}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
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
                  placeholder="Tempat lahir"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Lahir
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={tanggalLahir}
                    onChange={(e) => setTanggalLahir(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Instagram
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={instagramUsername}
                    onChange={(e) => setInstagramUsername(e.target.value)}
                    placeholder="username"
                    className="w-full px-3 py-2 pl-9 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                  <Instagram className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                LinkedIn
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-3 py-2 pl-9 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
                <Globe className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Domisili
              </label>
              <div className="relative">
                <textarea
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  rows={2}
                  placeholder="Alamat saat ini..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg min-h-[38px] transition-colors"
              >
                Tutup
              </button>
              <button
                type="submit"
                disabled={savingProfile}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg min-h-[38px] transition-colors shadow-2xs disabled:opacity-50"
              >
                {savingProfile ? 'Menyimpan...' : 'Simpan Profil'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Ganti Kata Sandi */}
        {activeTab === 'security' && (
          <form onSubmit={handleSavePassword} className="flex-1 overflow-y-auto pr-1 space-y-4">

            {passwordSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
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
                  placeholder="Kata sandi saat ini"
                  required
                  className="w-full px-3.5 py-2.5 pr-10 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
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
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
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

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg min-h-[38px] transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingPassword || (confirmPassword.length > 0 && newPassword !== confirmPassword)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg min-h-[38px] transition-colors shadow-2xs disabled:opacity-50"
              >
                {savingPassword ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
