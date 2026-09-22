# Graph Report - PSDM-PORTAL  (2026-09-23)

## Corpus Check
- 69 files · ~53,406 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .ico 2, .example 1, (none) 1)

## Summary
- 403 nodes · 1036 edges · 20 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e356225c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- routes/permissions.ts
- relations.ts
- package.json
- react
- integration.test.ts
- dependencies
- types.ts
- types/index.ts
- App.tsx
- routes/users.ts
- compilerOptions
- imageCompressor.ts
- AuthUser
- Panduan Deployment Edge Serverless (Cloudflare Workers, Turso & Backblaze B2)
- PSDM.web 2.0 - Dokumen Handover & Ringkasan Arsitektur (Tahap 6)
- seed.ts
- api.ts
- users
- ActivityItem
- PengurusView.tsx

## God Nodes (most connected - your core abstractions)
1. `AuthUser` - 42 edges
2. `react` - 28 edges
3. `lucide-react` - 27 edges
4. `ActivityItem` - 25 edges
5. `drizzle-orm` - 21 edges
6. `users` - 17 edges
7. `compilerOptions` - 16 edges
8. `PermissionStatus` - 14 edges
9. `PermissionRecord` - 14 edges
10. `hono` - 13 edges

## Surprising Connections (you probably didn't know these)
- `4. Struktur Database Ternormalisasi (3NF)` --references--> `Fakultas`  [INFERRED]
  HANDOVER.md → src/db/schema/academic.ts
- `CreateActivityModalProps` --references--> `ActivityItem`  [EXTRACTED]
  src/components/activities/CreateActivityModal.tsx → src/types/index.ts
- `SidebarProps` --references--> `AuthUser`  [EXTRACTED]
  src/components/layout/Sidebar.tsx → src/types/index.ts
- `MemberListModalProps` --references--> `AuthUser`  [EXTRACTED]
  src/components/members/MemberListModal.tsx → src/types/index.ts
- `ProfileModalProps` --references--> `AuthUser`  [EXTRACTED]
  src/components/profile/ProfileModal.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (20 total, 0 thin omitted)

### Community 0 - "routes/permissions.ts"
Cohesion: 0.12
Nodes (24): hono, src_db_schema_index_activities, src_db_schema_index_attendances, src_db_schema_index_attendancestatusenum, src_db_schema_index_permissionstatusenum, src_db_schema_index_users, authMiddleware, requireRole() (+16 more)

### Community 1 - "relations.ts"
Cohesion: 0.13
Nodes (21): drizzle-orm, Fakultas, NewFakultas, NewProgramStudi, ProgramStudi, Department, departments, NewDepartment (+13 more)

### Community 2 - "package.json"
Cohesion: 0.04
Nodes (45): devDependencies, autoprefixer, drizzle-kit, esbuild, tailwindcss, tsx, @types/node, @types/react (+37 more)

### Community 3 - "react"
Cohesion: 0.12
Nodes (17): lucide-react, react, CreateActivityModal(), CreateActivityModalProps, LoginForm(), LoginFormProps, Sidebar(), SidebarProps (+9 more)

### Community 4 - "integration.test.ts"
Cohesion: 0.08
Nodes (34): @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, AuditModal(), AuditModalProps, DiagnosticCardItem, INITIAL_ITEMS, seed(), activitySchema (+26 more)

### Community 5 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, dotenv, drizzle-orm, drizzle-zod, @google/genai, hono (+11 more)

### Community 6 - "types.ts"
Cohesion: 0.11
Nodes (20): @libsql/client, AppDatabase, createDb(), DatabaseEnv, src_db_schema_index_pjdepartment, src_db_schema_index_session, src_db_schema_index_user, PjDepartment (+12 more)

### Community 7 - "types/index.ts"
Cohesion: 0.21
Nodes (16): DeleteTarget, EditTarget, MasterDataTab, MasterDataView(), MasterDataViewProps, MemberFormModal(), MemberFormModalProps, MemberImportModal() (+8 more)

