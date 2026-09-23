import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  Check,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type { ActivityItem, AuthUser, AttendanceStatus } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useToast } from '../ui/Toast.tsx';
import { broadcastRealtimeEvent } from '../../utils/realtime.ts';

interface AttendanceImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity?: ActivityItem | null;
  activities?: ActivityItem[];
  users: AuthUser[];
  onSuccess: () => void;
}

interface ParsedAttendanceRow {
  rowNum: number;
  rawIdentifier: string;
  rawName: string;
  rawStatus: string;
  rawNotes?: string;
  matchedUser: AuthUser | null;
  status: AttendanceStatus;
  isValid: boolean;
  errorReason?: string;
}

export const AttendanceImportModal: React.FC<AttendanceImportModalProps> = ({
  isOpen,
  onClose,
  activity,
  activities = [],
  users,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedActivityId, setSelectedActivityId] = useState<string>(
    activity?.id || (activities.length > 0 ? activities[0].id : '')
  );

  React.useEffect(() => {
    if (activity?.id) {
      setSelectedActivityId(activity.id);
    } else if (activities.length > 0 && !selectedActivityId) {
      setSelectedActivityId(activities[0].id);
    }
  }, [activity, activities, isOpen]);

  const targetActivity = activity || activities.find((a) => a.id === selectedActivityId) || null;

  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedAttendanceRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [searchPreview, setSearchPreview] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'VALID' | 'INVALID'>('ALL');
  const [importResult, setImportResult] = useState<{
    successCount: number;
    skippedCount: number;
  } | null>(null);

  if (!isOpen) return null;

  // 1. Download template Excel presensi (hanya field: PRN, Nama, Status Presensi, Catatan)
  const handleDownloadTemplate = () => {
    let templateData: any[] = [];

    if (users && users.length > 0) {
      templateData = users.map((u) => ({
        PRN: u.prn,
        Nama: u.namaLengkap,
        'Status Presensi': 'HADIR',
        Catatan: '',
      }));
    } else {
      templateData = [
        {
          PRN: 'PRN0001',
          Nama: 'Nama Pengurus 1',
          'Status Presensi': 'HADIR',
          Catatan: '',
        },
        {
          PRN: 'PRN0002',
          Nama: 'Nama Pengurus 2',
          'Status Presensi': 'IZIN',
          Catatan: 'Izin kegiatan',
        },
      ];
    }

    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Styling column widths: PRN, Nama, Status Presensi, Catatan
    worksheet['!cols'] = [
      { wch: 18 }, // PRN
      { wch: 28 }, // Nama
      { wch: 18 }, // Status Presensi
      { wch: 25 }, // Catatan
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Presensi');

    const cleanActName = (targetActivity?.nama || 'kegiatan').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    XLSX.writeFile(workbook, `Template_Presensi_${cleanActName}.xlsx`);
    showToast('Template presensi berhasil diunduh', 'success');
  };

  // Helper normalisasi status
  const parseStatusString = (raw: any): AttendanceStatus => {
    if (!raw) return 'HADIR';
    const s = String(raw).trim().toUpperCase();

    if (s === 'H' || s === 'HADIR' || s === '1' || s === 'V' || s === 'YA') return 'HADIR';
    if (s === 'I' || s === 'IZIN' || s === 'IJIN') return 'IZIN';
    if (s === 'S' || s === 'SAKIT') return 'SAKIT';
    if (s === 'A' || s === 'ALPHA' || s === 'ALFA' || s === 'ALPA' || s === '-' || s === '0' || s === 'TIDAK') return 'ALPHA';
    if (s === 'T' || s === 'TELAT' || s === 'TERLAMBAT') return 'TELAT';

    return 'HADIR';
  };

  // 2. Parse file Excel/CSV yang diunggah
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorText(null);
    setImportResult(null);
    setIsProcessing(true);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

      if (!rawJson || rawJson.length === 0) {
        throw new Error('Berkas kosong atau tidak memiliki data.');
      }

      // Pre-create index user untuk pencocokan instan O(1)
      const userByPrn = new Map<string, AuthUser>();
      const userByNim = new Map<string, AuthUser>();
      const userByName = new Map<string, AuthUser>();

      for (const u of users) {
        if (u.prn) userByPrn.set(u.prn.trim().toLowerCase(), u);
        if (u.nim) userByNim.set(u.nim.trim().toLowerCase(), u);
        if (u.namaLengkap) userByName.set(u.namaLengkap.trim().toLowerCase(), u);
      }

      const parsed: ParsedAttendanceRow[] = [];

      rawJson.forEach((row, idx) => {
        let prnVal = '';
        let nimVal = '';
        let nameVal = '';
        let statusVal = '';
        let catatanVal = '';

        for (const [k, v] of Object.entries(row)) {
          const keyLower = k.trim().toLowerCase();
          if (/^prn|stambuk|username|user_id|id_pengurus/.test(keyLower)) {
            prnVal = String(v).trim();
          } else if (/^nim|no_induk/.test(keyLower)) {
            nimVal = String(v).trim();
          } else if (/^nama|name|pengurus|anggota/.test(keyLower)) {
            nameVal = String(v).trim();
          } else if (/status|presensi|kehadiran/.test(keyLower)) {
            statusVal = String(v).trim();
          } else if (/catatan|keterangan|notes|alasan/.test(keyLower)) {
            catatanVal = String(v).trim();
          }
        }

        // Fallback jika header tidak standar
        if (!prnVal && !nimVal && !nameVal) {
          const values = Object.values(row).map((val) => String(val).trim());
          if (values.length >= 2) {
            prnVal = values[0] || '';
            nameVal = values[1] || '';
            statusVal = values[2] || '';
            catatanVal = values[3] || '';
          }
        }

        // Abaikan baris kosong
        if (!prnVal && !nimVal && !nameVal) return;

        // Pencocokan berjenjang: PRN -> NIM -> Nama Lengkap
        let matched: AuthUser | null = null;
        if (prnVal && userByPrn.has(prnVal.toLowerCase())) {
          matched = userByPrn.get(prnVal.toLowerCase())!;
        } else if (nimVal && userByNim.has(nimVal.toLowerCase())) {
          matched = userByNim.get(nimVal.toLowerCase())!;
        } else if (nameVal && userByName.has(nameVal.toLowerCase())) {
          matched = userByName.get(nameVal.toLowerCase())!;
        }

        const normalizedStatus = parseStatusString(statusVal);
        const isValid = !!matched;

        parsed.push({
          rowNum: idx + 2, // Excel 1-based + header
          rawIdentifier: prnVal || nimVal || '-',
          rawName: nameVal || (matched ? matched.namaLengkap : '-'),
          rawStatus: statusVal || 'HADIR',
          rawNotes: catatanVal || '',
          matchedUser: matched,
          status: normalizedStatus,
          isValid,
          errorReason: isValid ? undefined : 'Anggota tidak ditemukan',
        });
      });

      if (parsed.length === 0) {
        throw new Error('Tidak ada data yang dapat dibaca dari berkas ini.');
      }

      setParsedRows(parsed);
    } catch (err: any) {
      setErrorText(err.message || 'Gagal membaca berkas.');
      setParsedRows([]);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 3. Simpan ke database via batch attendance endpoint
  const handleExecuteImport = async () => {
    const validItems = parsedRows
      .filter((r) => r.isValid && r.matchedUser)
      .map((r) => ({
        userId: r.matchedUser!.id,
        status: r.status,
      }));

    if (!targetActivity) {
      showToast('Pilih kegiatan terlebih dahulu untuk mengimpor presensi.', 'info');
      return;
    }

    try {
      setIsSaving(true);
      await api.recordBatchAttendance(targetActivity.id, validItems);
      broadcastRealtimeEvent('ATTENDANCE_CHANGED');
      onSuccess();

      const successCount = validItems.length;
      const skippedCount = parsedRows.length - successCount;

      setImportResult({ successCount, skippedCount });
      showToast(`Berhasil mengimpor ${successCount} data presensi!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan presensi ke database.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFileName(null);
    setParsedRows([]);
    setErrorText(null);
    setImportResult(null);
  };

  // Statistik baris ter-parse
  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;
  const statusStats = {
    HADIR: parsedRows.filter((r) => r.isValid && r.status === 'HADIR').length,
    IZIN: parsedRows.filter((r) => r.isValid && r.status === 'IZIN').length,
    SAKIT: parsedRows.filter((r) => r.isValid && r.status === 'SAKIT').length,
    ALPHA: parsedRows.filter((r) => r.isValid && r.status === 'ALPHA').length,
    TELAT: parsedRows.filter((r) => r.isValid && r.status === 'TELAT').length,
  };

  const filteredDisplayRows = parsedRows.filter((row) => {
    if (filterTab === 'VALID' && !row.isValid) return false;
    if (filterTab === 'INVALID' && row.isValid) return false;

    if (!searchPreview.trim()) return true;
    const q = searchPreview.toLowerCase();
    return (
      row.rawName.toLowerCase().includes(q) ||
      row.rawIdentifier.toLowerCase().includes(q) ||
      row.status.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (st: AttendanceStatus) => {
    switch (st) {
      case 'HADIR':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">HADIR</span>;
      case 'IZIN':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">IZIN</span>;
      case 'SAKIT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">SAKIT</span>;
      case 'ALPHA':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">ALPHA</span>;
      case 'TELAT':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">TELAT</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Import Presensi
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {targetActivity ? (
                    <>
                      Kegiatan: <span className="font-semibold text-slate-700">{targetActivity.nama}</span>
                    </>
                  ) : (
                    'Unggah berkas presensi kegiatan'
                  )}
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {!activity && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Pilih Kegiatan</label>
              {activities.length > 0 ? (
                <select
                  value={selectedActivityId}
                  onChange={(e) => setSelectedActivityId(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  {activities.map((act) => (
                    <option key={act.id} value={act.id}>
                      {act.nama} ({new Date(act.startDate).toLocaleDateString('id-ID', { timeZone: 'Asia/Makassar' })})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  Belum ada agenda kegiatan. Buat kegiatan baru terlebih dahulu.
                </div>
              )}
            </div>
          )}

          {/* Step 1 & 2: Belum ada file yang di-parse */}
          {parsedRows.length === 0 && !importResult && (
            <div className="space-y-4">
              {/* Petunjuk & Download Template */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      1. Unduh Template
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Format kolom: <span className="font-semibold text-slate-700">PRN, Nama, Status Presensi, Catatan</span>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold shrink-0 cursor-pointer shadow-2xs transition-all active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Unduh Template .xlsx</span>
                  </button>
                </div>

                <div className="bg-white rounded-lg p-2 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Status:</span>
                  <span>HADIR</span>
                  <span>•</span>
                  <span>IZIN</span>
                  <span>•</span>
                  <span>SAKIT</span>
                  <span>•</span>
                  <span>ALPHA</span>
                  <span>•</span>
                  <span>TELAT</span>
                </div>
              </div>

              {/* Upload Box */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  2. Unggah Berkas
                </h3>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5"
                >
                  <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-indigo-600">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-semibold text-slate-700">
                    Pilih berkas atau seret ke sini
                  </div>
                  <p className="text-[11px] text-slate-400">Mendukung .xlsx, .xls, .csv</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {isProcessing && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-600 animate-pulse">
                  Memproses berkas...
                </div>
              )}

              {errorText && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorText}</span>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Preview Hasil Parsing */}
          {parsedRows.length > 0 && !importResult && (
            <div className="space-y-3">
              {/* Ringkasan Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-700">Berkas:</span>
                  <span className="font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 truncate max-w-[200px]">
                    {fileName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Ganti Berkas</span>
                </button>
              </div>

              {/* Metrik Statistik */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-2.5">
                  <span className="text-[10px] text-emerald-700 font-bold block">VALID</span>
                  <span className="text-lg font-bold text-emerald-900">{validCount}</span>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">Siap diimpor</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                  <span className="text-[10px] text-slate-600 font-bold block">HADIR</span>
                  <span className="text-lg font-bold text-slate-900">{statusStats.HADIR}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Pengurus</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                  <span className="text-[10px] text-slate-600 font-bold block">IZIN / SAKIT</span>
                  <span className="text-lg font-bold text-slate-900">{statusStats.IZIN + statusStats.SAKIT}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Pengurus</span>
                </div>
                <div className={`${invalidCount > 0 ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-lg p-2.5`}>
                  <span className="text-[10px] font-bold block">TIDAK VALID</span>
                  <span className="text-lg font-bold">{invalidCount}</span>
                  <span className="text-[10px] opacity-75 block mt-0.5">Dilewati</span>
                </div>
              </div>

              {/* Filter Tabs & Search Preview */}
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between pt-1">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setFilterTab('ALL')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      filterTab === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semua ({parsedRows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('VALID')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      filterTab === 'VALID' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Valid ({validCount})
                  </button>
                  {invalidCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterTab('INVALID')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        filterTab === 'INVALID' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Bermasalah ({invalidCount})
                    </button>
                  )}
                </div>

                <div className="relative w-full sm:w-56">
                  <input
                    type="text"
                    value={searchPreview}
                    onChange={(e) => setSearchPreview(e.target.value)}
                    placeholder="Cari..."
                    className="w-full pl-7 pr-3 py-1 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                </div>
              </div>

              {/* Preview Table: Kolom PRN, Nama, Status Presensi, Catatan */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 sticky top-0 border-b border-slate-200 z-10">
                    <tr>
                      <th className="py-2 px-3 font-semibold w-12">Baris</th>
                      <th className="py-2 px-3 font-semibold">PRN</th>
                      <th className="py-2 px-3 font-semibold">Nama</th>
                      <th className="py-2 px-3 font-semibold">Status Presensi</th>
                      <th className="py-2 px-3 font-semibold">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDisplayRows.map((row) => (
                      <tr
                        key={row.rowNum}
                        className={row.isValid ? 'hover:bg-slate-50/80' : 'bg-rose-50/40 hover:bg-rose-50/70'}
                      >
                        <td className="py-2 px-3 font-mono text-slate-400">{row.rowNum}</td>
                        <td className="py-2 px-3 font-mono text-slate-700">
                          {row.matchedUser ? row.matchedUser.prn : row.rawIdentifier}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-900">
                          {row.matchedUser ? (
                            <span>{row.matchedUser.namaLengkap}</span>
                          ) : (
                            <span className="text-rose-600 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>{row.rawName}</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          {row.isValid ? (
                            getStatusBadge(row.status)
                          ) : (
                            <span className="text-[10px] text-rose-600 font-medium">
                              Tidak Ditemukan
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-500 max-w-[150px] truncate">
                          {row.rawNotes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 3: Hasil Berhasil */}
          {importResult && (
            <div className="p-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Presensi Berhasil Diimpor</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                <strong className="text-emerald-700 font-bold">{importResult.successCount}</strong> data presensi berhasil disimpan.
                {importResult.skippedCount > 0 && (
                  <span className="block mt-1 text-slate-400">
                    ({importResult.skippedCount} baris tidak valid dilewati).
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          {importResult ? (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer shadow-xs"
            >
              Selesai & Tutup
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                Batal
              </button>

              {parsedRows.length > 0 && (
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={isSaving || validCount === 0}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Menyimpan...' : `Simpan ${validCount} Presensi`}</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
