import React, { useState } from 'react';
import { Lock, ArrowRight, CheckCircle2, User } from 'lucide-react';

interface LoginFormProps {
  onLogin: (prn: string, password?: string) => Promise<void>;
  error?: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, error }) => {
  const [prn, setPrn] = useState('PSDM-001');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prn.trim()) return;
    setLoading(true);
    await onLogin(prn.trim(), password);
    setLoading(false);
  };

  const setDemoUser = (demoPrn: string) => {
    setPrn(demoPrn);
    setPassword('password123');
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-sm mx-auto mb-3 shadow-2xs">
            PS
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Portal PSDM</h1>
          <p className="text-xs text-slate-500 mt-1">
            Sistem Informasi Manajemen Talenta & Presensi Organisasi
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <span className="font-semibold">Perhatian:</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Personal Registration Number (PRN)
            </label>
            <input
              type="text"
              value={prn}
              onChange={(e) => setPrn(e.target.value)}
              placeholder="Contoh: PSDM-001"
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-2xs"
          >
            {loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Selector */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="text-xs font-medium text-slate-500 mb-3 flex items-center justify-between">
            <span>Pilih Akun Simulasi Cepat:</span>
            <span className="text-[11px] font-mono text-slate-400">3 Peran RBAC</span>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setDemoUser('PSDM-001')}
              className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between ${
                prn === 'PSDM-001'
                  ? 'border-slate-900 bg-slate-50 text-slate-900 font-medium'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  prn === 'PSDM-001' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  KD
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Kepala Departemen PSDM</div>
                  <div className="text-[11px] text-slate-500 font-mono">PSDM-001 • Super Admin</div>
                </div>
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                Kadep
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDemoUser('PSDM-002')}
              className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between ${
                prn === 'PSDM-002'
                  ? 'border-slate-900 bg-slate-50 text-slate-900 font-medium'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  prn === 'PSDM-002' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  BG
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Bagas (Staf PSDM)</div>
                  <div className="text-[11px] text-slate-500 font-mono">PSDM-002 • PJ Dept Ristek</div>
                </div>
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                Staf PJ
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDemoUser('RISTEK-001')}
              className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between ${
                prn === 'RISTEK-001'
                  ? 'border-slate-900 bg-slate-50 text-slate-900 font-medium'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  prn === 'RISTEK-001' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  CD
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Citra Dewi</div>
                  <div className="text-[11px] text-slate-500 font-mono">RISTEK-001 • Pengurus Ristek</div>
                </div>
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                Pengurus
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
