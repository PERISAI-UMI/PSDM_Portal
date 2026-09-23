import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { formatWitaDate, formatWitaTime } from '../../utils/date.ts';

export const RealtimeClockWidget: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    // Sinkronisasi update setiap 1 detik
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeString = formatWitaTime(currentTime, true);
  const dateString = formatWitaDate(currentTime, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      className="flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1 rounded-lg bg-slate-50/90 hover:bg-slate-100/80 border border-slate-200/80 transition-all shadow-2xs select-none"
      title={`Waktu Indonesia Tengah (WITA): ${dateString} ${timeString}`}
    >
      <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0 animate-pulse" />
      
      <div className="flex items-center gap-1.5 text-xs">
        {/* Tanggal (sembunyi di layar kecil) */}
        <span className="hidden md:inline text-[11px] font-medium text-slate-500">
          {dateString}
        </span>
        <span className="hidden md:inline text-slate-300">•</span>

        {/* Jam Realtime (Monospace agar angka tidak bergetar saat detik bertambah) */}
        <span className="font-mono text-xs sm:text-xs font-semibold text-slate-800 tracking-tight tabular-nums">
          {timeString}
        </span>

        {/* Badge Zona Waktu WITA */}
        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50/80 px-1.5 py-0.5 rounded border border-indigo-200/60 leading-none">
          WITA
        </span>
      </div>
    </div>
  );
};
