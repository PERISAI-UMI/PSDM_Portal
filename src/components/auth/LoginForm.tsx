import React, { useState } from 'react';
import { Lock, ArrowRight, User, Shield } from 'lucide-react';

interface LoginFormProps {
  onLogin: (prn: string, password?: string) => Promise<void>;
  error?: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, error }) => {
  const [prn, setPrn] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prn.trim() || !password) return;
    setLoading(true);
    await onLogin(prn.trim(), password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-slate-50/50">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200/90 shadow-sm p-7 sm:p-8">
        {/* Brand Header */}
        <div className="text-center mb-7">
          <div className="w-11 h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Portal PSDM</h1>
          <p className="text-xs text-slate-500 mt-0.5">Masuk untuk mengakses sistem</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              PRN
            </label>
            <div className="relative">
              <input
                type="text"
                value={prn}
                onChange={(e) => setPrn(e.target.value.toUpperCase())}
                placeholder="PRN0001"
                required
                autoFocus
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 font-mono transition-colors"
              />
              <User className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kata Sandi
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs cursor-pointer pt-2"
          >
            {loading ? 'Memproses...' : 'Masuk'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
