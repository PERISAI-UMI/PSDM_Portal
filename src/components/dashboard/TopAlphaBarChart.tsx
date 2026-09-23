import React, { useState } from 'react';
import { BarChart3, ShieldAlert, CheckCircle2, AlignLeft, BarChart2, Users } from 'lucide-react';

export type AttendanceCategory = 'ALPHA' | 'HADIR' | 'TELAT' | 'IZIN' | 'SAKIT';

export interface AlphaMemberStat {
  userId: string;
  nama: string;
  prn?: string;
  dept?: string;
  hadir: number;
  telat: number;
  izin: number;
  sakit: number;
  alpa: number;
  totalKegiatan: number;
}

interface TopAlphaBarChartProps {
  data: AlphaMemberStat[];
  onNavigateToMembers?: () => void;
}

interface CategoryConfig {
  key: AttendanceCategory;
  label: string;
  field: 'alpa' | 'hadir' | 'telat' | 'izin' | 'sakit';
  title: string;
  subtitle: string;
  unit: string;
  footerNote: string;
  iconColor: string;
  activePillClass: string;
  barColors: {
    rank1: string;
    rank2: string;
    rankRest: string;
  };
  hoverBorder: string;
  hoverText: string;
  breakdownBadge: string;
  breakdownBar: string;
  emptyTitle: string;
  emptySubtitle: string;
}

