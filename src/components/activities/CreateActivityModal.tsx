import React, { useState } from 'react';
import { X, CalendarPlus } from 'lucide-react';
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
  const [jenis, setJenis] = useState('RAPAT_PLENO');
  const [startDate, setStartDate] = useState('2026-04-01T09:00');
  const [endDate, setEndDate] = useState('2026-04-01T12:00');
  const [isPublished, setIsPublished] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;
    setLoading(true);
    await onSubmit({
      nama: nama.trim(),
      deskripsi: deskripsi.trim() || null,
      jenis,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isPublished,
      createdBy: creatorId,
      creatorName,
    });
    setLoading(false);
    onClose();
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kegiatan *</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Nama kegiatan proker"
              required
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[40px]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kegiatan *</label>
            <select
              value={jenis}
              onChange={(e) => setJenis(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[40px]"
            >
              <option value="RAPAT_PLENO">Rapat Pleno</option>
              <option value="UPGRADING">Upgrading</option>
              <option value="PROKER_DEPARTEMEN">Proker Departemen</option>
              <option value="BRIEFING_INTERNAL">Briefing Internal</option>
              <option value="EVALUASI_BULANAN">Evaluasi Bulanan</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mulai *</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 min-h-[40px]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Selesai *</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 min-h-[40px]"
              />
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
              Publikasikan ke kalender
            </label>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg min-h-[42px]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-50 min-h-[42px] shadow-xs"
            >
              {loading ? 'Menyimpan...' : 'Buat Kegiatan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
