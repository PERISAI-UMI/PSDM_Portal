import React, { useEffect, useState, useMemo } from 'react';
import {
  Trophy,
  Award,
  Medal,
  Settings,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  User,
  Users,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import type { AuthUser, DepartmentItem, LeaderboardEntry, PointConfig } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { PointsConfigModal } from './PointsConfigModal.tsx';
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
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<{
    id: string;
    nama: string;
    prn: string;
  } | null>(null);

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

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

  // Filter pencarian nama/PRN
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
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-accent text-ink flex items-center justify-center font-bold shadow-xs">
              <Trophy className="w-5 h-5 text-ink" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Klasemen & Poin Anggota
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand/10 text-brand dark:text-accent">
                  Live
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Peringkat keaktifan kehadiran organisasi berbasis akumulasi poin
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadLeaderboard(true)}
            disabled={loading || refreshing}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-surface text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Segarkan data klasemen"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand/90 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Atur Bobot Poin</span>
            </button>
          )}
        </div>
      </div>

      {/* Top 3 Podium (Visual Excellence & 60-30-10 palette) */}
      {!loading && topThree.length > 0 && !selectedDept && !searchQuery && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Juara 2 (Silver) */}
          {topThree[1] && (
            <div
              onClick={() =>
                setSelectedUserForHistory({
                  id: topThree[1].userId,
                  nama: topThree[1].namaLengkap,
                  prn: topThree[1].prn,
                })
              }
              className="order-2 md:order-1 p-5 rounded-2xl bg-surface border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between"
            >
              <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700">
                <Medal className="w-3.5 h-3.5 text-slate-400" />
                <span>#2 Silver</span>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <div className="w-12 h-12 rounded-full ring-2 ring-slate-300 dark:ring-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                  {topThree[1].avatarUrl ? (
                    <img src={topThree[1].avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(topThree[1].namaLengkap)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-brand transition-colors">
                    {topThree[1].namaLengkap}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {topThree[1].departmentName || 'Anggota'}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-500">Perolehan Poin:</span>
                <span className="text-lg font-black text-slate-800 dark:text-slate-200">
                  {topThree[1].totalPoints} <span className="text-xs font-medium text-slate-400">Pts</span>
                </span>
              </div>
            </div>
          )}

          {/* Juara 1 (Gold / Champion with Accent Color #F6C90E) */}
          {topThree[0] && (
            <div
              onClick={() =>
                setSelectedUserForHistory({
                  id: topThree[0].userId,
                  nama: topThree[0].namaLengkap,
                  prn: topThree[0].prn,
                })
              }
              className="order-1 md:order-2 p-6 rounded-2xl bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/15 dark:via-amber-500/5 dark:to-transparent border-2 border-accent dark:border-accent/80 shadow-md hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between"
            >
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-ink text-xs font-black shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>#1 Champion</span>
              </div>
              <div className="flex items-center gap-3.5 mt-4">
                <div className="w-14 h-14 rounded-full ring-3 ring-accent bg-accent/20 text-ink flex items-center justify-center font-black text-base shrink-0 overflow-hidden shadow-xs">
                  {topThree[0].avatarUrl ? (
                    <img src={topThree[0].avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(topThree[0].namaLengkap)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-accent transition-colors">
                    {topThree[0].namaLengkap}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate">
                    {topThree[0].departmentName || 'Anggota'} • {topThree[0].jabatan}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3.5 border-t border-amber-200/60 dark:border-amber-800/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Total Akumulasi:</span>
                <span className="text-2xl font-black text-amber-600 dark:text-accent">
                  {topThree[0].totalPoints} <span className="text-xs font-bold text-slate-500">Pts</span>
                </span>
              </div>
            </div>
          )}

          {/* Juara 3 (Bronze) */}
          {topThree[2] && (
            <div
              onClick={() =>
                setSelectedUserForHistory({
                  id: topThree[2].userId,
                  nama: topThree[2].namaLengkap,
                  prn: topThree[2].prn,
                })
              }
              className="order-3 md:order-3 p-5 rounded-2xl bg-surface border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between"
            >
              <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-900/10 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-xs font-bold border border-amber-800/20">
                <Medal className="w-3.5 h-3.5 text-amber-700" />
                <span>#3 Bronze</span>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <div className="w-12 h-12 rounded-full ring-2 ring-amber-700/40 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                  {topThree[2].avatarUrl ? (
                    <img src={topThree[2].avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(topThree[2].namaLengkap)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-brand transition-colors">
                    {topThree[2].namaLengkap}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {topThree[2].departmentName || 'Anggota'}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-500">Perolehan Poin:</span>
                <span className="text-lg font-black text-slate-800 dark:text-slate-200">
                  {topThree[2].totalPoints} <span className="text-xs font-medium text-slate-400">Pts</span>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter Bar & Search */}
      <div className="p-4 rounded-2xl bg-surface border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari anggota (nama / PRN / NIM)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-brand"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Filter Departemen */}
          <div className="flex-1 sm:flex-initial">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full sm:w-48 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-brand"
            >
              <option value="">Semua Departemen</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Generasi */}
          <div className="w-28 sm:w-32">
            <select
              value={selectedGen}
              onChange={(e) => setSelectedGen(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-brand"
            >
              <option value="">Semua Gen</option>
              <option value="23">Gen 23</option>
              <option value="24">Gen 24</option>
              <option value="25">Gen 25</option>
              <option value="26">Gen 26</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Klasemen Poin (Responsive Mobile: overflow-x-auto) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-surface shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-brand" />
            <p className="text-xs font-medium">Memuat tabel klasemen poin...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-semibold">Tidak ada data anggota yang sesuai dengan filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 w-16 text-center">Rank</th>
                  <th className="px-4 py-3.5">Anggota</th>
                  <th className="px-4 py-3.5">Departemen & Jabatan</th>
                  <th className="px-4 py-3.5 text-center">Hadir</th>
                  <th className="px-4 py-3.5 text-center">Telat</th>
                  <th className="px-4 py-3.5 text-center">Izin / Sakit</th>
                  <th className="px-4 py-3.5 text-center">Alpha</th>
                  <th className="px-4 py-3.5 text-right font-bold">Total Poin</th>
                  <th className="px-4 py-3.5 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredData.map((row) => {
                  const isCurrent = currentUser.id === row.userId;
                  const isRank1 = row.rank === 1;
                  const isRank2 = row.rank === 2;
                  const isRank3 = row.rank === 3;

                  return (
                    <tr
                      key={row.userId}
                      onClick={() =>
                        setSelectedUserForHistory({
                          id: row.userId,
                          nama: row.namaLengkap,
                          prn: row.prn,
                        })
                      }
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${
                        isCurrent ? 'bg-brand/5 dark:bg-brand/10 font-medium' : ''
                      }`}
                    >
                      {/* Peringkat */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {isRank1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent text-ink font-black text-xs shadow-2xs">
                            1
                          </span>
                        ) : isRank2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs">
                            2
                          </span>
                        ) : isRank3 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-900/20 text-amber-700 dark:text-amber-400 font-bold text-xs">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-500 font-semibold">{row.rank}</span>
                        )}
                      </td>

                      {/* Info Anggota */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-[11px] shrink-0 overflow-hidden">
                            {row.avatarUrl ? (
                              <img src={row.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              getInitials(row.namaLengkap)
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              {row.namaLengkap}
                              {isCurrent && (
                                <span className="text-[10px] bg-brand text-white px-1.5 py-0.2 rounded font-bold">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {row.prn} {row.nim ? `• NIM ${row.nim}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Departemen & Jabatan */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {row.departmentName || '-'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {row.jabatan} (Gen {row.generasi})
                        </div>
                      </td>

                      {/* Hadir */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {row.hadirCount}
                        </span>
                      </td>

                      {/* Telat */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          {row.telatCount}
                        </span>
                      </td>

                      {/* Izin/Sakit */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="text-slate-600 dark:text-slate-400">
                          {row.izinCount + row.sakitCount}
                        </span>
                      </td>

                      {/* Alpha */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            row.alphaCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
                          }`}
                        >
                          {row.alphaCount}
                        </span>
                      </td>

                      {/* Total Poin */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg font-black text-xs ${
                            row.totalPoints > 0
                              ? 'bg-brand/10 text-brand dark:text-accent font-extrabold'
                              : row.totalPoints < 0
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {row.totalPoints} Pts
                        </span>
                      </td>

                      {/* Action Chevron */}
                      <td className="px-4 py-3 text-right whitespace-nowrap text-slate-400">
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Pengaturan Bobot (Super Admin) */}
      {isSuperAdmin && (
        <PointsConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          onConfigSaved={() => loadLeaderboard()}
        />
      )}

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
