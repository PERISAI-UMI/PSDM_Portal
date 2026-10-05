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
  Camera,
  Trash2,
  Upload,
  Loader2,
} from 'lucide-react';
import type { AuthUser } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { AvatarCropModal } from './AvatarCropModal.tsx';
import { ConfirmModal } from '../ui/ConfirmModal.tsx';

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

  // Avatar Management
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentUser.avatarUrl || null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [showDeleteAvatarConfirm, setShowDeleteAvatarConfirm] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      setAvatarError('Berkas yang dipilih harus berupa gambar (JPG, PNG, WebP).');
      return;
    }

    setAvatarError(null);
    const objectUrl = URL.createObjectURL(file);
    setCropImageSrc(objectUrl);
    setIsCropModalOpen(true);
  };

  const handleCropComplete = async (croppedFile: File) => {
    try {
      setIsUploadingAvatar(true);
      setAvatarError(null);

      const res = await api.uploadAvatar(croppedFile);
      setAvatarUrl(res.avatarUrl);
      setProfileSuccess('Foto profil berhasil disesuaikan dan diperbarui!');
      setTimeout(() => setProfileSuccess(null), 3000);
      await onUpdateProfile({ avatarUrl: res.avatarUrl });
      setIsCropModalOpen(false);
      if (cropImageSrc) {
        URL.revokeObjectURL(cropImageSrc);
        setCropImageSrc(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah foto profil.';
      setAvatarError(msg);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleConfirmRemoveAvatar = async () => {
    try {
      setIsUploadingAvatar(true);
      setAvatarError(null);
      await api.removeAvatar();
      setAvatarUrl(null);
      setProfileSuccess('Foto profil berhasil dihapus.');
      setTimeout(() => setProfileSuccess(null), 3000);
      await onUpdateProfile({ avatarUrl: null });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus foto profil.';
      setAvatarError(msg);
    } finally {
      setIsUploadingAvatar(false);
      setShowDeleteAvatarConfirm(false);
    }
  };

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
      <div className="bg-surface w-full max-w-2xl rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-200/80 max-h-[92vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center font-bold text-sm shadow-2xs overflow-hidden">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.namaLengkap} className="w-full h-full object-cover" />
              ) : (
                currentUser.namaLengkap.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Profil & Akun
              </h2>
              <p className="text-xs text-slate-500">
                Kelola data diri dan keamanan akun.
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
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface text-slate-600 border border-slate-200">
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
                ? 'border-brand text-slate-900 font-bold'
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
                ? 'border-brand text-slate-900 font-bold'
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
            {/* Foto Profil Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative group shrink-0">
                  <div className="w-14 h-14 rounded-xl bg-brand text-white flex items-center justify-center font-bold text-lg shadow-2xs overflow-hidden ring-2 ring-surface">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={currentUser.namaLengkap} className="w-full h-full object-cover" />
                    ) : (
                      currentUser.namaLengkap.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-brand text-white hover:bg-brand-700 shadow cursor-pointer disabled:opacity-50"
                    title="Ganti Foto"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Camera className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900">Foto Profil</div>
                  <div className="text-[11px] text-slate-500">JPG, PNG, atau WebP (maks. 5MB)</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={handleAvatarFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand hover:bg-brand-700 text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isUploadingAvatar ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3 h-3" />
                      <span>{avatarUrl ? 'Ganti Foto' : 'Unggah Foto'}</span>
                    </>
                  )}
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteAvatarConfirm(true)}
                    disabled={isUploadingAvatar}
                    className="p-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                    title="Hapus foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {avatarError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{avatarError}</span>
              </div>
            )}

            {profileSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 pl-9 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nomor WhatsApp
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={noTelp}
                    onChange={(e) => setNoTelp(e.target.value)}
                    required
                    className="w-full px-3 py-2 pl-9 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
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
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
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
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
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
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
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
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
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
                    className="w-full px-3 py-2 pl-9 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
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
                  className="w-full px-3 py-2 pl-9 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
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
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
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
                className="px-4 py-2 text-xs font-semibold text-white bg-brand hover:bg-brand-700 rounded-lg min-h-[38px] transition-colors shadow-2xs disabled:opacity-50"
              >
                {savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Ganti Kata Sandi */}
        {activeTab === 'security' && (
          <form onSubmit={handleSavePassword} className="flex-1 overflow-y-auto pr-1 space-y-4">

            {passwordSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Kata Sandi Saat Ini
              </label>
              <div className="relative">
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan kata sandi saat ini"
                  required
                  className="w-full px-3.5 py-2.5 pr-10 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
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
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Kata Sandi Baru
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                  minLength={6}
                  className="w-full px-3.5 py-2.5 pr-10 text-xs sm:text-sm rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand"
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
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Konfirmasi Kata Sandi
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
                    : 'border-slate-300 focus:ring-brand/10 focus:border-brand'
                }`}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">Konfirmasi kata sandi tidak cocok.</p>
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
                className="px-4 py-2 text-xs font-semibold text-white bg-brand hover:bg-brand-700 rounded-lg min-h-[38px] transition-colors shadow-2xs disabled:opacity-50"
              >
                {savingPassword ? 'Menyimpan...' : 'Simpan Kata Sandi'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Interactive Avatar Crop & Zoom Modal */}
      <AvatarCropModal
        isOpen={isCropModalOpen}
        imageSrc={cropImageSrc}
        onClose={() => {
          setIsCropModalOpen(false);
          if (cropImageSrc) {
            URL.revokeObjectURL(cropImageSrc);
            setCropImageSrc(null);
          }
        }}
        onCropComplete={handleCropComplete}
        isSaving={isUploadingAvatar}
      />

      {/* Confirm Delete Avatar Modal */}
      <ConfirmModal
        isOpen={showDeleteAvatarConfirm}
        onClose={() => setShowDeleteAvatarConfirm(false)}
        onConfirm={handleConfirmRemoveAvatar}
        title="Hapus Foto Profil"
        message="Apakah Anda yakin ingin menghapus foto profil dan kembali menggunakan inisial nama organisasi?"
        confirmLabel="Ya, Hapus Foto"
        cancelLabel="Batal"
        isDanger={true}
      />
    </div>
  );
};
