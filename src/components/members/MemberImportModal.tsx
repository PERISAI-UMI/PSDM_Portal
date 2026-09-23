import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { DepartmentItem, ProgramStudiItem, UserRole } from '../../types/index.ts';

interface MemberImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (users: any[]) => Promise<{
    importedCount: number;
    updatedCount?: number;
    skippedCount: number;
    errors: { prn: string; reason: string }[];
  }>;
  departments: DepartmentItem[];
  programStudi: ProgramStudiItem[];
}

interface ParsedUserRow {
  prn: string;
  namaLengkap: string;
  email: string;
  nim: string;
  departemen: string;
  prodi: string;
  jabatan: string;
  role: string;
  noTelp?: string;
  angkatan?: number;
  generasi?: number;
  tempatLahir?: string;
  tanggalLahir?: string;
  alamat?: string;
  password?: string;
  status: 'valid' | 'invalid';
  validationMessage?: string;
}

export const MemberImportModal: React.FC<MemberImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  departments,
  programStudi,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedUserRow[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<{
    importedCount: number;
    updatedCount?: number;
    skippedCount: number;
    errors: { prn: string; reason: string }[];
  } | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  if (!isOpen) return null;

  // Download template CSV / Excel (Loaded dynamically)
  const handleDownloadTemplate = async () => {
    const XLSX = await import('xlsx');
    const templateData = [
      {
        PRN: 'PRN0091',
        'Nama Lengkap': 'Ahmad Fauzi',
        Email: 'ahmad.fauzi@example.com',
        NIM: '2200000091',
        Departemen: departments[0]?.nama || 'Pengembangan Sumber Daya Manusia (PSDM)',
        'Program Studi': programStudi[0]?.nama || 'Teknik Informatika',
        Jabatan: 'Staf Divisi Internal',
        Role: 'PENGURUS',
        'Nomor Telepon': '081234567891',
        Angkatan: 2022,
        Generasi: 12,
        'Tempat Lahir': 'Jakarta',
        'Tanggal Lahir (YYYY-MM-DD)': '2003-05-12',
        Alamat: 'Jl. Kampus No. 12',
        'Password Default': 'PsdmMember2026!',
      },
      {
        PRN: 'PRN0092',
        'Nama Lengkap': 'Siti Nurhaliza',
        Email: 'siti.nurhaliza@example.com',
        NIM: '2200000092',
        Departemen: departments[1]?.nama || departments[0]?.nama || 'Media',
        'Program Studi': programStudi[0]?.nama || 'Teknik Informatika',
        Jabatan: 'Kepala Divisi Publikasi',
        Role: 'PENGURUS',
        'Nomor Telepon': '081234567892',
        Angkatan: 2022,
        Generasi: 12,
        'Tempat Lahir': 'Bandung',
        'Tanggal Lahir (YYYY-MM-DD)': '2003-08-20',
        Alamat: 'Jl. Melati No. 4',
        'Password Default': 'PsdmMember2026!',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Anggota');
    XLSX.writeFile(workbook, 'Template_Import_Anggota_PSDM.xlsx');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorText(null);
    setImportResult(null);
    setIsProcessingFile(true);

    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const XLSX = await import('xlsx');
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setErrorText('Berkas kosong atau tidak memiliki baris data.');
          setParsedRows([]);
          setIsProcessingFile(false);
          return;
        }

        // Validate and normalize rows
        const normalized: ParsedUserRow[] = rawJson.map((row, idx) => {
          const prn = String(row['PRN'] || row['prn'] || row['Username'] || '').trim().toUpperCase();
          const nama = String(row['Nama Lengkap'] || row['namaLengkap'] || row['Nama'] || '').trim();
          const email = String(row['Email'] || row['email'] || '').trim();
          const nim = String(row['NIM'] || row['nim'] || '').trim();
          const deptInput = String(row['Departemen'] || row['departemen'] || row['Department'] || '').trim();
          const prodiInput = String(row['Program Studi'] || row['programStudi'] || row['Prodi'] || '').trim();
          const jabatan = String(row['Jabatan'] || row['jabatan'] || 'Anggota').trim();
          const roleInput = String(row['Role'] || row['role'] || 'PENGURUS').trim().toUpperCase();
          const noTelp = String(row['Nomor Telepon'] || row['noTelp'] || row['Telepon'] || '081234567890').trim();
          const angkatanVal = Number(row['Angkatan'] || row['angkatan'] || 2022);
          const generasiVal = Number(row['Generasi'] || row['generasi'] || 12);
          const tempatLahir = String(row['Tempat Lahir'] || row['tempatLahir'] || 'Indonesia').trim();
          const tanggalLahir = String(row['Tanggal Lahir (YYYY-MM-DD)'] || row['tanggalLahir'] || '2002-01-01').trim();
          const alamat = String(row['Alamat'] || row['alamat'] || 'Kampus').trim();
          const password = String(row['Password Default'] || row['password'] || 'PsdmMember2026!').trim();

          const missingFields: string[] = [];
          if (!prn) missingFields.push('PRN');
          if (!nama) missingFields.push('Nama');
          if (!email || !email.includes('@')) missingFields.push('Email');
          if (!nim) missingFields.push('NIM');

          const status = missingFields.length === 0 ? 'valid' : 'invalid';
          const validationMessage = status === 'invalid'
            ? `Kolom belum lengkap: ${missingFields.join(', ')}`
            : undefined;

          return {
            prn: prn || `BARIS-${idx + 2}`,
            namaLengkap: nama,
            email,
            nim,
            departemen: deptInput,
            prodi: prodiInput,
            jabatan,
            role: roleInput,
            noTelp,
            angkatan: angkatanVal,
            generasi: generasiVal,
            tempatLahir,
            tanggalLahir,
            alamat,
            password: password.length >= 8 ? password : 'PsdmMember2026!',
            status,
            validationMessage,
          };
        });

        setParsedRows(normalized);
      } catch (err: any) {
        setErrorText(err?.message || 'Gagal membaca berkas Excel/CSV. Pastikan format tabel sesuai.');
      } finally {
        setIsProcessingFile(false);
      }
    };

    reader.onerror = () => {
      setErrorText('Terjadi galat saat membaca berkas.');
      setIsProcessingFile(false);
    };

    reader.readAsBinaryString(file);
  };

  const handleStartImport = async () => {
    const validRows = parsedRows.filter((r) => r.status === 'valid');
    if (validRows.length === 0) {
      setErrorText('Tidak ada baris valid yang siap diimpor.');
      return;
    }

    try {
      setIsUploading(true);
      setErrorText(null);

      // Map rows to Department ID and Program Studi ID
      const payloadUsers = validRows.map((row) => {
        // Find matched department or fallback to first
        const matchedDept = departments.find(
          (d) => d.nama.toLowerCase() === row.departemen.toLowerCase() || d.id === row.departemen
        ) || departments[0];

        // Find matched prodi or fallback to first
        const matchedProdi = programStudi.find(
          (p) => p.nama.toLowerCase() === row.prodi.toLowerCase() || p.id === row.prodi
        ) || programStudi[0];

        const validRole: UserRole =
          row.role === 'SUPER_ADMIN' || row.role === 'ADMIN' || row.role === 'INTI' ? (row.role as UserRole) : 'PENGURUS';

        return {
          prn: row.prn,
          password: row.password || 'PsdmMember2026!',
          role: validRole,
          generasi: Number(row.generasi) || 12,
          departmentId: matchedDept.id,
          jabatan: row.jabatan || 'Anggota',
          namaLengkap: row.namaLengkap,
          tempatLahir: row.tempatLahir || 'Indonesia',
          tanggalLahir: /^\d{4}-\d{2}-\d{2}$/.test(row.tanggalLahir || '') ? row.tanggalLahir! : '2002-01-01',
          alamat: row.alamat || 'Kampus',
          noTelp: row.noTelp || '081234567890',
          email: row.email,
          nim: row.nim,
          programStudiId: matchedProdi.id,
          angkatan: Number(row.angkatan) || 2022,
        };
      });

      const res = await onImport(payloadUsers);
      setImportResult(res);
    } catch (err: any) {
      setErrorText(err?.message || 'Gagal mengimpor anggota.');
    } finally {
      setIsUploading(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.status === 'valid').length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-200/80 my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Import Anggota
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Unggah berkas Excel atau CSV untuk mendaftarkan data anggota.
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

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {/* Action Row: Download Template & Dropzone */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block mb-1">
                  Unduh Template
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                  Gunakan format resmi dengan kolom: PRN, Nama, NIM, Email, Departemen, Prodi, Jabatan.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Unduh Template .xlsx</span>
              </button>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="md:col-span-2 border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/40 hover:bg-slate-50"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              <FileSpreadsheet className="w-8 h-8 text-emerald-600 mb-2" />
              <div className="text-xs font-bold text-slate-900">
                {fileName ? fileName : 'Pilih berkas atau seret ke sini'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Mendukung .xlsx, .xls, .csv (maksimal 5 MB)
              </p>
            </div>
          </div>

          {/* Status Messages */}
          {errorText && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorText}</span>
            </div>
          )}

          {importResult && (
            <div className={`p-4 rounded-xl text-xs sm:text-sm space-y-2 border ${
              importResult.importedCount > 0 || (importResult.updatedCount && importResult.updatedCount > 0)
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${
                  importResult.importedCount > 0 || (importResult.updatedCount && importResult.updatedCount > 0)
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                }`} />
                <span>Proses Import Selesai</span>
              </div>
              <p className="text-xs">
                {importResult.importedCount > 0 && (
                  <span>
                    Berhasil menambahkan <strong>{importResult.importedCount}</strong> anggota baru.{' '}
                  </span>
                )}
                {importResult.updatedCount !== undefined && importResult.updatedCount > 0 && (
                  <span>
                    Berhasil memperbarui <strong>{importResult.updatedCount}</strong> anggota yang sudah ada.{' '}
                  </span>
                )}
                {importResult.importedCount === 0 && (!importResult.updatedCount || importResult.updatedCount === 0) && (
                  <span>
                    Tidak ada anggota baru yang ditambahkan.{' '}
                  </span>
                )}
                {importResult.skippedCount > 0 && (
                  <span className="text-rose-700 font-semibold">
                    ({importResult.skippedCount} dilewati).
                  </span>
                )}
              </p>

              {/* Rincian baris yang dilewati / galat */}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-800 block mb-1.5">
                    Rincian Baris yang Dilewati ({importResult.errors.length}):
                  </span>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {importResult.errors.map((err, idx) => (
                      <div
                        key={idx}
                        className="text-[11px] text-slate-700 flex items-start gap-2 bg-white/90 p-2 rounded-lg border border-slate-200 shadow-2xs"
                      >
                        <span className="font-mono font-bold text-slate-900 shrink-0 bg-slate-100 px-1.5 py-0.5 rounded">
                          {err.prn}
                        </span>
                        <span className="text-rose-600 font-medium">{err.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Table Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                  <span>Pratinjau Data ({parsedRows.length} Baris)</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {validCount} Siap
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                      {invalidCount} Galat
                    </span>
                  )}
                </div>
              </div>

              <div className="border border-slate-200/80 rounded-xl overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs min-w-[640px]">
                  <thead className="bg-slate-50 text-slate-500 font-semibold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">PRN</th>
                      <th className="py-2.5 px-3">Nama Lengkap</th>
                      <th className="py-2.5 px-3">NIM</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Departemen</th>
                      <th className="py-2.5 px-3">Jabatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3">
                          {r.status === 'valid' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Valid</span>
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] text-rose-600 font-medium"
                              title={r.validationMessage}
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Error</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono font-medium text-slate-900">{r.prn}</td>
                        <td className="py-2 px-3 font-medium text-slate-900">{r.namaLengkap}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{r.nim}</td>
                        <td className="py-2 px-3 text-slate-600 truncate max-w-[140px]">{r.email}</td>
                        <td className="py-2 px-3 text-slate-600">{r.departemen || '-'}</td>
                        <td className="py-2 px-3 text-slate-600">{r.jabatan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>

          <button
            type="button"
            onClick={handleStartImport}
            disabled={parsedRows.length === 0 || validCount === 0 || isUploading || isProcessingFile}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>
              {isUploading
                ? 'Sedang Mengimpor...'
                : isProcessingFile
                ? 'Membaca Berkas...'
                : `Impor ${validCount} Anggota`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
