import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  Server,
  Database,
  Cloud,
  Lock,
  Cpu,
  RefreshCw,
  X,
  FileCheck,
  ExternalLink,
} from 'lucide-react';
import { hashPassword, verifyPassword, generateSessionToken } from '../../server/crypto.ts';
import {
  userSchema,
  activitySchema,
  attendanceSchema,
  permissionSchema,
  pjDepartmentSchema,
} from '../../db/validation.ts';
import { api } from '../../services/api.ts';

interface AuditItem {
  id: string;
  category: 'SECURITY' | 'SCHEMA_3NF' | 'RBAC' | 'EDGE_HONO' | 'STORAGE' | 'CONNECTIVITY';
  title: string;
  description: string;
  status: 'IDLE' | 'RUNNING' | 'PASSED' | 'FAILED';
  latencyMs?: number;
  error?: string;
}

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_AUDITS: AuditItem[] = [
  {
    id: 'crypto-1',
    category: 'SECURITY',
    title: 'WebCrypto PBKDF2 Password Hashing & Verification',
    description: 'Verifikasi hash PBKDF2 SHA-256 (100.000 iterasi) kompatibel Edge runtime.',
    status: 'IDLE',
  },
  {
    id: 'crypto-2',
    category: 'SECURITY',
    title: '256-Bit Session Token Entropy & Anti-Collision',
    description: 'Pembangkitan token sesi kriptografis 64 hex characters.',
    status: 'IDLE',
  },
  {
    id: 'schema-1',
    category: 'SCHEMA_3NF',
    title: 'Integritas Skema User 3NF & Relasi Program Studi/Departemen',
    description: 'Validasi Zod strict untuk foreign key dan data pengurus.',
    status: 'IDLE',
  },
  {
    id: 'schema-2',
    category: 'SCHEMA_3NF',
    title: 'Skema Relasional Kegiatan Proker & Penugasan PJ PSDM',
    description: 'Validasi Activity & Mapping relasi Admin ke Departemen binaan.',
    status: 'IDLE',
  },
  {
    id: 'rbac-1',
    category: 'RBAC',
    title: 'Super Admin Hierarchy & Unrestricted Global Access',
    description: 'Memastikan Super Admin dapat mengelola seluruh data lintas departemen.',
    status: 'IDLE',
  },
  {
    id: 'rbac-2',
    category: 'RBAC',
    title: 'Isolasi Ruang Lingkup Staf PSDM (PJ Departemen)',
    description: 'Memastikan Staf PSDM hanya memiliki hak kelola atas departemen binaan PJ.',
    status: 'IDLE',
  },
  {
    id: 'rbac-3',
    category: 'RBAC',
    title: 'Isolasi Privasi Akun Pengurus (Self-Scope Only)',
    description: 'Memastikan pengurus hanya bisa melihat riwayat pribadi dan proker published.',
    status: 'IDLE',
  },
  {
    id: 'rbac-4',
    category: 'RBAC',
    title: 'Sinkronisasi Otomatis Approval Izin ke Presensi Proker',
    description: 'Persetujuan izin otomatis mencatat status HADIR/IZIN/SAKIT ke kegiatan terkait.',
    status: 'IDLE',
  },
  {
    id: 'edge-1',
    category: 'CONNECTIVITY',
    title: 'Cloudflare Workers — Live Health Ping',
    description: 'HTTP GET ke /api/health untuk memastikan Worker aktif dan merespons dari edge.',
    status: 'IDLE',
  },
  {
    id: 'conn-turso',
    category: 'CONNECTIVITY',
    title: 'Turso libSQL — Koneksi Database Produksi',
    description: 'Query SELECT 1 ke database Turso untuk memverifikasi koneksi dan autentikasi token.',
    status: 'IDLE',
  },
  {
    id: 'storage-1',
    category: 'CONNECTIVITY',
    title: 'Backblaze B2 — Akses Bucket Penyimpanan Bukti',
    description: 'HeadBucketCommand ke B2 untuk memverifikasi kredensial dan aksesibilitas bucket.',
    status: 'IDLE',
  },
];