const CATEGORIES: Record<AttendanceCategory, CategoryConfig> = {
  ALPHA: {
    key: 'ALPHA',
    label: 'Alpa',
    field: 'alpa',
    title: 'Top 10 Pengurus dengan Alpa Terbanyak',
    subtitle: 'Monitoring akumulasi ketidakhadiran tanpa keterangan untuk bahan evaluasi kedisiplinan fungsionaris.',
    unit: 'Alpa',
    footerNote: 'Fungsionaris dengan alpa tinggi dapat ditindaklanjuti untuk surat peringatan (SP) atau pembinaan.',
    iconColor: 'text-rose-600',
    activePillClass: 'bg-rose-50 text-rose-700 border-rose-300 font-semibold shadow-2xs',
    barColors: {
      rank1: 'bg-gradient-to-t from-rose-600 via-rose-500 to-rose-400',
      rank2: 'bg-gradient-to-t from-rose-500 via-rose-500 to-rose-400',
      rankRest: 'bg-gradient-to-t from-rose-400 via-rose-400 to-rose-300',
    },
    hoverBorder: 'ring-rose-400/40',
    hoverText: 'text-rose-700',
    breakdownBadge: 'text-rose-700 bg-rose-50 border-rose-200/90',
    breakdownBar: 'bg-rose-500',
    emptyTitle: 'Kedisiplinan Sempurna',
    emptySubtitle: 'Tidak ditemukan catatan alpa pada fungsionaris. Seluruh presensi terekam hadir, izin, atau sakit.',
  },
  HADIR: {
    key: 'HADIR',
    label: 'Hadir',
    field: 'hadir',
    title: 'Top 10 Pengurus dengan Kehadiran Terbanyak',
    subtitle: 'Apresiasi fungsionaris dengan partisipasi dan komitmen kehadiran kegiatan tertinggi.',
    unit: 'Hadir',
    footerNote: 'Fungsionaris teladan dapat dipertimbangkan untuk apresiasi atau sertifikasi kepengurusan terbaik.',
    iconColor: 'text-emerald-600',
    activePillClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold shadow-2xs',
    barColors: {
      rank1: 'bg-gradient-to-t from-emerald-600 via-emerald-500 to-emerald-400',
      rank2: 'bg-gradient-to-t from-emerald-500 via-emerald-500 to-emerald-400',
      rankRest: 'bg-gradient-to-t from-emerald-400 via-emerald-400 to-emerald-300',
    },
    hoverBorder: 'ring-emerald-400/40',
    hoverText: 'text-emerald-700',
    breakdownBadge: 'text-emerald-700 bg-emerald-50 border-emerald-200/90',
    breakdownBar: 'bg-emerald-500',
    emptyTitle: 'Belum Ada Presensi Hadir',
    emptySubtitle: 'Belum ada catatan presensi hadir yang tersimpan untuk fungsionaris.',
  },
  TELAT: {
    key: 'TELAT',
    label: 'Telat',
    field: 'telat',
    title: 'Top 10 Pengurus dengan Keterlambatan Terbanyak',
    subtitle: 'Monitoring ketepatan waktu presensi untuk evaluasi efisiensi jadwal kegiatan.',
    unit: 'Telat',
    footerNote: 'Keterlambatan berulang dapat dievaluasi pada sesi review kedisiplinan fungsionaris.',
    iconColor: 'text-amber-600',
    activePillClass: 'bg-amber-50 text-amber-700 border-amber-300 font-semibold shadow-2xs',
    barColors: {
      rank1: 'bg-gradient-to-t from-amber-600 via-amber-500 to-amber-400',
      rank2: 'bg-gradient-to-t from-amber-500 via-amber-500 to-amber-400',
      rankRest: 'bg-gradient-to-t from-amber-400 via-amber-400 to-amber-300',
    },
    hoverBorder: 'ring-amber-400/40',
    hoverText: 'text-amber-700',
    breakdownBadge: 'text-amber-700 bg-amber-50 border-amber-200/90',
    breakdownBar: 'bg-amber-500',
    emptyTitle: 'Waktu Presensi Sangat Tepat',
    emptySubtitle: 'Tidak ditemukan fungsionaris yang hadir terlambat pada kegiatan.',
  },
  IZIN: {
    key: 'IZIN',
    label: 'Izin',
    field: 'izin',
    title: 'Top 10 Pengurus dengan Izin Terbanyak',
    subtitle: 'Rekapitulasi fungsionaris dengan permohonan izin atau dispensasi kegiatan resmi.',
    unit: 'Izin',
    footerNote: 'Fungsionaris dengan izin teratur tetap menjaga tanggung jawab penugasan organisasi.',
    iconColor: 'text-sky-600',
    activePillClass: 'bg-sky-50 text-sky-700 border-sky-300 font-semibold shadow-2xs',
    barColors: {
      rank1: 'bg-gradient-to-t from-sky-600 via-sky-500 to-sky-400',
      rank2: 'bg-gradient-to-t from-sky-500 via-sky-500 to-sky-400',
      rankRest: 'bg-gradient-to-t from-sky-400 via-sky-400 to-sky-300',
    },
    hoverBorder: 'ring-sky-400/40',
    hoverText: 'text-sky-700',
    breakdownBadge: 'text-sky-700 bg-sky-50 border-sky-200/90',
    breakdownBar: 'bg-sky-500',
    emptyTitle: 'Tidak Ada Presensi Izin',
    emptySubtitle: 'Belum ada fungsionaris yang mengajukan permohonan izin pada kegiatan.',
  },
  SAKIT: {
    key: 'SAKIT',
    label: 'Sakit',
    field: 'sakit',
    title: 'Top 10 Pengurus dengan Izin Sakit Terbanyak',
    subtitle: 'Pemantauan kondisi kesehatan fungsionaris untuk koordinasi dan pendampingan internal.',
    unit: 'Sakit',
    footerNote: 'Data kesehatan fungsionaris untuk perhatian tim PSDM dan penyesuaian penugasan.',
    iconColor: 'text-violet-600',
    activePillClass: 'bg-violet-50 text-violet-700 border-violet-300 font-semibold shadow-2xs',
    barColors: {
      rank1: 'bg-gradient-to-t from-violet-600 via-violet-500 to-violet-400',
      rank2: 'bg-gradient-to-t from-violet-500 via-violet-500 to-violet-400',
      rankRest: 'bg-gradient-to-t from-violet-400 via-violet-400 to-violet-300',
    },
    hoverBorder: 'ring-violet-400/40',
    hoverText: 'text-violet-700',
    breakdownBadge: 'text-violet-700 bg-violet-50 border-violet-200/90',
    breakdownBar: 'bg-violet-500',
    emptyTitle: 'Fungsionaris Prima',
    emptySubtitle: 'Tidak tercatat izin sakit pada fungsionaris selama periode kegiatan.',
  },
};

