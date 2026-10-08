import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  Users,
  ChevronRight,
} from 'lucide-react';
import type { AuthUser, DepartmentItem, LeaderboardEntry } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { MemberPointsHistoryModal } from './MemberPointsHistoryModal.tsx';

interface LeaderboardViewProps {
  currentUser: AuthUser;
  departments: DepartmentItem[];
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  currentUser,
  departments,
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedGen, setSelectedGen] = useState<string>('');

  // Modals state
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<{
    id: string;
    nama: string;
    prn: string;
  } | null>(null);

  const canViewHistory = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

  const handleOpenHistory = (user: { id: string; nama: string; prn: string }) => {
    if (!canViewHistory) return;
    setSelectedUserForHistory(user);
  };

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.getPointsLeaderboard({
        departmentId: selectedDept || undefined,
        generasi: selectedGen ? parseInt(selectedGen, 10) : undefined,
      });
      setLeaderboard(data);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat data klasemen poin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [selectedDept, selectedGen]);

  // Filter pencarian nama/PRN/NIM
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return leaderboard;
    const q = searchQuery.toLowerCase();
    return leaderboard.filter(
      (m) =>
        m.namaLengkap.toLowerCase().includes(q) ||
        m.prn.toLowerCase().includes(q) ||
        (m.nim && m.nim.toLowerCase().includes(q))
    );
  }, [leaderboard, searchQuery]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Page Header - Seragam dengan modul lain */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
        <div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Klasemen & Poin Anggota
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {leaderboard.length} Pengurus
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Peringkat keaktifan kehadiran organisasi berbasis akumulasi poin per lingkup kegiatan.
          </p>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari anggota (nama, PRN, atau NIM)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-surface focus:outline-none focus:ring-1 focus:ring-brand text-slate-900 placeholder:text-slate-400 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Departemen */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-surface text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer"
          >
            <option value="">Semua Departemen</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.nama}
              </option>
            ))}
          </select>

          {/* Filter Generasi */}
          <select
            value={selectedGen}
            onChange={(e) => setSelectedGen(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-surface text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer"
          >
            <option value="">Semua Generasi</option>
            <option value="23">Gen 23</option>
            <option value="24">Gen 24</option>
            <option value="25">Gen 25</option>
            <option value="26">Gen 26</option>
          </select>
        </div>
      </div>

      {/* Kontainer Klasemen: Mobile Cards (md:hidden) & Desktop Table (hidden md:block) */}
      <div className="bg-surface rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-7 h-7 animate-spin text-brand" />
            <p className="text-xs font-medium">Memuat klasemen poin...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-semibold">Tidak ada data anggota yang sesuai dengan filter.</p>
          </div>
        ) : (
          <>
            {/* 1. Tampilan Mobile Cards (< 768px: Smartphone) */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredData.map((row) => {
                const isCurrent = currentUser.id === row.userId;
                const isRank1 = row.rank === 1;
                const isRank2 = row.rank === 2;
                const isRank3 = row.rank === 3;

                return (
                  <div
                    key={`mob-${row.userId}`}
                    onClick={() =>
                      handleOpenHistory({
                        id: row.userId,
                        nama: row.namaLengkap,
                        prn: row.prn,
                      })
                    }
                    className={`p-3.5 space-y-2.5 transition-colors ${
                      canViewHistory ? 'hover:bg-slate-50/80 active:bg-slate-100 cursor-pointer' : ''
                    } ${isCurrent ? 'bg-accent/10' : ''}`}
                  >
                    {/* Header: Rank + Avatar + Name + Total Points */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Rank Badge */}
                        <div className="shrink-0">
                          {isRank1 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent text-ink font-bold text-xs shadow-2xs">
                              1
                            </span>
                          ) : isRank2 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-800 font-bold text-xs">
                              2
                            </span>
                          ) : isRank3 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-800 font-bold text-xs">
                              3
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-semibold text-xs">
                              {row.rank}
                            </span>
                          )}
                        </div>

                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0 overflow-hidden shadow-2xs">
                          {row.avatarUrl ? (
                            <img src={row.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            getInitials(row.namaLengkap)
                          )}
                        </div>

                        {/* Name & Dept */}
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-slate-900 flex items-center gap-1.5 truncate">
                            <span className="truncate">{row.namaLengkap}</span>
                            {isCurrent && (
                              <span className="text-[10px] bg-accent text-ink px-1.5 py-0.2 rounded font-bold shrink-0">
                                Anda
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {row.departmentName || '-'} • {row.jabatan} (Gen {row.generasi})
                          </div>
                        </div>
                      </div>

                      {/* Total Points & Chevron */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-lg font-bold text-xs ${
                            row.totalPoints > 0
                              ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                              : row.totalPoints < 0
                              ? 'bg-rose-500/10 text-rose-700 border border-rose-500/20'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {row.totalPoints > 0 ? `+${row.totalPoints}` : row.totalPoints} Pts
                        </span>
                        {canViewHistory && <ChevronRight className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {/* Meta stats breakdown */}
                    <div className="grid grid-cols-4 gap-1 p-2 rounded-lg bg-slate-50/70 border border-slate-100 text-center text-xs">
                      <div>
                        <div className="text-[10px] text-slate-500 font-medium">Hadir</div>
                        <div className="text-xs font-bold text-emerald-600 tabular-nums">{row.hadirCount}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-medium">Telat</div>
                        <div className="text-xs font-bold text-amber-600 tabular-nums">{row.telatCount}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-medium">Izin/Skt</div>
                        <div className="text-xs font-bold text-slate-700 tabular-nums">{row.izinCount + row.sakitCount}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-medium">Alpha</div>
                        <div className={`text-xs font-bold tabular-nums ${row.alphaCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          {row.alphaCount}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2. Tampilan Tablet, Laptop & Desktop (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="bg-slate-50/75 text-slate-500 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 w-16 text-center">Rank</th>
                    <th className="px-4 py-3">Anggota</th>
                    <th className="px-4 py-3">Departemen & Jabatan</th>
                    <th className="px-4 py-3 text-center">Hadir</th>
                    <th className="px-4 py-3 text-center">Telat</th>
                    <th className="px-4 py-3 text-center">Izin / Sakit</th>
                    <th className="px-4 py-3 text-center">Alpha</th>
                    <th className="px-4 py-3 text-right font-bold">Total Poin</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.map((row) => {
                    const isCurrent = currentUser.id === row.userId;
                    const isRank1 = row.rank === 1;
                    const isRank2 = row.rank === 2;
                    const isRank3 = row.rank === 3;

                    return (
                      <tr
                        key={row.userId}
                        onClick={() =>
                          handleOpenHistory({
                            id: row.userId,
                            nama: row.namaLengkap,
                            prn: row.prn,
                          })
                        }
                        className={`${
                          canViewHistory
                            ? 'hover:bg-slate-50/80 cursor-pointer'
                            : 'cursor-default'
                        } transition-colors ${
                          isCurrent ? 'bg-accent/10 font-medium' : ''
                        }`}
                      >
                        {/* Peringkat */}
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          {isRank1 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent text-ink font-bold text-xs shadow-2xs">
                              1
                            </span>
                          ) : isRank2 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-800 font-bold text-xs">
                              2
                            </span>
                          ) : isRank3 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-800 font-bold text-xs">
                              3
                            </span>
                          ) : (
                            <span className="text-slate-600 font-semibold">{row.rank}</span>
                          )}
                        </td>

                        {/* Info Anggota */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0 overflow-hidden shadow-2xs">
                              {row.avatarUrl ? (
                                <img src={row.avatarUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                getInitials(row.namaLengkap)
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                {row.namaLengkap}
                                {isCurrent && (
                                  <span className="text-[10px] bg-accent text-ink px-1.5 py-0.2 rounded font-bold">
                                    Anda
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {row.prn} {row.nim ? `• NIM ${row.nim}` : ''}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Departemen & Jabatan */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="font-medium text-slate-800">
                            {row.departmentName || '-'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {row.jabatan} (Gen {row.generasi})
                          </div>
                        </td>

                        {/* Hadir */}
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <span className="font-semibold text-emerald-600">
                            {row.hadirCount}
                          </span>
                        </td>

                        {/* Telat */}
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <span className="font-semibold text-amber-600">
                            {row.telatCount}
                          </span>
                        </td>

                        {/* Izin/Sakit */}
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <span className="text-slate-700 font-medium">
                            {row.izinCount + row.sakitCount}
                          </span>
                        </td>

                        {/* Alpha */}
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <span
                            className={`font-semibold ${
                              row.alphaCount > 0 ? 'text-rose-600' : 'text-slate-400'
                            }`}
                          >
                            {row.alphaCount}
                          </span>
                        </td>

                        {/* Total Poin */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg font-bold text-xs ${
                              row.totalPoints > 0
                                ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                                : row.totalPoints < 0
                                ? 'bg-rose-500/10 text-rose-700 border border-rose-500/20'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {row.totalPoints > 0 ? `+${row.totalPoints}` : row.totalPoints} Pts
                          </span>
                        </td>

                        {/* Action Chevron */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap text-slate-400">
                          {canViewHistory && <ChevronRight className="w-4 h-4 ml-auto" />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal Riwayat Poin Per Anggota */}
      <MemberPointsHistoryModal
        isOpen={!!selectedUserForHistory}
        userId={selectedUserForHistory?.id || null}
        userName={selectedUserForHistory?.nama}
        userPrn={selectedUserForHistory?.prn}
        onClose={() => setSelectedUserForHistory(null)}
      />
    </div>
  );
};
