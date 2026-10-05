import React, { useState } from 'react';
import {
  X,
  User,
  Building2,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  Lock,
  Globe,
  Instagram,
  Save,
  AlertCircle,
} from 'lucide-react';
import type { AuthUser, DepartmentItem, ProgramStudiItem, UserRole } from '../../types/index.ts';

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  member?: AuthUser | null;
  departments: DepartmentItem[];
  programStudi: ProgramStudiItem[];
  isSubmitting?: boolean;
}

export const MemberFormModal: React.FC<MemberFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  member,
  departments,
  programStudi,
  isSubmitting = false,
}) => {
  const isEditing = Boolean(member);

  const [prn, setPrn] = useState(member?.prn || '');
  const [password, setPassword] = useState(isEditing ? '' : 'password123');
  const [role, setRole] = useState<UserRole | ''>(member?.role || '');
  const [generasi, setGenerasi] = useState<string>(member?.generasi ? String(member.generasi) : '');
  const [departmentId, setDepartmentId] = useState(member?.departmentId || '');
  const [jabatan, setJabatan] = useState(member?.jabatan || '');
  const [namaLengkap, setNamaLengkap] = useState(member?.namaLengkap || '');
  const [tempatLahir, setTempatLahir] = useState(member?.tempatLahir || '');
  const [tanggalLahir, setTanggalLahir] = useState(member?.tanggalLahir || '');
  const [alamat, setAlamat] = useState(member?.alamat || '');
  const [noTelp, setNoTelp] = useState(member?.noTelp || '');
  const [email, setEmail] = useState(member?.email || '');
  const [nim, setNim] = useState(member?.nim || '');
  const [programStudiId, setProgramStudiId] = useState(member?.programStudiId || '');
  const [angkatan, setAngkatan] = useState<string>(member?.angkatan ? String(member.angkatan) : '');
  const [linkedinUrl, setLinkedinUrl] = useState(member?.linkedinUrl || '');
  const [instagramUsername, setInstagramUsername] = useState(member?.instagramUsername || '');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isEditing && !prn.trim()) {
      setErrorMsg('PRN wajib diisi');
      return;
    }
    if (!isEditing && (!password || password.length < 8)) {
      setErrorMsg('Password default wajib diisi minimal 8 karakter');
      return;
    }
    if (!namaLengkap.trim()) {
      setErrorMsg('Nama lengkap wajib diisi');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Format email tidak valid');
      return;
    }
    if (!noTelp.trim()) {
      setErrorMsg('Nomor telepon / WhatsApp wajib diisi');
      return;
    }
    if (!nim.trim()) {
      setErrorMsg('NIM wajib diisi');
      return;
    }
    if (!departmentId) {
      setErrorMsg('Departemen wajib dipilih');
      return;
    }
    if (!programStudiId) {
      setErrorMsg('Program Studi wajib dipilih');
      return;
    }
    if (!jabatan.trim()) {
      setErrorMsg('Jabatan wajib diisi');
      return;
    }
    if (!role) {
      setErrorMsg('Role sistem wajib dipilih');
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        role: (role as UserRole) || 'PENGURUS',
        generasi: generasi ? Number(generasi) : 12,
        departmentId,
        jabatan: jabatan.trim(),
        namaLengkap: namaLengkap.trim(),
        tempatLahir: tempatLahir.trim() || 'Indonesia',
        tanggalLahir: tanggalLahir || '2002-01-01',
        alamat: alamat.trim() || 'Kampus',
        noTelp: noTelp.trim() || '081234567890',
        email: email.trim(),
        nim: nim.trim(),
        programStudiId,
        angkatan: angkatan ? Number(angkatan) : new Date().getFullYear(),
        linkedinUrl: linkedinUrl.trim() || null,
        instagramUsername: instagramUsername.trim().replace(/^@/, '') || null,
      };

      if (!isEditing) {
        payload.prn = prn.trim().toUpperCase();
        payload.password = password;
      } else if (password) {
        payload.password = password;
      }

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menyimpan data anggota');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-surface w-full max-w-2xl rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-200/80 my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {isEditing ? 'Ubah Data Anggota' : 'Tambah Anggota Baru'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing
                ? `Perbarui informasi data keanggotaan untuk ${member?.namaLengkap}`
                : 'Daftarkan Pengurus ke dalam pangkalan data organisasi.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} autoComplete="off" className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section: Akun & Identifikasi */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Kredensial & Identifikasi
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  PRN / ID Anggota *
                </label>
                <input
                  type="text"
                  name="member_prn_code"
                  autoComplete="off"
                  value={prn}
                  onChange={(e) => setPrn(e.target.value.toUpperCase())}
                  disabled={isEditing}
                  placeholder="Contoh: PRN0099"
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900 bg-surface disabled:bg-slate-100 disabled:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isEditing ? 'Kata Sandi Baru (Opsional)' : 'Kata Sandi Default *'}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    name="member_pass_init"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isEditing ? 'Biarkan kosong jika tidak diubah' : 'Minimal 8 karakter'}
                    required={!isEditing}
                    minLength={password ? 8 : undefined}
                    className="w-full px-3 py-2 pl-9 text-xs rounded-lg border border-slate-300 text-slate-900 bg-surface focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Data Pribadi */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Data Pribadi
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  name="member_full_name"
                  autoComplete="off"
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  placeholder="Nama sesuai KTM"
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900 bg-surface focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="member_mail_address"
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@domain.com"
                    required
                    className="w-full px-3 py-2 pl-9 text-xs rounded-lg border border-slate-300 text-slate-900 bg-surface focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Telepon / WhatsApp *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="member_phone_number"
                    autoComplete="off"
                    value={noTelp}
                    onChange={(e) => setNoTelp(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    required
                    className="w-full px-3 py-2 pl-9 text-xs rounded-lg border border-slate-300 text-slate-900 bg-surface focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIM *
                </label>
                <input
                  type="text"
                  name="member_univ_nim"
                  autoComplete="off"
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                  placeholder="Nomor Induk Mahasiswa"
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900 bg-surface focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tempat Lahir
                </label>
                <input
                  type="text"
                  name="member_birth_place"
                  autoComplete="off"
                  value={tempatLahir}
                  onChange={(e) => setTempatLahir(e.target.value)}
                  placeholder="Kota kelahiran"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900 bg-surface focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Lahir
                </label>
                <input
                  type="date"
                  name="member_birth_date"
                  autoComplete="off"
                  value={tanggalLahir}
                  onChange={(e) => setTanggalLahir(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900 bg-surface focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>
          </div>

          {/* Section: Organisasi & Akademik */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Keorganisasian & Akademik
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Departemen *
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900 bg-surface focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  <option value="" disabled>-- Pilih Departemen --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Program Studi *
                </label>
                <select
                  value={programStudiId}
                  onChange={(e) => setProgramStudiId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900 bg-surface focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  <option value="" disabled>-- Pilih Program Studi --</option>
                  {programStudi.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jabatan *
                </label>
                <input
                  type="text"
                  name="member_org_position"
                  autoComplete="off"
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  placeholder="Contoh: Anggota Divisi / Staf"
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900 bg-surface focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>



              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role Sistem *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900 bg-surface focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  <option value="" disabled>-- Pilih Role Sistem --</option>
                  <option value="PENGURUS">Pengurus (Standar)</option>
                  <option value="INTI">Inti (Monitoring)</option>
                  <option value="ADMIN">Admin (Staf PSDM)</option>
                  <option value="SUPER_ADMIN">Super Admin (Kepala PSDM)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Angkatan
                  </label>
                  <input
                    type="number"
                    name="member_batch_year"
                    autoComplete="off"
                    value={angkatan}
                    onChange={(e) => setAngkatan(e.target.value)}
                    placeholder="Contoh: 2024"
                    min={2000}
                    max={2100}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900 bg-surface focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Generasi
                  </label>
                  <input
                    type="number"
                    name="member_gen_num"
                    autoComplete="off"
                    value={generasi}
                    onChange={(e) => setGenerasi(e.target.value)}
                    placeholder="Contoh: 12"
                    min={1}
                    max={100}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900 bg-surface focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Sosial Media & Alamat */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Sosial Media & Alamat
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Instagram
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="member_social_ig"
                    autoComplete="off"
                    value={instagramUsername}
                    onChange={(e) => setInstagramUsername(e.target.value)}
                    placeholder="Akun Instagram (tanpa @)"
                    className="w-full px-3 py-2 pl-9 text-xs rounded-lg border border-slate-300 text-slate-900 bg-surface focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                  <Instagram className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  LinkedIn URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    name="member_social_in"
                    autoComplete="off"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full px-3 py-2 pl-9 text-xs rounded-lg border border-slate-300 text-slate-900 bg-surface focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                  <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Domisili
                </label>
                <textarea
                  name="member_home_address"
                  autoComplete="off"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  rows={2}
                  placeholder="Alamat tempat tinggal saat ini"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900 bg-surface focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200/80 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-ink bg-accent hover:bg-accent-600 rounded-lg transition-colors shadow-2xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Tambah Anggota'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
