import React, { useState } from 'react';
import { X, CalendarPlus, MapPin, Video, Globe } from 'lucide-react';
import type { ActivityItem } from '../../types/index.ts';

interface CreateActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<ActivityItem, 'id' | 'attendanceSummary'>) => Promise<void>;
  creatorId: string;
  creatorName: string;
}

export const CreateActivityModal: React.FC<CreateActivityModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  creatorId,
  creatorName,
}) => {
  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [mode, setMode] = useState<'OFFLINE' | 'ONLINE'>('OFFLINE');
  const [lokasi, setLokasi] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [activityDate, setActivityDate] = useState('2026-04-01');
  const [activityHour, setActivityHour] = useState('09');
  const [activityMinute, setActivityMinute] = useState('00');
  const [isPublished, setIsPublished] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!nama.trim()) {
      setErrorMessage('Nama kegiatan wajib diisi');
      return;
    }

    if (mode === 'OFFLINE' && !lokasi.trim()) {
      setErrorMessage('Lokasi kegiatan wajib diisi untuk kegiatan offline');
      return;
    }

    if (mode === 'ONLINE' && meetingUrl.trim()) {
      const urlPattern = /^https?:\/\/.+/i;
      if (!urlPattern.test(meetingUrl.trim())) {
        setErrorMessage('Link meeting harus diawali dengan http:// atau https://');
        return;
      }
    }

    setLoading(true);
    try {
      const start = new Date(`${activityDate}T${activityHour}:${activityMinute}:00+08:00`);
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // Default 2 jam kegiatan
      await onSubmit({
        nama: nama.trim(),
        deskripsi: deskripsi.trim() || null,
        mode,
        lokasi: mode === 'OFFLINE' ? lokasi.trim() : null,
        meetingUrl: mode === 'ONLINE' && meetingUrl.trim() ? meetingUrl.trim() : null,
        isLocked: false,
        startDate: start,
        endDate: end,
        isPublished,
        createdBy: creatorId,
        creatorName,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal membuat kegiatan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-200 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-slate-800" />
            <h2 className="text-base font-bold text-slate-900">Tambah Kegiatan</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kegiatan *</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Rapat Pleno Evaluasi"
              required
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[40px]"
            />
          </div>

          {/* Mode Pelaksanaan Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Mode Pelaksanaan *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('OFFLINE')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'OFFLINE'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Offline</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('ONLINE')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'ONLINE'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Online</span>
              </button>
            </div>
          </div>

          {/* Conditional Inputs based on Mode */}
          {mode === 'OFFLINE' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lokasi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={lokasi}
                  onChange={(e) => setLokasi(e.target.value)}
                  placeholder="Ruang Sidang / Gedung PKM"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[40px]"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Link Meeting <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="url"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  placeholder="https://zoom.us/j/... atau https://meet.google.com/..."
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[40px]"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Kegiatan *
              </label>
              <input
                type="date"
                value={activityDate}
                onChange={(e) => setActivityDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[40px] bg-white cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Waktu Pelaksanaan *
              </label>
              <div className="flex items-center gap-1.5">
                <select
                  value={activityHour}
                  onChange={(e) => setActivityHour(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[40px] bg-white font-medium cursor-pointer"
                >
                  {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <span className="font-bold text-slate-400">:</span>
                <select
                  value={activityMinute}
                  onChange={(e) => setActivityMinute(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[40px] bg-white font-medium cursor-pointer"
                >
                  {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi</label>
            <textarea
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              rows={3}
              placeholder="Deskripsi atau agenda kegiatan..."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="isPublished"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="isPublished" className="text-xs font-medium text-slate-700 cursor-pointer">
              Publikasikan ke kalender kegiatan
            </label>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg min-h-[42px] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-50 min-h-[42px] shadow-xs cursor-pointer"
            >
              {loading ? 'Menyimpan...' : 'Simpan Kegiatan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
