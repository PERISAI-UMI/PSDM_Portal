# Graph Report - PSDM-PORTAL  (2026-09-23)

## Corpus Check
- 66 files · ~48,568 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .ico 2, .example 1, (none) 1)

## Summary
- 390 nodes · 971 edges · 19 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cf469aab`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- routes/attendances.ts
- relations.ts
- package.json
- integration.test.ts
- dependencies
- types.ts
- routes/users.ts
- AttendanceScannerModal.tsx
- compilerOptions
- devDependencies
- Panduan Deployment Edge Serverless (Cloudflare Workers, Turso & Backblaze B2)
- PSDM.web 2.0 - Dokumen Handover & Ringkasan Arsitektur (Tahap 6)
- routes/permissions.ts
- AuthUser
- PermissionListTable.tsx
- MembersView.tsx
- types/index.ts
- App.tsx
- ActivityItem

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
- `ActivitiesViewProps` --references--> `AuthUser`  [EXTRACTED]
  src/components/activities/ActivitiesView.tsx → src/types/index.ts
- `CreateActivityModalProps` --references--> `ActivityItem`  [EXTRACTED]
  src/components/activities/CreateActivityModal.tsx → src/types/index.ts
- `AttendanceScannerModalProps` --references--> `ActivityItem`  [EXTRACTED]
  src/components/attendances/AttendanceScannerModal.tsx → src/types/index.ts
- `AttendanceScannerModalProps` --references--> `AuthUser`  [EXTRACTED]
  src/components/attendances/AttendanceScannerModal.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (19 total, 0 thin omitted)

### Community 0 - "routes/attendances.ts"
Cohesion: 0.12
Nodes (22): hono, @hono/zod-validator, zod, src_db_schema_index_attendancestatusenum, src_db_schema_index_pjdepartments, app, requireRole(), activitiesRouter (+14 more)

### Community 1 - "relations.ts"
Cohesion: 0.09
Nodes (33): drizzle-orm, Fakultas, NewFakultas, NewProgramStudi, activities, Activity, NewActivity, Attendance (+25 more)

### Community 2 - "package.json"
Cohesion: 0.06
Nodes (35): name, private, scripts, build, clean, deploy, dev, lint (+27 more)

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
Nodes (19): ProgramStudi, src_db_schema_index_departments, src_db_schema_index_programstudi, src_db_schema_index_sessions, src_db_schema_index_userrole, src_db_schema_index_userroleenum, sessions, authMiddleware (+11 more)

### Community 8 - "AttendanceScannerModal.tsx"
Cohesion: 0.17
Nodes (15): MainAppContent(), checkAuthSession(), AttendanceScannerModal(), AttendanceScannerModalProps, ToastContext, ToastContextType, ToastItem, ToastProvider() (+7 more)

### Community 10 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

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
Cohesion: 0.17
Nodes (13): src_db_schema_index_activities, src_db_schema_index_attendances, src_db_schema_index_fakultas, src_db_schema_index_permissions, src_db_schema_index_permissionstatusenum, src_db_schema_index_users, db, UMI_ACADEMIC_DATA (+5 more)

### Community 20 - "AuthUser"
Cohesion: 0.22
Nodes (9): lucide-react, Header(), HeaderProps, Sidebar(), SidebarProps, MemberListModalProps, ProfileModalProps, ProfileViewProps (+1 more)

### Community 21 - "PermissionListTable.tsx"
Cohesion: 0.26
Nodes (12): AdminView(), AdminViewProps, SuperAdminView(), SuperAdminViewProps, PermissionListTable(), PermissionListTableProps, PermissionsView(), PermissionsViewProps (+4 more)

### Community 22 - "MembersView.tsx"
Cohesion: 0.24
Nodes (12): MemberFormModal(), MemberFormModalProps, MemberImportModal(), MemberImportModalProps, ParsedUserRow, MembersView(), MembersViewProps, ConfirmModal() (+4 more)

### Community 23 - "types/index.ts"
Cohesion: 0.16
Nodes (14): PengurusView(), PengurusViewProps, DeleteTarget, EditTarget, MasterDataTab, MasterDataView(), MasterDataViewProps, AttendanceStatus (+6 more)

### Community 24 - "App.tsx"
Cohesion: 0.25
Nodes (12): react, ActiveSection, LoginForm(), LoginFormProps, PermissionFormModal(), ProfileModal(), ProfileView(), api (+4 more)

### Community 25 - "ActivityItem"
Cohesion: 0.23
Nodes (11): ActivitiesView(), ActivitiesViewProps, ActivityCard(), ActivityCardProps, ActivityDetailModal(), ActivityDetailModalProps, CreateActivityModal(), CreateActivityModalProps (+3 more)

## Knowledge Gaps
- **157 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+152 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 174 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `drizzle-orm` connect `relations.ts` to `routes/attendances.ts`, `package.json`, `types.ts`, `routes/users.ts`, `routes/permissions.ts`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `react` connect `App.tsx` to `package.json`, `integration.test.ts`, `AttendanceScannerModal.tsx`, `AuthUser`, `PermissionListTable.tsx`, `MembersView.tsx`, `types/index.ts`, `ActivityItem`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _157 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `routes/attendances.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11904761904761904 - nodes in this community are weakly interconnected._
- **Should `relations.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09175377468060394 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.0553306342780027 - nodes in this community are weakly interconnected._