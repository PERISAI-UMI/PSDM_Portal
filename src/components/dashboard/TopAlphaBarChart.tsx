import React, { useState } from 'react';
import { BarChart3, List, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

export interface AlphaMemberStat {
  userId: string;
  nama: string;
  prn?: string;
  dept?: string;
  alpa: number;
  hadir: number;
  totalKegiatan: number;
}

interface TopAlphaBarChartProps {
  data: AlphaMemberStat[];
  onNavigateToMembers?: () => void;
}

export const TopAlphaBarChart: React.FC<TopAlphaBarChartProps> = ({
  data,
  onNavigateToMembers,
}) => {
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);

  // Filter pengurus dengan alpa > 0 dan ambil 5 teratas
  const top5 = [...data]
    .filter((d) => d.alpa > 0)
    .sort((a, b) => b.alpa - a.alpa)
    .slice(0, 5);

  const maxAlpa = top5.length > 0 ? Math.max(...top5.map((d) => d.alpa)) : 0;
  // Skala Y-axis dibulatkan ke atas agar ada ruang di puncak batang
  const yAxisMax = Math.max(maxAlpa + 1, 4);

  // Y-axis grid lines (4 tingkatan)
  const gridSteps = [
    yAxisMax,
    Math.round(yAxisMax * 0.75),
    Math.round(yAxisMax * 0.5),
    Math.round(yAxisMax * 0.25),
    0,
  ];
  // Filter duplikat jika nilai kecil
  const uniqueGridSteps = Array.from(new Set(gridSteps)).sort((a, b) => b - a);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
      {/* Header Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-rose-600" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Top 5 Pengurus dengan Alpa Terbanyak
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring akumulasi ketidakhadiran tanpa keterangan untuk bahan evaluasi kedisiplinan fungsionaris.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {/* View Toggle */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setViewMode('chart')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                viewMode === 'chart'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Diagram Batang"
            >
              Grafik Batang
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Rincian"
            >
              Rincian
            </button>
          </div>

          {onNavigateToMembers && (
            <button
              type="button"
              onClick={onNavigateToMembers}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span>Direktori</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Konten Chart / Empty State */}
      {top5.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold text-slate-800">Kedisiplinan Sempurna</h3>
          <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
            Tidak ditemukan catatan alpa pada fungsionaris. Seluruh presensi terekam hadir, izin, atau sakit.
          </p>
        </div>
      ) : viewMode === 'chart' ? (
        /* ================= MODE 1: VERTICAL BAR CHART ================= */
        <div className="mt-6">
          {/* Chart Canvas Area */}
          <div className="relative h-60 flex items-end pl-7 pr-2 pt-6">
            {/* Horizontal Gridlines & Y-Axis Labels */}
            <div className="absolute inset-0 left-7 flex flex-col justify-between pointer-events-none">
              {uniqueGridSteps.map((step) => (
                <div key={step} className="relative w-full border-b border-dashed border-slate-100 flex items-center">
                  <span className="absolute -left-7 text-[10px] font-mono text-slate-400 w-5 text-right tabular-nums">
                    {step}
                  </span>
                </div>
              ))}
            </div>

            {/* Vertical Bars Columns */}
            <div className="relative z-10 w-full h-full flex items-end justify-around gap-2 sm:gap-6">
              {top5.map((item, idx) => {
                const heightPercent = Math.max(Math.round((item.alpa / yAxisMax) * 100), 10);
                const isHovered = hoveredUser === item.userId;

                return (
                  <div
                    key={item.userId}
                    className="flex-1 max-w-[72px] sm:max-w-[88px] h-full flex flex-col items-center justify-end group cursor-pointer"
                    onMouseEnter={() => setHoveredUser(item.userId)}
                    onMouseLeave={() => setHoveredUser(null)}
                  >
                    {/* Tooltip Hover Bubble */}
                    <div
                      className={`absolute -top-3 z-30 transition-all duration-200 pointer-events-none transform -translate-y-full ${
                        isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                      }`}
                    >
                      <div className="bg-slate-900 text-white rounded-lg p-2.5 shadow-xl text-left min-w-[160px] border border-slate-700">
                        <div className="text-[11px] font-bold text-white leading-tight">{item.nama}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{item.dept || 'PSDM'}</div>
                        <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center text-[10px]">
                          <span className="text-rose-400 font-bold">{item.alpa} Kali Alpa</span>
                          <span className="text-slate-400 font-mono">Rank #{idx + 1}</span>
                        </div>
                      </div>
                    </div>

                    {/* Value Pill di atas Bar */}
                    <span
                      className={`text-[11px] font-bold mb-1.5 tabular-nums transition-transform ${
                        isHovered ? 'text-rose-700 scale-110' : 'text-slate-700'
                      }`}
                    >
                      {item.alpa}
                    </span>

                    {/* Bar Column Pillar */}
                    <div className="w-full bg-slate-100/90 rounded-t-lg h-full flex items-end p-1 transition-colors group-hover:bg-slate-200/80">
                      <div
                        className={`w-full rounded-t-md transition-all duration-500 shadow-2xs ${
                          idx === 0
                            ? 'bg-gradient-to-t from-rose-600 via-rose-500 to-rose-400'
                            : idx === 1
                            ? 'bg-gradient-to-t from-rose-500 via-rose-500 to-rose-400'
                            : 'bg-gradient-to-t from-rose-400 via-rose-400 to-rose-300'
                        } ${isHovered ? 'brightness-110 shadow-md ring-2 ring-rose-400/40' : ''}`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* X-Axis Labels (Nama & Info Pengurus) */}
          <div className="pl-7 pr-2 mt-3 pt-2.5 border-t border-slate-200/80 flex items-start justify-around gap-2 sm:gap-6">
            {top5.map((item, idx) => (
              <div
                key={item.userId}
                className="flex-1 max-w-[72px] sm:max-w-[88px] text-center min-w-0"
              >
                <div className="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-600 mb-1 leading-none">
                  #{idx + 1}
                </div>
                <div className="font-semibold text-slate-800 text-[11px] truncate leading-tight" title={item.nama}>
                  {item.nama}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5 hidden sm:block">
                  {item.dept || 'PSDM'}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ================= MODE 2: DETAILED TABLE / BREAKDOWN ================= */
        <div className="mt-4 divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden">
          {top5.map((item, idx) => {
            const ratioPercent = Math.round((item.alpa / maxAlpa) * 100);
            return (
              <div key={item.userId} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 truncate">{item.nama}</div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {item.prn ? `${item.prn} • ` : ''}{item.dept || 'PSDM'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-24 sm:w-36 bg-slate-100 rounded-full h-2 overflow-hidden hidden sm:block">
                    <div
                      className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${ratioPercent}%` }}
                    />
                  </div>
                  <span className="font-bold text-rose-600 bg-rose-50 border border-rose-200/80 px-2.5 py-1 rounded-lg text-xs tabular-nums">
                    {item.alpa} Alpa
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
          <span>Fungsionaris dengan alpa tinggi dapat ditindaklanjuti untuk surat peringatan (SP) atau pembinaan.</span>
        </div>
        {top5.length > 0 && (
          <span className="font-mono text-slate-500">
            Maks: {maxAlpa} Alpa
          </span>
        )}
      </div>
    </div>
  );
};
