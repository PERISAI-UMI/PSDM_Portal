import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import type { PointsLogImportResult } from '../../types/index.ts';

interface PointsLogImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PointsLogImportModal: React.FC<PointsLogImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<PointsLogImportResult | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  if (!isOpen) return null;

  // Unduh Template Buku Besar Poin .xlsx
  const handleDownloadTemplate = async () => {
    try {
      const XLSX = await import('xlsx');
      const templateData = [
        {
          TANGGAL: '2026-08-15',
          NAMA: 'Ahmad Fauzi',
          JENIS: 'Reward',
          NOMINAL: 3,
          KETERANGAN: 'Hadir Pada Kegiatan Rapat Pleno',
        },
        {
          TANGGAL: '2026-08-15',
          NAMA: 'Siti Nurhaliza',
          JENIS: 'Punishment',
          NOMINAL: 5,
          KETERANGAN: 'Alpha Pada Kegiatan Rapat Pleno',
        },
        {
          TANGGAL: '2026-08-20',
          NAMA: 'Budi Santoso',
          JENIS: 'Reward',
          NOMINAL: 5,
          KETERANGAN: 'Hadir Pada Kegiatan Seminar Nasional',
        },
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template Buku Besar');
      XLSX.writeFile(wb, 'Template_Buku_Besar_Poin.xlsx');
    } catch (err: any) {
      alert('Gagal mengunduh template: ' + (err?.message || 'Error'));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorText(null);
    setImportResult(null);

    const validExts = ['.xlsx', '.xls', '.csv'];
    const lowerName = file.name.toLowerCase();
    const isValid = validExts.some((ext) => lowerName.endsWith(ext));
    if (!isValid) {
      setErrorText('Format berkas harus berupa .xlsx, .xls, atau .csv');
      return;
    }

    setSelectedFile(file);

    // Pratinjau awal file
    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
      const firstSheet = wb.SheetNames[0];
      if (firstSheet) {
        const rows = XLSX.utils.sheet_to_json<any>(wb.Sheets[firstSheet], { defval: '' });
        setPreviewRows(rows.slice(0, 5));
      }
    } catch {
      // Abaikan pratinjau jika gagal parsing lokal
      setPreviewRows([]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsProcessing(true);
      setErrorText(null);

      const res = await api.importPointsLog(selectedFile);
      setImportResult(res.data);
      onSuccess();
    } catch (err: any) {
      setErrorText(err?.message || 'Gagal mengimpor buku besar poin');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewRows([]);
    setImportResult(null);
    setErrorText(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-surface rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Import Buku Besar Poin
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Mendukung berkas Excel (.xlsx, .xls) dan CSV (.csv)
              </p>
            </div>
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
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Download Template Banner */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Unduh Format Template</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Format kolom: <span className="font-semibold text-slate-700">TANGGAL, NAMA, JENIS, NOMINAL, KETERANGAN</span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold shrink-0 transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Unduh Template .xlsx</span>
            </button>
          </div>

          {/* Feedback Pesan Error */}
          {errorText && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorText}</span>
            </div>
          )}

          {/* Hasil Import Berhasil */}
          {importResult && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 dark:text-emerald-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Proses Impor Selesai!</span>
              </div>
              <p className="text-xs">
                Berhasil menambahkan <strong>{importResult.importedCount}</strong> data baru dan memperbarui{' '}
                <strong>{importResult.updatedCount}</strong> data.
                {importResult.skippedCount > 0 && (
                  <span className="text-rose-700 dark:text-rose-300 font-semibold ml-1">
                    ({importResult.skippedCount} dilewati).
                  </span>
                )}
              </p>

              {/* Rincian baris error jika ada */}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-2 pt-2 border-t border-emerald-200/80">
                  <span className="text-[11px] font-bold text-slate-700 block mb-1">
                    Baris yang Dilewati ({importResult.errors.length}):
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-[11px] text-slate-600">
                    {importResult.errors.map((err, idx) => (
                      <div key={idx} className="bg-surface/80 p-1.5 rounded border border-emerald-200 flex items-start gap-1.5">
                        <span className="font-mono font-bold text-slate-800">Baris {err.row}:</span>
                        <span className="text-rose-600 dark:text-rose-400">{err.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload Area jika belum ada hasil impor */}
          {!importResult && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Pilih Berkas Excel / CSV
              </label>

              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-brand bg-slate-50/60 hover:bg-slate-50 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-10 h-10 rounded-full bg-surface shadow-xs border border-slate-200 flex items-center justify-center text-slate-600">
                    <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Klik untuk memilih berkas atau seret ke sini
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Mendukung berkas .xlsx, .xls, .csv (Maks. 5MB)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">
                          {selectedFile.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Ganti</span>
                    </button>
                  </div>

                  {/* Pratinjau 5 baris pertama */}
                  {previewRows.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-700 block">
                        Pratinjau Awal (Maks. 5 Baris):
                      </span>
                      <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-44 overflow-y-auto">
                        <table className="w-full text-left text-[11px] min-w-[500px]">
                          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0">
                            <tr>
                              <th className="py-2 px-3">TANGGAL</th>
                              <th className="py-2 px-3">NAMA</th>
                              <th className="py-2 px-3">JENIS</th>
                              <th className="py-2 px-3">NOMINAL</th>
                              <th className="py-2 px-3">KETERANGAN</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {previewRows.map((r, i) => (
                              <tr key={i} className="hover:bg-slate-50/60">
                                <td className="py-1.5 px-3 font-mono">{r.TANGGAL || r.Tanggal || '-'}</td>
                                <td className="py-1.5 px-3 font-medium text-slate-900">{r.NAMA || r.Nama || r['Nama Lengkap'] || '-'}</td>
                                <td className="py-1.5 px-3">{r.JENIS || r.Jenis || '-'}</td>
                                <td className="py-1.5 px-3 font-semibold">{r.NOMINAL ?? r.Nominal ?? '-'}</td>
                                <td className="py-1.5 px-3 text-slate-500 truncate max-w-[200px]">{r.KETERANGAN || r.Keterangan || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {importResult ? 'Tutup' : 'Batal'}
          </button>

          {!importResult && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || isProcessing}
              className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-600 text-ink text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Mulai Impor</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
