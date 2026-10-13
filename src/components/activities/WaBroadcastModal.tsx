import React from 'react';
import {
  X,
  MessageCircle,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  PhoneCall,
  Users,
  Filter,
  Trash2,
  Copy,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import type { ActivityItem, WaBroadcastRecipient, WaBroadcastResponse, WaBroadcastStatus } from '../../types/index.ts';
import { api } from '../../services/api.ts';

// ─── Tipe & Konstanta ─────────────────────────────────────────────────────────
type TargetFilter = 'ALL' | 'ALPHA' | 'TELAT' | 'IZIN' | 'SAKIT' | 'HADIR';

const FILTER_OPTIONS: { value: TargetFilter; label: string; color: string }[] = [
  { value: 'ALL', label: 'Semua Peserta', color: 'bg-slate-100 text-slate-800' },
  { value: 'ALPHA', label: 'Alpha Saja', color: 'bg-rose-50 text-rose-700' },
  { value: 'TELAT', label: 'Telat Saja', color: 'bg-amber-50 text-amber-800' },
  { value: 'IZIN', label: 'Izin Saja', color: 'bg-sky-50 text-sky-700' },
  { value: 'SAKIT', label: 'Sakit Saja', color: 'bg-purple-50 text-purple-700' },
  { value: 'HADIR', label: 'Hadir Saja', color: 'bg-emerald-50 text-emerald-700' },
];

const STATUS_CONFIG: Record<WaBroadcastStatus, { label: string; icon: React.ReactNode; cls: string }> = {
  PENDING: {
    label: 'Belum Kirim',
    icon: <Clock className="w-3 h-3" />,
    cls: 'bg-slate-100 text-slate-600 border border-slate-200',
  },
  SENT: {
    label: 'Terkirim',
    icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
    cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  FAILED: {
    label: 'Gagal',
    icon: <XCircle className="w-3 h-3 text-rose-600" />,
    cls: 'bg-rose-50 text-rose-700 border border-rose-200',
  },
  SKIPPED: {
    label: 'Dilewati',
    icon: <AlertTriangle className="w-3 h-3 text-amber-600" />,
    cls: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
};

// ─── Helper ───────────────────────────────────────────────────────────────────
function buildWaLink(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

// ─── Sub-komponen: Baris Penerima ─────────────────────────────────────────────
interface RecipientRowProps {
  recipient: WaBroadcastRecipient;
  idx: number;
  sending: boolean;
  onSend: (r: WaBroadcastRecipient) => void;
  onReset: (r: WaBroadcastRecipient) => void;
  onCopy: (msg: string) => void;
}

const RecipientRow: React.FC<RecipientRowProps> = ({ recipient, idx, sending, onSend, onReset, onCopy }) => {
  const cfg = STATUS_CONFIG[recipient.status] || STATUS_CONFIG.PENDING;

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors group">
      {/* No */}
      <td className="px-3 py-2.5 text-center">
        <span className="text-xs text-slate-400 font-mono">{idx + 1}</span>
      </td>

      {/* Nama & Info */}
      <td className="px-3 py-2.5">
        <div className="font-semibold text-xs text-slate-900 leading-tight">
          {recipient.namaLengkap}
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          {recipient.prn} • {recipient.departmentNama}
        </div>
        {recipient.error && (
          <div className="text-[10px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span>{recipient.error}</span>
          </div>
        )}
      </td>

      {/* Nomor WA */}
      <td className="px-3 py-2.5 hidden md:table-cell">
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <PhoneCall className="w-3 h-3 text-slate-400 flex-shrink-0" />
          <span className="font-mono">+{recipient.phoneNumber}</span>
        </div>
      </td>

      {/* Status Badge */}
      <td className="px-3 py-2.5 text-center">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${cfg.cls}`}>
          {cfg.icon}
          <span>{cfg.label}</span>
        </span>
      </td>

      {/* Aksi */}
      <td className="px-3 py-2.5">
        <div className="flex items-center justify-end gap-1.5">
          {/* Tombol copy pesan */}
          <button
            type="button"
            onClick={() => onCopy(recipient.renderedMessage)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
            title="Salin pesan"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Tombol reset (jika sudah SENT/FAILED) */}
          {recipient.status !== 'PENDING' && (
            <button
              type="button"
              onClick={() => onReset(recipient)}
              disabled={sending}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30 cursor-pointer"
              title="Reset ke belum kirim"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Tombol utama: Kirim Sekarang (Microservice Home Server) */}
          <button
            type="button"
            id={`wa-send-btn-${recipient.id}`}
            onClick={() => onSend(recipient)}
            disabled={sending || recipient.status === 'SENT' || recipient.status === 'SKIPPED'}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold
              transition-all duration-150 whitespace-nowrap
              ${recipient.status === 'SENT'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                : recipient.status === 'SKIPPED'
                ? 'bg-slate-100 text-slate-600 border border-slate-200 cursor-default'
                : recipient.status === 'FAILED'
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
                : 'bg-brand hover:bg-brand-700 text-white shadow-2xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
              }
            `}
          >
            {recipient.status === 'SENT' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Terkirim</span>
              </>
            ) : sending ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Mengirim...</span>
              </>
            ) : recipient.status === 'SKIPPED' ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
                <span>Dilewati</span>
              </>
            ) : recipient.status === 'FAILED' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Kirim Ulang</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Sekarang</span>
              </>
            )}
          </button>
        </div>
      </td>
    </tr>
  );
};