const CATEGORY_LIST: AttendanceCategory[] = ['ALPHA', 'HADIR', 'TELAT', 'IZIN', 'SAKIT'];

export const TopAlphaBarChart: React.FC<TopAlphaBarChartProps> = ({
  data,
}) => {
  const [activeCategory, setActiveCategory] = useState<AttendanceCategory>('ALPHA');
  const [viewMode, setViewMode] = useState<'vertical' | 'horizontal' | 'list'>('vertical');
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);

  const currentConfig = CATEGORIES[activeCategory];
  const fieldKey = currentConfig.field;

  // 1. Data 10 teratas untuk grafik batang (Vertikal & Horizontal)
  const top10 = [...data]
    .filter((d) => (d[fieldKey] || 0) > 0)
    .sort((a, b) => (b[fieldKey] || 0) - (a[fieldKey] || 0))
    .slice(0, 10);

  // 2. Data SELURUH pengurus untuk mode Rincian (diurutkan berdasarkan kategori aktif)
  const allSortedMembers = [...data].sort((a, b) => {
    const diff = (b[fieldKey] || 0) - (a[fieldKey] || 0);
    if (diff !== 0) return diff;
    return a.nama.localeCompare(b.nama);
  });

  const maxValue = top10.length > 0 ? Math.max(...top10.map((d) => d[fieldKey] || 0)) : 0;

  // Menggunakan nilai chart tertinggi sebagai batas maksimum skala Y
  const yAxisMax = Math.max(maxValue, 1);

  // Y-axis grid lines (4 tingkatan proporsional)
  const gridSteps = [
    yAxisMax,
    Math.round(yAxisMax * 0.75),
    Math.round(yAxisMax * 0.5),
    Math.round(yAxisMax * 0.25),
    0,
  ];
  const uniqueGridSteps = Array.from(new Set(gridSteps)).sort((a, b) => b - a);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
      {/* Header Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className={`w-4 h-4 ${currentConfig.iconColor}`} />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              {viewMode === 'list'
                ? `Rincian Seluruh Fungsionaris (${currentConfig.label})`
                : currentConfig.title}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {viewMode === 'list'
              ? `Rekapitulasi lengkap ${allSortedMembers.length} pengurus diurutkan berdasarkan akumulasi ${currentConfig.label.toLowerCase()}.`
              : currentConfig.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          {/* View Toggle (3 Pilihan: Vertikal, Horizontal, Rincian) */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setViewMode('vertical')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                viewMode === 'vertical'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Grafik Batang Vertikal"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Vertikal</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('horizontal')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                viewMode === 'horizontal'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Grafik Batang Horizontal"
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Horizontal</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Rincian Seluruh Pengurus"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Rincian</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="mt-3.5 flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-semibold text-slate-500 mr-1">Filter Kategori:</span>
        {CATEGORY_LIST.map((catKey) => {
          const cat = CATEGORIES[catKey];
          const isActive = activeCategory === catKey;
          return (
            <button
              key={catKey}
              type="button"
              onClick={() => setActiveCategory(catKey)}
              className={`px-3 py-1 rounded-lg text-xs transition-all border cursor-pointer ${
                isActive
                  ? cat.activePillClass
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Konten Chart / Empty State */}
      {top10.length === 0 && viewMode !== 'list' ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center mb-2.5">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold text-slate-800">{currentConfig.emptyTitle}</h3>
          <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
            {currentConfig.emptySubtitle}
          </p>
        </div>
      ) : viewMode === 'vertical' ? (
        /* ================= MODE 1: VERTICAL BAR CHART (TOP 10) ================= */
        <div className="mt-5">
          <div className="overflow-x-auto pb-2 scrollbar-thin">
            <div className="min-w-[900px] sm:min-w-full">
              {/* Chart Canvas Area */}
              <div className="relative h-64 flex items-end pl-7 pr-2 pt-6 pb-1">
                {/* Horizontal Gridlines & Y-Axis Labels */}
                <div className="absolute inset-0 left-7 top-6 bottom-1 flex flex-col justify-between pointer-events-none">
                  {uniqueGridSteps.map((step) => (
                    <div key={step} className="relative w-full border-b border-dashed border-slate-100 flex items-center">
                      <span className="absolute -left-7 text-[10px] font-mono text-slate-400 w-5 text-right tabular-nums">
                        {step}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Vertical Bars Columns */}
                <div className="relative z-10 w-full h-full flex items-end justify-around gap-2 sm:gap-3">
                  {top10.map((item, idx) => {
                    const val = item[fieldKey] || 0;
                    const heightPercent = Math.max(Math.round((val / yAxisMax) * 100), 8);
                    const isHovered = hoveredUser === item.userId;

                    const gradientClass =
                      idx === 0
                        ? currentConfig.barColors.rank1
                        : idx <= 2
                        ? currentConfig.barColors.rank2
                        : currentConfig.barColors.rankRest;

                    return (
                      <div
                        key={item.userId}
                        className="flex-1 min-w-[84px] sm:min-w-[96px] max-w-[115px] h-full flex flex-col items-center justify-end group cursor-pointer relative"
                        onMouseEnter={() => setHoveredUser(item.userId)}
                        onMouseLeave={() => setHoveredUser(null)}
                      >
                        {/* Tooltip Hover Bubble */}
                        <div
                          className={`absolute z-40 transition-all duration-200 pointer-events-none ${
                            idx === 0
                              ? 'left-0'
                              : idx === top10.length - 1
                              ? 'right-0'
                              : 'left-1/2 -translate-x-1/2'
                          } ${heightPercent >= 75 ? 'top-10' : 'top-1'} ${
                            isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                          }`}
                        >
                          <div className="bg-slate-900 text-white rounded-xl p-2.5 shadow-2xl text-left min-w-[170px] border border-slate-700 relative">
                            <div className="text-[11px] font-bold text-white leading-tight">{item.nama}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{item.dept || 'PSDM'}</div>

                            {/* Rincian Status Pengurus */}
                            <div className="mt-2 pt-2 border-t border-slate-800 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] text-slate-300">
                              <div>Hadir: <span className="font-semibold text-emerald-400">{item.hadir}</span></div>
                              <div>Telat: <span className="font-semibold text-amber-400">{item.telat}</span></div>
                              <div>Izin: <span className="font-semibold text-sky-400">{item.izin}</span></div>
                              <div>Sakit: <span className="font-semibold text-violet-400">{item.sakit}</span></div>
                              <div className="col-span-2 text-rose-400 font-semibold">Alpa: {item.alpa}</div>
                            </div>

                            <div className="mt-2 pt-1.5 border-t border-slate-800 flex justify-between items-center text-[10px]">
                              <span className={`font-bold ${currentConfig.hoverText}`}>
                                {val} {currentConfig.unit}
                              </span>
                              <span className="text-slate-400 font-mono">Rank #{idx + 1}</span>
                            </div>
                          </div>
                        </div>

                        {/* Value Pill di atas Bar */}
                        <span
                          className={`text-[11px] font-bold mb-1.5 tabular-nums transition-transform ${
                            isHovered ? `${currentConfig.hoverText} scale-110` : 'text-slate-700'
                          }`}
                        >
                          {val}
                        </span>

                        {/* Bar Column Pillar */}
                        <div className="w-full bg-slate-100/90 rounded-t-lg h-full flex items-end p-1 transition-colors group-hover:bg-slate-200/80">
                          <div
                            className={`w-full rounded-t-md transition-all duration-500 shadow-2xs ${gradientClass} ${
                              isHovered ? `brightness-110 shadow-md ring-2 ${currentConfig.hoverBorder}` : ''
                            }`}
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* X-Axis Labels */}
              <div className="pl-7 pr-2 mt-3 pt-2.5 border-t border-slate-200/80 flex items-start justify-around gap-2 sm:gap-3">
                {top10.map((item, idx) => (
                  <div
                    key={item.userId}
                    className="flex-1 min-w-[84px] sm:min-w-[96px] max-w-[115px] text-center"
                    onMouseEnter={() => setHoveredUser(item.userId)}
                  >
                    <div
                      className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold mb-1.5 leading-none ${
                        idx < 3 ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      #{idx + 1}
                    </div>
                    <div
                      className="font-semibold text-slate-800 text-[10.5px] sm:text-[11px] leading-tight text-center break-words px-1"
                      title={item.nama}
                    >
                      {item.nama}
                    </div>
                    <div
                      className="text-[9.5px] text-slate-400 text-center leading-tight mt-1 break-words px-1"
                      title={item.dept}
                    >
                      {item.dept || 'PSDM'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : viewMode === 'horizontal' ? (
        /* ================= MODE 2: HORIZONTAL BAR CHART (TOP 10) ================= */
        <div className="mt-4 space-y-2.5">
          {top10.map((item, idx) => {
            const val = item[fieldKey] || 0;
            const ratioPercent = Math.max(Math.round((val / maxValue) * 100), 6);
            const isHovered = hoveredUser === item.userId;

            return (
              <div
                key={item.userId}
                onMouseEnter={() => setHoveredUser(item.userId)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isHovered
                    ? 'bg-slate-50/90 border-slate-300 shadow-2xs'
                    : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-md text-[10px] font-mono font-bold flex items-center justify-center shrink-0 ${
                        idx < 3 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-xs text-slate-900" title={item.nama}>
                      {item.nama}
                    </span>
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      • {item.dept || 'PSDM'}
                    </span>
                  </div>

                  <span className={`font-bold text-xs shrink-0 tabular-nums ${currentConfig.hoverText}`}>
                    {val} {currentConfig.unit}
                  </span>
                </div>

                {/* Horizontal Bar Pillar */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex items-center">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${currentConfig.breakdownBar} ${
                      isHovered ? 'brightness-110 ring-2 ring-slate-300' : ''
                    }`}
                    style={{ width: `${ratioPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= MODE 3: RINCIAN SELURUH PENGURUS (SEMUA DAFTAR PENGURUS) ================= */
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 px-1">
            <span>Daftar seluruh fungsionaris ({allSortedMembers.length} orang)</span>
            <span className="text-[11px]">Diurutkan dari {currentConfig.label.toLowerCase()} tertinggi</span>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden max-h-[520px] overflow-y-auto scrollbar-thin">
            {allSortedMembers.map((item, idx) => {
              const val = item[fieldKey] || 0;
              const ratioPercent = maxValue > 0 ? Math.round((val / maxValue) * 100) : 0;
              const isHovered = hoveredUser === item.userId;

              return (
                <div
                  key={item.userId}
                  onMouseEnter={() => setHoveredUser(item.userId)}
                  className={`p-3 sm:p-3.5 flex items-center justify-between gap-3 transition-colors ${
                    isHovered ? 'bg-slate-50' : 'bg-white hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${
                        idx < 3 && val > 0
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900">{item.nama}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                        <span>{item.prn ? `${item.prn} • ` : ''}{item.dept || 'PSDM'}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400 text-[10px]">
                          Presensi: <b className="text-emerald-600">{item.hadir} H</b> / <b className="text-amber-600">{item.telat} T</b> / <b className="text-sky-600">{item.izin} I</b> / <b className="text-violet-600">{item.sakit} S</b> / <b className="text-rose-600">{item.alpa} A</b>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-20 sm:w-32 bg-slate-100 rounded-full h-2 overflow-hidden hidden sm:block">
                      <div
                        className={`${currentConfig.breakdownBar} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(ratioPercent, val > 0 ? 6 : 0)}%` }}
                      />
                    </div>
                    <span
                      className={`font-bold border px-2.5 py-1 rounded-lg text-xs tabular-nums ${
                        val > 0
                          ? currentConfig.breakdownBadge
                          : 'text-slate-400 bg-slate-50 border-slate-200'
                      }`}
                    >
                      {val} {currentConfig.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentConfig.footerNote}</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-slate-500">
          <span>Total: {allSortedMembers.length} Pengurus</span>
          {maxValue > 0 && <span>• Maks: {maxValue} {currentConfig.unit}</span>}
        </div>
      </div>
    </div>
  );
};