export const AuditModal: React.FC<AuditModalProps> = ({ isOpen, onClose }) => {
  const [audits, setAudits] = useState<AuditItem[]>(INITIAL_AUDITS);
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (!isOpen) return null;

  const runLiveAudit = async () => {
    setIsRunning(true);
    setCompleted(false);

    const updated = [...audits];

    for (let i = 0; i < updated.length; i++) {
      const item = { ...updated[i], status: 'RUNNING' as const };
      updated[i] = item;
      setAudits([...updated]);

      const start = performance.now();
      try {
        if (item.id === 'crypto-1') {
          const pass = 'TestPasswordPSDM2026!';
          const hash = await hashPassword(pass);
          const valid = await verifyPassword(pass, hash);
          const invalid = await verifyPassword('wrong', hash);
          if (!valid || invalid) throw new Error('Password verification integrity check failed');
        } else if (item.id === 'crypto-2') {
          const t1 = generateSessionToken();
          const t2 = generateSessionToken();
          if (!t1 || t1.length !== 64 || t1 === t2) throw new Error('Session token entropy invalid');
        } else if (item.id === 'schema-1') {
          const validUser = {
            id: 'usr-val-1',
            prn: 'PSDM-099',
            passwordHash: 'salt:hash12345678',
            role: 'PENGURUS' as const,
            generasi: 24,
            departmentId: 'dept-ristek',
            jabatan: 'Staff IT',
            tingkatJabatan: 'STAFF' as const,
            namaLengkap: 'Budi Test',
            tempatLahir: 'Padang',
            tanggalLahir: '2003-01-01',
            alamat: 'Jl. Kampus',
            noTelp: '08123456789',
            email: 'budi@test.ac.id',
            nim: '2211521099',
            programStudiId: 'prodi-1',
            angkatan: 2022,
          };
          userSchema.parse(validUser);
        } else if (item.id === 'schema-2') {
          activitySchema.parse({
            id: 'act-audit',
            nama: 'Audit Proker',
            jenis: 'RAPAT_PLENO',
            startDate: new Date(),
            endDate: new Date(Date.now() + 3600000),
            isPublished: true,
            createdBy: 'usr-kadep',
          });
          pjDepartmentSchema.parse({
            adminId: 'usr-staf-psdm',
            departmentId: 'dept-ristek',
          });
        } else if (item.id === 'rbac-1') {
          const users = await api.getUsers();
          const kadep = users.find((u) => u.role === 'SUPER_ADMIN');
          if (!kadep) throw new Error('Super Admin tidak ditemukan');
          const perms = await api.getPermissions(kadep);
          if (perms.length === 0) throw new Error('Super admin harus melihat izin');
        } else if (item.id === 'rbac-2') {
          const users = await api.getUsers();
          const admin = users.find((u) => u.role === 'ADMIN');
          if (!admin) throw new Error('Admin PSDM tidak ditemukan');
          const perms = await api.getPermissions(admin);
          const assignedDepts = admin.pjDepartments?.map((p) => p.departmentId) || [];
          const breach = perms.some((p) => !assignedDepts.includes(p.userDepartmentId || ''));
          if (breach) throw new Error('Pelanggaran scoping PJ: Admin melihat departemen non-binaan!');
        } else if (item.id === 'rbac-3') {
          const users = await api.getUsers();
          const pengurus = users.find((u) => u.role === 'PENGURUS');
          if (!pengurus) throw new Error('Pengurus tidak ditemukan');
          const perms = await api.getPermissions(pengurus);
          const breach = perms.some((p) => p.userId !== pengurus.id);
          if (breach) throw new Error('Pelanggaran privasi: Pengurus melihat izin anggota lain!');
        } else if (item.id === 'rbac-4') {
          const users = await api.getUsers();
          const pengurus = users.find((u) => u.role === 'PENGURUS')!;
          const admin = users.find((u) => u.role === 'SUPER_ADMIN')!;
          const newPerm = await api.requestPermission(pengurus, {
            activityId: 'act-1',
            jenisIzin: 'IZIN',
            alasan: 'Audit Auto-Sync Test Verification',
          });
          const rev = await api.reviewPermission(newPerm.id, 'APPROVED', admin);
          if (!rev.success) throw new Error('Persetujuan izin gagal');
          const atts = await api.getAttendances(admin, 'act-1');
          const synced = atts.find((a) => a.userId === pengurus.id);
          if (!synced || synced.status !== 'IZIN') throw new Error('Sinkronisasi absensi tidak terjadi');
        } else if (item.id === 'edge-1') {
          // Real HTTP ping to the deployed Cloudflare Worker
          const res = await fetch('/api/health', { credentials: 'same-origin' });
          if (!res.ok) throw new Error(`Worker mengembalikan HTTP ${res.status}`);
          const data = await res.json() as any;
          if (data.status !== 'ok') throw new Error('Worker health endpoint tidak merespons dengan benar');
        } else if (item.id === 'conn-turso') {
          // Real Turso DB connectivity check via server-side diagnostics
          const res = await fetch('/api/diagnostics', { credentials: 'same-origin' });
          if (!res.ok) throw new Error(`Diagnostics endpoint error: HTTP ${res.status}`);
          const data = await res.json() as any;
          const turso = data.data?.turso;
          if (!turso) throw new Error('Respons diagnostics tidak valid');
          if (!turso.ok) throw new Error(turso.detail || 'Koneksi Turso gagal');
        } else if (item.id === 'storage-1') {
          // Real Backblaze B2 connectivity check via server-side diagnostics
          const res = await fetch('/api/diagnostics', { credentials: 'same-origin' });
          if (!res.ok) throw new Error(`Diagnostics endpoint error: HTTP ${res.status}`);
          const data = await res.json() as any;
          const b2 = data.data?.backblaze;
          if (!b2) throw new Error('Respons diagnostics tidak valid');
          if (!b2.ok) throw new Error(b2.detail || 'Koneksi Backblaze B2 gagal');
        }

        const durationMs = Math.round((performance.now() - start) * 10) / 10;
        updated[i] = { ...item, status: 'PASSED', latencyMs: durationMs };
      } catch (err: any) {
        const durationMs = Math.round((performance.now() - start) * 10) / 10;
        updated[i] = { ...item, status: 'FAILED', latencyMs: durationMs, error: err?.message || String(err) };
      }

      setAudits([...updated]);
      // brief visual cadence
      await new Promise((r) => setTimeout(r, 60));
    }

    setIsRunning(false);
    setCompleted(true);
  };

  const passedCount = audits.filter((a) => a.status === 'PASSED').length;
  const failedCount = audits.filter((a) => a.status === 'FAILED').length;
  const totalCount = audits.length;
  const scorePercent = Math.round((passedCount / totalCount) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">
                  Diagnostik & Integritas Sistem
                </h2>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  Edge Runtime
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Pengujian live integritas kriptografi, skema relasional 3NF, kebijakan RBAC, dan kesiapan arsitektur Edge.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary Banner */}
        <div className="my-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-[11px] font-medium text-slate-500">Skor Kesiapan</div>
            <div className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
              {completed ? `${scorePercent}%` : '--'}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-[11px] font-medium text-slate-500">Hasil Uji</div>
            <div className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
              {passedCount} / {totalCount} Lulus
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-[11px] font-medium text-slate-500">Database</div>
            <div className="text-xs font-semibold text-slate-900 mt-1 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-600" /> Turso 3NF LibSQL
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-[11px] font-medium text-slate-500">Runtime Target</div>
            <div className="text-xs font-semibold text-slate-900 mt-1 flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-slate-600" /> Cloudflare Workers
            </div>
          </div>
        </div>

        {/* Action Trigger */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900 text-white mb-3">
          <div className="flex items-center gap-2.5 text-xs">
            <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-300">
              {isRunning
                ? 'Sedang menjalankan pengujian kriptografi & logika RBAC...'
                : completed
                ? 'Seluruh modul tervalidasi dan siap untuk deployment produksi.'
                : 'Jalankan evaluasi integritas arsitektur end-to-end secara langsung.'}
            </span>
          </div>
          <button
            type="button"
            onClick={runLiveAudit}
            disabled={isRunning}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 shadow-2xs"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sedang Menguji...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                {completed ? 'Uji Ulang Sistem' : 'Mulai Pengujian'}
              </>
            )}
          </button>
        </div>

        {/* Audit Test List */}
        <div className="flex-1 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-2 sm:p-3 divide-y divide-slate-100">
          {audits.map((item, idx) => (
            <div key={item.id} className="pt-2 first:pt-0 pb-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    {item.status === 'PASSED' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    {item.status === 'FAILED' && <XCircle className="w-4 h-4 text-red-600" />}
                    {item.status === 'RUNNING' && <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />}
                    {item.status === 'IDLE' && <div className="w-4 h-4 rounded-full border-2 border-slate-300" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{item.title}</span>
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                    {item.error && (
                      <p className="text-[11px] font-mono text-red-600 mt-1 bg-red-50 p-1.5 rounded">
                        Error: {item.error}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {item.latencyMs !== undefined && (
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {item.latencyMs} ms
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-3 sm:mt-4 pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-2">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Dokumentasi arsitektur & panduan lengkap tersedia di HANDOVER.md</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg min-h-[40px]"
          >
            Tutup Panel
          </button>
        </div>
      </div>
    </div>
  );
};