### Community 8 - "App.tsx"
Cohesion: 0.17
Nodes (19): ActiveSection, MainAppContent(), checkAuthSession(), AttendanceImportModal(), AttendanceScannerModal(), AdminView(), SuperAdminView(), PermissionsView() (+11 more)

### Community 9 - "routes/users.ts"
Cohesion: 0.14
Nodes (18): @hono/zod-validator, src_db_schema_index_programstudi, src_db_schema_index_sessions, src_db_schema_index_userrole, src_db_schema_index_userroleenum, sessions, CachedSessionUser, invalidateSessionCache() (+10 more)

### Community 10 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 11 - "imageCompressor.ts"
Cohesion: 0.40
Nodes (5): PermissionFormModal(), compressImageFile(), CompressionResult, CompressOptions, formatFileSize()

### Community 12 - "AuthUser"
Cohesion: 0.29
Nodes (12): AdminViewProps, SuperAdminViewProps, Header(), HeaderProps, PermissionListTable(), PermissionListTableProps, PermissionsViewProps, PermissionStatus (+4 more)

### Community 13 - "Panduan Deployment Edge Serverless (Cloudflare Workers, Turso & Backblaze B2)"
Cohesion: 0.25
Nodes (7): 1. Prasyarat Akun & Peralatan CLI, 2. Setup Database Turso (Edge libSQL 3NF), 3. Setup Bucket Backblaze B2 (Penyimpanan Berkas Izin Mahasiswa), 4. Konfigurasi Rahasia di Cloudflare Workers, 5. Build & Rilis ke Cloudflare Workers, 6. Verifikasi Pasca-Deployment, Panduan Deployment Edge Serverless (Cloudflare Workers, Turso & Backblaze B2)

### Community 14 - "PSDM.web 2.0 - Dokumen Handover & Ringkasan Arsitektur (Tahap 6)"
Cohesion: 0.25
Nodes (7): 1. Ikhtisar Sistem, 2. Arsitektur Teknologi & Edge Stack, 3. Matriks Hak Akses (Role-Based Access Control / RBAC), 4. Struktur Database Ternormalisasi (3NF), 5. Ringkasan Hasil Pengujian Integrasi (Tahap 6), 6. Audit & Health Panel Langsung pada Aplikasi, PSDM.web 2.0 - Dokumen Handover & Ringkasan Arsitektur (Tahap 6)

### Community 15 - "seed.ts"
Cohesion: 0.16
Nodes (14): zod, db, src_db_schema_index_departments, src_db_schema_index_fakultas, src_db_schema_index_permissions, src_db_schema_index_pjdepartments, pjDepartments, db (+6 more)

### Community 16 - "api.ts"
Cohesion: 0.21
Nodes (9): xlsx, AttendanceImportModalProps, ParsedAttendanceRow, PermissionFormModalProps, AttendanceStatus, api, getStoredToken(), request() (+1 more)

### Community 17 - "users"
Cohesion: 0.17
Nodes (12): activities, Activity, NewActivity, Attendance, attendances, attendanceStatusEnum, NewAttendance, NewPermission (+4 more)

### Community 18 - "ActivityItem"
Cohesion: 0.29
Nodes (10): ActivitiesView(), ActivitiesViewProps, ActivityCard(), ActivityCardProps, ActivityDetailModal(), ActivityDetailModalProps, AttendanceScannerModalProps, UserRole (+2 more)

### Community 19 - "PengurusView.tsx"
Cohesion: 0.67
Nodes (3): PengurusView(), PengurusViewProps, AttendanceRecord

## Knowledge Gaps
- **161 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+156 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 180 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `drizzle-orm` connect `relations.ts` to `routes/permissions.ts`, `package.json`, `types.ts`, `routes/users.ts`, `seed.ts`, `users`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `package.json`, `integration.test.ts`, `types/index.ts`, `App.tsx`, `AuthUser`, `api.ts`, `ActivityItem`, `PengurusView.tsx`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _161 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `routes/permissions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12298387096774194 - nodes in this community are weakly interconnected._
- **Should `relations.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12535612535612536 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04336734693877551 - nodes in this community are weakly interconnected._