// ─── Komponen Utama: WaBroadcastModal ────────────────────────────────────────
interface WaBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityItem;
}

export const WaBroadcastModal: React.FC<WaBroadcastModalProps> = ({ isOpen, onClose, activity }) => {
  // State
  const [broadcastData, setBroadcastData] = React.useState<WaBroadcastResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [sendingRecipientId, setSendingRecipientId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Form state
  const [targetFilter, setTargetFilter] = React.useState<TargetFilter>('ALL');
  const [customTemplate, setCustomTemplate] = React.useState('');
  const [showTemplateEditor, setShowTemplateEditor] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showFilterMenu, setShowFilterMenu] = React.useState(false);

  // Filtered recipients
  const recipients = broadcastData?.recipients ?? [];
  const filteredRecipients = React.useMemo(() => {
    if (!searchQuery.trim()) return recipients;
    const q = searchQuery.toLowerCase();
    return recipients.filter(
      (r) =>
        r.namaLengkap.toLowerCase().includes(q) ||
        r.prn.toLowerCase().includes(q) ||
        r.departmentNama.toLowerCase().includes(q)
    );
  }, [recipients, searchQuery]);

  const summary = broadcastData?.broadcast?.summary;

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch data broadcast ──────────────────────────────────────────────────
  const fetchBroadcast = React.useCallback(async () => {
    if (!activity?.id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.getWaBroadcast(activity.id);
      if (res.success) {
        setBroadcastData(res.data);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data broadcast';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [activity?.id]);

  React.useEffect(() => {
    if (isOpen && activity?.id) {
      fetchBroadcast();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activity?.id]);

  // ── Buat / Reset broadcast ────────────────────────────────────────────────
  const handleCreate = async () => {
    try {
      setCreating(true);
      setError(null);
      const res = await api.createWaBroadcast({
        activityId: activity.id,
        targetFilter,
        messageTemplate: customTemplate.trim() || undefined,
      });

      if (res.success) {
        showToast(`✅ ${res.message}`, 'success');
        if (res.data.invalidPhoneWarnings?.length) {
          showToast(
            `⚠️ ${res.data.invalidPhoneWarnings.length} nomor tidak valid: ${res.data.invalidPhoneWarnings.slice(0, 3).join(', ')}`,
            'info'
          );
        }
        await fetchBroadcast();
        setShowTemplateEditor(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat broadcast';
      setError(msg);
      showToast(`❌ ${msg}`, 'error');
    } finally {
      setCreating(false);
    }
  };

  // ── Klik tombol "Kirim Sekarang" (Microservice Home Server) ────────────────
  const handleSend = async (recipient: WaBroadcastRecipient) => {
    if (sendingRecipientId || !broadcastData?.broadcast?.id) return;

    try {
      setSendingRecipientId(recipient.id);
      const res = await api.sendWaBroadcastSingle(
        broadcastData.broadcast.id,
        recipient.userId
      );

      if (res.success) {
        showToast(`✅ Pesan berhasil dikirim ke ${recipient.namaLengkap}!`, 'success');
        setBroadcastData((prev) => {
          if (!prev) return prev;
          const updatedRecipients = prev.recipients.map((r) =>
            r.id === recipient.id
              ? {
                  ...r,
                  status: 'SENT' as WaBroadcastStatus,
                  error: null,
                  sentAt: new Date().toISOString(),
                }
              : r
          );
          return {
            ...prev,
            recipients: updatedRecipients,
            broadcast: prev.broadcast
              ? { ...prev.broadcast, summary: computeSummary(updatedRecipients) }
              : prev.broadcast,
          };
        });
      } else {
        const errMsg = res.message || res.error || 'Gagal mengirim pesan via Bot WA';
        showToast(`❌ ${errMsg}`, 'error');
        setBroadcastData((prev) => {
          if (!prev) return prev;
          const updatedRecipients = prev.recipients.map((r) =>
            r.id === recipient.id
              ? { ...r, status: 'FAILED' as WaBroadcastStatus, error: errMsg }
              : r
          );
          return {
            ...prev,
            recipients: updatedRecipients,
            broadcast: prev.broadcast
              ? { ...prev.broadcast, summary: computeSummary(updatedRecipients) }
              : prev.broadcast,
          };
        });
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Koneksi ke bot WhatsApp terputus';
      showToast(`❌ ${errMsg}`, 'error');
      setBroadcastData((prev) => {
        if (!prev) return prev;
        const updatedRecipients = prev.recipients.map((r) =>
          r.id === recipient.id
            ? { ...r, status: 'FAILED' as WaBroadcastStatus, error: errMsg }
            : r
        );
        return {
          ...prev,
          recipients: updatedRecipients,
          broadcast: prev.broadcast
            ? { ...prev.broadcast, summary: computeSummary(updatedRecipients) }
            : prev.broadcast,
        };
      });
    } finally {
      setSendingRecipientId(null);
    }
  };

  // ── Reset satu penerima ───────────────────────────────────────────────────
  const handleReset = async (recipient: WaBroadcastRecipient) => {
    try {
      await api.resetWaRecipient(recipient.id);
      setBroadcastData((prev) => {
        if (!prev) return prev;
        const updatedRecipients = prev.recipients.map((r) =>
          r.id === recipient.id ? { ...r, status: 'PENDING' as WaBroadcastStatus, sentAt: null } : r
        );
        return {
          ...prev,
          recipients: updatedRecipients,
          broadcast: prev.broadcast
            ? { ...prev.broadcast, summary: computeSummary(updatedRecipients) }
            : prev.broadcast,
        };
      });
      showToast('Status direset ke Belum Kirim', 'info');
    } catch {
      showToast('Gagal mereset status', 'error');
    }
  };

  // ── Copy pesan ke clipboard ───────────────────────────────────────────────
  const handleCopy = async (msg: string) => {
    try {
      await navigator.clipboard.writeText(msg);
      showToast('Pesan disalin ke clipboard 📋', 'info');
    } catch {
      showToast('Gagal menyalin', 'error');
    }
  };

  // ── Hapus broadcast ───────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus broadcast ini? Data status pengiriman akan hilang.')) return;
    try {
      await api.deleteWaBroadcast(activity.id);
      setBroadcastData((prev) => (prev ? { ...prev, broadcast: null, recipients: [] } : prev));
      showToast('Broadcast dihapus', 'info');
    } catch {
      showToast('Gagal menghapus broadcast', 'error');
    }
  };

  if (!isOpen) return null;

  const hasBroadcast = broadcastData?.broadcast !== null && (broadcastData?.recipients?.length ?? 0) > 0;
  const selectedFilter = FILTER_OPTIONS.find((f) => f.value === targetFilter)!;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Modal WA Broadcast"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-4xl bg-surface rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200/80">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-surface flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200/80 flex items-center justify-center text-brand shadow-2xs">
              <MessageCircle className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                Broadcast WhatsApp
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md">
                {activity.nama}
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

        {/* ── Toast ─────────────────────────────────────────────────────── */}
        {toast && (
          <div
            className={`mx-6 mt-4 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-brand-50 text-brand-800 border-brand-200'
            }`}
          >
            {toast.msg}
          </div>
        )}

        {/* ── Body: Scrollable ──────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mb-3 text-brand" />
              <p className="text-sm font-medium text-slate-600">Memuat data broadcast...</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="mx-6 mt-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-rose-800">{error}</p>
                <button
                  onClick={fetchBroadcast}
                  className="mt-2 text-xs text-rose-700 underline font-semibold hover:no-underline cursor-pointer"
                >
                  Coba lagi
                </button>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="px-6 py-5 space-y-5">

              {/* ── Setup Panel (muncul saat belum ada broadcast atau ingin reset) ── */}
              {(!hasBroadcast || showTemplateEditor) && (
                <div className="bg-slate-50 rounded-xl p-5 space-y-4 border border-slate-200/80">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-brand" />
                    <span>{hasBroadcast ? 'Reset & Buat Ulang Broadcast' : 'Siapkan Broadcast'}</span>
                  </h3>

                  {/* Filter penerima */}
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1.5">
                      Target Penerima
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${selectedFilter.color} border-slate-200 cursor-pointer`}
                      >
                        <span>{selectedFilter.label}</span>
                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
                      </button>
                      {showFilterMenu && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-surface rounded-xl shadow-lg border border-slate-200 overflow-hidden z-20">
                          {FILTER_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => { setTargetFilter(opt.value); setShowFilterMenu(false); }}
                              className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold transition-colors hover:bg-slate-100 cursor-pointer ${opt.color} ${targetFilter === opt.value ? 'ring-2 ring-inset ring-brand' : ''}`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Template editor (opsional) */}
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1.5">
                      Template Pesan{' '}
                      <span className="text-slate-400 font-normal">(opsional — kosongkan untuk default)</span>
                    </label>
                    <textarea
                      rows={6}
                      value={customTemplate}
                      onChange={(e) => setCustomTemplate(e.target.value)}
                      placeholder={
                        'Halo, {{nama}} 👋\n\n📌 *Kegiatan:* {{namaKegiatan}}\n📅 *Tanggal:* {{tanggalKegiatan}}\n📍 *Lokasi:* {{lokasi}}\n✅ *Status:* {{status}}'
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-surface text-xs text-slate-800 placeholder-slate-400 font-mono resize-none focus:outline-hidden focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                    />
                    <p className="mt-1.5 text-[11px] text-slate-500 flex flex-wrap items-center gap-1">
                      <span>Variabel:</span>
                      <code className="bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">{'{{nama}}'}</code>
                      <code className="bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">{'{{namaKegiatan}}'}</code>
                      <code className="bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">{'{{tanggalKegiatan}}'}</code>
                      <code className="bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">{'{{lokasi}}'}</code>
                      <code className="bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">{'{{status}}'}</code>
                    </p>
                  </div>

                  {/* Aksi */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={creating}
                      className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-600 text-ink rounded-lg text-xs font-bold shadow-2xs transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {creating ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-ink" />
                      ) : (
                        <MessageCircle className="w-3.5 h-3.5 text-ink" />
                      )}
                      <span>{creating ? 'Menyiapkan...' : hasBroadcast ? 'Reset & Buat Ulang' : 'Siapkan Broadcast'}</span>
                    </button>
                    {hasBroadcast && (
                      <button
                        type="button"
                        onClick={() => setShowTemplateEditor(false)}
                        className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── Summary Stats ──────────────────────────────────────────────── */}
              {hasBroadcast && summary && (
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Total', val: summary.total, cls: 'bg-slate-50 text-slate-800 border-slate-200', icon: <Users className="w-4 h-4 text-slate-500" /> },
                    { label: 'Terkirim', val: summary.sent, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" /> },
                    { label: 'Belum', val: summary.pending, cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="w-4 h-4 text-amber-600" /> },
                    { label: 'Gagal', val: summary.failed, cls: 'bg-rose-50 text-rose-700 border-rose-200', icon: <XCircle className="w-4 h-4 text-rose-600" /> },
                  ].map((s) => (
                    <div key={s.label} className={`flex flex-col items-center justify-center p-3 rounded-xl border ${s.cls}`}>
                      {s.icon}
                      <span className="text-2xl font-bold mt-1 tracking-tight tabular-nums">{s.val}</span>
                      <span className="text-[11px] font-medium mt-0.5 opacity-80">{s.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Progress bar */}
              {hasBroadcast && summary && summary.total > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-slate-500 font-medium mb-1.5">
                    <span>Progress Pengiriman</span>
                    <span className="tabular-nums font-semibold">{Math.round((summary.sent / summary.total) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all duration-500"
                      style={{ width: `${(summary.sent / summary.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* ── Tabel Penerima ─────────────────────────────────────────────── */}
              {hasBroadcast && (
                <div>
                  {/* Toolbar tabel */}
                  <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                      <input
                        type="search"
                        placeholder="Cari nama, PRN, departemen..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-surface text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                      />
                      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowTemplateEditor(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Buat Ulang</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>

                  {/* Tabel */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-surface shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500 w-10">#</th>
                            <th className="px-3 py-2.5 text-xs font-semibold text-slate-600">Anggota</th>
                            <th className="px-3 py-2.5 text-xs font-semibold text-slate-600 hidden md:table-cell">Nomor WA</th>
                            <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-600">Status</th>
                            <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="bg-surface divide-y divide-slate-100">
                          {filteredRecipients.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-3 py-10 text-center text-slate-400 text-xs font-medium">
                                {searchQuery ? 'Tidak ada penerima yang cocok dengan pencarian.' : 'Tidak ada penerima.'}
                              </td>
                            </tr>
                          ) : (
                            filteredRecipients.map((r, idx) => (
                              <RecipientRow
                                key={r.id}
                                recipient={r}
                                idx={idx}
                                sending={sendingRecipientId === r.id}
                                onSend={handleSend}
                                onReset={handleReset}
                                onCopy={handleCopy}
                              />
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-2 text-right">
                    Menampilkan <span className="font-semibold">{filteredRecipients.length}</span> dari <span className="font-semibold">{recipients.length}</span> penerima
                  </p>
                </div>
              )}

              {/* ── Empty state: belum ada broadcast ─────────────────────── */}
              {!hasBroadcast && !showTemplateEditor && !loading && (
                <div className="text-center py-10">
                  <div className="w-14 h-14 bg-brand-50 border border-brand-200/80 rounded-2xl flex items-center justify-center mx-auto mb-3.5 text-brand shadow-2xs">
                    <Send className="w-6 h-6" />
                  </div>
                  <p className="text-slate-800 font-semibold text-sm">
                    Broadcast belum disiapkan untuk kegiatan ini.
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    Pastikan presensi sudah dicatat sebelum membuat broadcast.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200/80 bg-slate-50/70 flex-shrink-0">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-brand" />
            <span>Klik <strong className="text-slate-800 font-semibold">Kirim Sekarang</strong> untuk mengirim pesan via Bot WhatsApp</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Helper: hitung ulang summary dari recipients ─────────────────────────────
function computeSummary(recipients: WaBroadcastRecipient[]) {
  return {
    total: recipients.length,
    sent: recipients.filter((r) => r.status === 'SENT').length,
    pending: recipients.filter((r) => r.status === 'PENDING').length,
    failed: recipients.filter((r) => r.status === 'FAILED').length,
  };
}

export default WaBroadcastModal;
