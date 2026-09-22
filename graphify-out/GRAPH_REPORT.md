# Graph Report - PSDM-PORTAL  (2026-09-22)

## Corpus Check
- 66 files · ~46,343 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .ico 2, .example 1, (none) 1)

## Summary
- 390 nodes · 956 edges · 20 communities (19 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b645bacf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- routes/attendances.ts
- relations.ts
- package.json
- App.tsx
- integration.test.ts
- dependencies
- types.ts
- routes/users.ts
- AttendanceScannerModal.tsx
- drizzle-orm
- compilerOptions
- seed.ts
- devDependencies
- Panduan Deployment Edge Serverless (Cloudflare Workers, Turso & Backblaze B2)
- PSDM.web 2.0 - Dokumen Handover & Ringkasan Arsitektur (Tahap 6)
- routes/permissions.ts
- scripts
- vite.config.ts
- main.tsx
- dotenv

## God Nodes (most connected - your core abstractions)
1. `AuthUser` - 37 edges
2. `react` - 26 edges
3. `lucide-react` - 25 edges
4. `ActivityItem` - 23 edges
5. `drizzle-orm` - 20 edges
6. `users` - 16 edges
7. `compilerOptions` - 16 edges
8. `PermissionStatus` - 14 edges
9. `PermissionRecord` - 14 edges
10. `hono` - 13 edges

## Surprising Connections (you probably didn't know these)
- `4. Struktur Database Ternormalisasi (3NF)` --references--> `Fakultas`  [INFERRED]
  HANDOVER.md → src/db/schema/academic.ts
- `CreateActivityModalProps` --references--> `ActivityItem`  [EXTRACTED]
  src/components/activities/CreateActivityModal.tsx → src/types/index.ts
- `AttendanceScannerModalProps` --references--> `ActivityItem`  [EXTRACTED]
  src/components/attendances/AttendanceScannerModal.tsx → src/types/index.ts
- `AttendanceScannerModalProps` --references--> `AuthUser`  [EXTRACTED]
  src/components/attendances/AttendanceScannerModal.tsx → src/types/index.ts
- `HeaderProps` --references--> `AuthUser`  [EXTRACTED]
  src/components/layout/Header.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (20 total, 1 thin omitted)

### Community 0 - "routes/attendances.ts"
Cohesion: 0.15
Nodes (18): hono, @hono/zod-validator, src_db_schema_index_activities, src_db_schema_index_attendances, src_db_schema_index_attendancestatusenum, app, requireRole(), activitiesRouter (+10 more)

### Community 1 - "relations.ts"
Cohesion: 0.12
Nodes (20): activities, Activity, NewActivity, Attendance, attendances, attendanceStatusEnum, NewAttendance, NewPermission (+12 more)

### Community 2 - "package.json"
Cohesion: 0.11
Nodes (17): name, private, type, version, autoprefixer, drizzle-zod, esbuild, @google/genai (+9 more)

### Community 3 - "App.tsx"
Cohesion: 0.07
Nodes (62): lucide-react, react, ActiveSection, ActivitiesView(), ActivitiesViewProps, ActivityCard(), ActivityCardProps, ActivityDetailModal() (+54 more)

### Community 4 - "integration.test.ts"
Cohesion: 0.09
Nodes (33): @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, AuditModal(), AuditModalProps, DiagnosticCardItem, INITIAL_ITEMS, seed(), activitySchema (+25 more)

### Community 5 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, dotenv, drizzle-orm, drizzle-zod, @google/genai, hono (+11 more)

### Community 6 - "types.ts"
Cohesion: 0.11
Nodes (20): @libsql/client, AppDatabase, createDb(), DatabaseEnv, src_db_schema_index_pjdepartment, src_db_schema_index_session, src_db_schema_index_user, PjDepartment (+12 more)

### Community 7 - "routes/users.ts"
Cohesion: 0.15
Nodes (19): src_db_schema_index_departments, src_db_schema_index_programstudi, src_db_schema_index_sessions, src_db_schema_index_userrole, src_db_schema_index_userroleenum, src_db_schema_index_users, sessions, authMiddleware (+11 more)

### Community 8 - "AttendanceScannerModal.tsx"
Cohesion: 0.11
Nodes (23): MainAppContent(), checkAuthSession(), AttendanceScannerModal(), AttendanceScannerModalProps, PermissionFormModal(), PermissionFormModalProps, ToastContext, ToastContextType (+15 more)

### Community 9 - "drizzle-orm"
Cohesion: 0.18
Nodes (13): drizzle-orm, Fakultas, NewFakultas, NewProgramStudi, ProgramStudi, Department, departments, NewDepartment (+5 more)

### Community 10 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 11 - "seed.ts"
Cohesion: 0.17
Nodes (11): zod, src_db_schema_index_fakultas, src_db_schema_index_permissions, src_db_schema_index_pjdepartments, db, UMI_ACADEMIC_DATA, assignPjSchema, createDepartmentSchema (+3 more)

### Community 12 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, autoprefixer, drizzle-kit, esbuild, tailwindcss, tsx, @types/node, @types/react (+3 more)

### Community 13 - "Panduan Deployment Edge Serverless (Cloudflare Workers, Turso & Backblaze B2)"
Cohesion: 0.25
Nodes (7): 1. Prasyarat Akun & Peralatan CLI, 2. Setup Database Turso (Edge libSQL 3NF), 3. Setup Bucket Backblaze B2 (Penyimpanan Berkas Izin Mahasiswa), 4. Konfigurasi Rahasia di Cloudflare Workers, 5. Build & Rilis ke Cloudflare Workers, 6. Verifikasi Pasca-Deployment, Panduan Deployment Edge Serverless (Cloudflare Workers, Turso & Backblaze B2)

### Community 14 - "PSDM.web 2.0 - Dokumen Handover & Ringkasan Arsitektur (Tahap 6)"
Cohesion: 0.25
Nodes (7): 1. Ikhtisar Sistem, 2. Arsitektur Teknologi & Edge Stack, 3. Matriks Hak Akses (Role-Based Access Control / RBAC), 4. Struktur Database Ternormalisasi (3NF), 5. Ringkasan Hasil Pengujian Integrasi (Tahap 6), 6. Audit & Health Panel Langsung pada Aplikasi, PSDM.web 2.0 - Dokumen Handover & Ringkasan Arsitektur (Tahap 6)

### Community 15 - "routes/permissions.ts"
Cohesion: 0.29
Nodes (6): src_db_schema_index_permissionstatusenum, permissionStatusEnum, getUploadUrlSchema, permissionsRouter, requestPermissionSchema, reviewPermissionSchema

### Community 16 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, clean, deploy, dev, lint, preview, seed (+1 more)

### Community 17 - "vite.config.ts"
Cohesion: 0.40
Nodes (4): ref_path, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 18 - "main.tsx"
Cohesion: 0.50
Nodes (3): react-dom, App(), src_index

## Knowledge Gaps
- **157 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+152 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 174 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `drizzle-orm` connect `drizzle-orm` to `routes/attendances.ts`, `relations.ts`, `package.json`, `types.ts`, `routes/users.ts`, `seed.ts`, `routes/permissions.ts`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `react` connect `App.tsx` to `AttendanceScannerModal.tsx`, `package.json`, `main.tsx`, `integration.test.ts`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _157 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `routes/attendances.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14855072463768115 - nodes in this community are weakly interconnected._
- **Should `relations.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11956521739130435 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._