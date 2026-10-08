import React, { useEffect, useState, useMemo } from 'react';
import {
  Medal,
  Search,
  RefreshCw,
  Users,
  ChevronRight,
  Sparkles,
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
  const [refreshing, setRefreshing] = useState<boolean>(false);
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

  const loadLeaderboard = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
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
      setRefreshing(false);
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

  // Top 3 Podium
  const topThree = useMemo(() => {
    return leaderboard.slice(0, 3);
  }, [leaderboard]);

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

        <div className="flex items-center gap-2 sm:gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => loadLeaderboard(true)}
            disabled={loading || refreshing}
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-surface text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
            title="Segarkan data klasemen"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Top 3 Podium */}
      {!loading && topThree.length > 0 && !selectedDept && !searchQuery && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Juara 2 (Silver) */}
          {topThree[1] && (
            <div
              onClick={() =>
                handleOpenHistory({
                  id: topThree[1].userId,
                  nama: topThree[1].namaLengkap,
                  prn: topThree[1].prn,
                })
              }
              className={`order-2 md:order-1 p-5 rounded-xl bg-surface border border-slate-200/80 ${
                canViewHistory ? 'hover:border-slate-300 hover:shadow-xs cursor-pointer' : ''
              } shadow-2xs transition-all relative overflow-hidden group flex flex-col justify-between`}
            >
              <div className="absolute top-3.5 right-3.5 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs">
                <Medal className="w-3.5 h-3.5 text-slate-400" />
                <span>#2 Perak</span>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <div className="w-12 h-12 rounded-full ring-2 ring-slate-200 bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-2xs">
                  {topThree[1].avatarUrl ? (
                    <img src={topThree[1].avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(topThree[1].namaLengkap)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-slate-900 truncate group-hover:text-brand transition-colors">
                    {topThree[1].namaLengkap}
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {topThree[1].departmentName || 'Anggota'}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Perolehan Poin:</span>
                <span className="text-lg font-bold text-slate-900">
                  {topThree[1].totalPoints} <span className="text-xs font-normal text-slate-500">Pts</span>
                </span>
              </div>
            </div>
          )}

          {/* Juara 1 (Gold / Champion) */}
          {topThree[0] && (
            <div
              onClick={() =>
                handleOpenHistory({
                  id: topThree[0].userId,
                  nama: topThree[0].namaLengkap,
                  prn: topThree[0].prn,
                })
              }
              className={`order-1 md:order-2 p-5 rounded-xl bg-surface border-2 border-accent/80 shadow-xs ${
                canViewHistory ? 'hover:shadow-sm cursor-pointer' : ''
              } transition-all relative overflow-hidden group flex flex-col justify-between`}
            >
              <div className="absolute top-3.5 right-3.5 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent text-ink text-xs font-bold shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-ink" />
                <span>#1 Juara</span>
              </div>
              <div className="flex items-center gap-3.5 mt-4">
                <div className="w-13 h-13 rounded-full ring-2 ring-accent bg-accent/20 text-ink flex items-center justify-center font-bold text-base shrink-0 overflow-hidden shadow-2xs">
                  {topThree[0].avatarUrl ? (
                    <img src={topThree[0].avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(topThree[0].namaLengkap)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-base text-slate-900 truncate group-hover:text-brand transition-colors">
                    {topThree[0].namaLengkap}
                  </h3>
                  <p className="text-xs text-slate-600 truncate mt-0.5">
                    {topThree[0].departmentName || 'Anggota'} • {topThree[0].jabatan}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">Total Akumulasi:</span>
                <span className="text-xl font-bold text-slate-900">
                  {topThree[0].totalPoints} <span className="text-xs font-normal text-slate-500">Pts</span>
                </span>
              </div>
            </div>
          )}

          {/* Juara 3 (Bronze) */}
          {topThree[2] && (
            <div
              onClick={() =>
                handleOpenHistory({
                  id: topThree[2].userId,
                  nama: topThree[2].namaLengkap,
                  prn: topThree[2].prn,
                })
              }
              className={`order-3 md:order-3 p-5 rounded-xl bg-surface border border-slate-200/80 ${
                canViewHistory ? 'hover:border-slate-300 hover:shadow-xs cursor-pointer' : ''
              } shadow-2xs transition-all relative overflow-hidden group flex flex-col justify-between`}
            >
              <div className="absolute top-3.5 right-3.5 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 text-xs font-bold border border-amber-500/20 shadow-2xs">
                <Medal className="w-3.5 h-3.5 text-amber-600" />
                <span>#3 Perunggu</span>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <div className="w-12 h-12 rounded-full ring-2 ring-amber-500/30 bg-amber-500/10 text-amber-800 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-2xs">
                  {topThree[2].avatarUrl ? (
                    <img src={topThree[2].avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(topThree[2].namaLengkap)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-slate-900 truncate group-hover:text-brand transition-colors">
                    {topThree[2].namaLengkap}
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {topThree[2].departmentName || 'Anggota'}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Perolehan Poin:</span>
                <span className="text-lg font-bold text-slate-900">
                  {topThree[2].totalPoints} <span className="text-xs font-normal text-slate-500">Pts</span>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

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

      {/* Tabel Klasemen Poin */}
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
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
