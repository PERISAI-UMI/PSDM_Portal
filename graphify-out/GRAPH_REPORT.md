# Graph Report - PSDM-PORTAL  (2026-09-23)

## Corpus Check
- 68 files · ~50,714 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .ico 2, .example 1, (none) 1)

## Summary
- 399 nodes · 1005 edges · 23 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f2f5273e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- routes/permissions.ts
- relations.ts
- package.json
- App.tsx
- integration.test.ts
- dependencies
- types.ts
- routes/users.ts
- Toast.tsx
- middleware/auth.ts
- compilerOptions
- PermissionFormModal.tsx
- devDependencies
- Panduan Deployment Edge Serverless (Cloudflare Workers, Turso & Backblaze B2)
- PSDM.web 2.0 - Dokumen Handover & Ringkasan Arsitektur (Tahap 6)
- seed.ts
- ActivityItem
- routes/attendances.ts
- react
- api.ts
- AuthUser
- types/index.ts
- ActivitiesView.tsx

## God Nodes (most connected - your core abstractions)
1. `AuthUser` - 37 edges
2. `react` - 27 edges
3. `lucide-react` - 26 edges
4. `ActivityItem` - 23 edges
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
- `ActivitiesViewProps` --references--> `ActivityItem`  [EXTRACTED]
  src/components/activities/ActivitiesView.tsx → src/types/index.ts
- `ActivitiesViewProps` --references--> `AuthUser`  [EXTRACTED]
  src/components/activities/ActivitiesView.tsx → src/types/index.ts
- `ActivityCardProps` --references--> `ActivityItem`  [EXTRACTED]
  src/components/activities/ActivityCard.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (23 total, 0 thin omitted)

### Community 0 - "routes/permissions.ts"
Cohesion: 0.18
Nodes (16): hono, zod, createDb(), src_db_schema_index_permissionstatusenum, src_db_schema_index_users, requireRole(), dbMiddleware, activitiesRouter (+8 more)

### Community 1 - "relations.ts"
Cohesion: 0.12
Nodes (24): drizzle-orm, Fakultas, NewFakultas, NewProgramStudi, ProgramStudi, Activity, NewActivity, Department (+16 more)

### Community 2 - "package.json"
Cohesion: 0.06
Nodes (35): name, private, scripts, build, clean, deploy, dev, lint (+27 more)

### Community 3 - "App.tsx"
Cohesion: 0.15
Nodes (16): ActiveSection, CreateActivityModal(), CreateActivityModalProps, AdminView(), SuperAdminView(), DeleteTarget, EditTarget, MasterDataTab (+8 more)

### Community 4 - "integration.test.ts"
Cohesion: 0.07
Nodes (37): @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, AuditModal(), AuditModalProps, DiagnosticCardItem, INITIAL_ITEMS, NewPermission, Permission (+29 more)

### Community 5 - "dependencies"
Cohesion: 0.11
Nodes (19): dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, dotenv, drizzle-orm, drizzle-zod, @google/genai, hono (+11 more)

### Community 6 - "types.ts"
Cohesion: 0.16
Nodes (12): @libsql/client, AppDatabase, DatabaseEnv, src_db_schema_index_pjdepartment, src_db_schema_index_session, src_db_schema_index_user, PjDepartment, Session (+4 more)

### Community 7 - "routes/users.ts"
Cohesion: 0.14
Nodes (14): src_db_schema_index_userroleenum, userRoleEnum, authMiddleware, B2AuthCache, B2AuthorizeResponse, B2GetUploadUrlResponse, getB2Credentials(), handleStorageFileStream() (+6 more)

### Community 8 - "Toast.tsx"
Cohesion: 0.16
Nodes (14): MainAppContent(), checkAuthSession(), AttendanceScannerModal(), ToastContext, ToastContextType, ToastItem, ToastProvider(), ToastType (+6 more)

### Community 9 - "middleware/auth.ts"
Cohesion: 0.15
Nodes (16): @hono/zod-validator, src_db_schema_index_programstudi, src_db_schema_index_userrole, sessions, CachedSessionUser, invalidateSessionCache(), SESSION_COOKIE_NAME, sessionMicroCache (+8 more)

### Community 10 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 11 - "PermissionFormModal.tsx"
Cohesion: 0.39
Nodes (6): PermissionFormModal(), PermissionFormModalProps, compressImageFile(), CompressionResult, CompressOptions, formatFileSize()

### Community 12 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, autoprefixer, drizzle-kit, esbuild, tailwindcss, tsx, @types/node, @types/react (+3 more)

### Community 13 - "Panduan Deployment Edge Serverless (Cloudflare Workers, Turso & Backblaze B2)"
Cohesion: 0.25
Nodes (7): 1. Prasyarat Akun & Peralatan CLI, 2. Setup Database Turso (Edge libSQL 3NF), 3. Setup Bucket Backblaze B2 (Penyimpanan Berkas Izin Mahasiswa), 4. Konfigurasi Rahasia di Cloudflare Workers, 5. Build & Rilis ke Cloudflare Workers, 6. Verifikasi Pasca-Deployment, Panduan Deployment Edge Serverless (Cloudflare Workers, Turso & Backblaze B2)

### Community 14 - "PSDM.web 2.0 - Dokumen Handover & Ringkasan Arsitektur (Tahap 6)"
Cohesion: 0.25
Nodes (7): 1. Ikhtisar Sistem, 2. Arsitektur Teknologi & Edge Stack, 3. Matriks Hak Akses (Role-Based Access Control / RBAC), 4. Struktur Database Ternormalisasi (3NF), 5. Ringkasan Hasil Pengujian Integrasi (Tahap 6), 6. Audit & Health Panel Langsung pada Aplikasi, PSDM.web 2.0 - Dokumen Handover & Ringkasan Arsitektur (Tahap 6)

### Community 15 - "seed.ts"
Cohesion: 0.16
Nodes (13): db, src_db_schema_index_activities, src_db_schema_index_attendances, src_db_schema_index_fakultas, src_db_schema_index_permissions, src_db_schema_index_pjdepartments, src_db_schema_index_sessions, permissions (+5 more)

### Community 16 - "ActivityItem"
Cohesion: 0.36
Nodes (10): AdminViewProps, SuperAdminViewProps, PermissionListTable(), PermissionListTableProps, PermissionsViewProps, PermissionStatus, ActivityItem, PermissionRecord (+2 more)

### Community 17 - "routes/attendances.ts"
Cohesion: 0.16
Nodes (11): activities, Attendance, attendances, attendanceStatusEnum, NewAttendance, src_db_schema_index_attendancestatusenum, src_db_schema_index_departments, attendancesRouter (+3 more)

### Community 18 - "react"
Cohesion: 0.31
Nodes (8): lucide-react, react, LoginForm(), LoginFormProps, AvatarCropModal(), AvatarCropModalProps, ConfirmModal(), ConfirmModalProps

### Community 19 - "api.ts"
Cohesion: 0.23
Nodes (8): PengurusView(), PengurusViewProps, AttendanceStatus, api, getStoredToken(), request(), AttendanceRecord, src_types_index_attendancestatus

### Community 20 - "AuthUser"
Cohesion: 0.19
Nodes (9): AttendanceScannerModalProps, Header(), HeaderProps, Sidebar(), SidebarProps, MemberListModalProps, ProfileModalProps, ProfileViewProps (+1 more)

### Community 21 - "types/index.ts"
Cohesion: 0.41
Nodes (8): MemberFormModal(), MemberFormModalProps, MemberImportModal(), MemberImportModalProps, ParsedUserRow, MembersViewProps, DepartmentItem, ProgramStudiItem

### Community 22 - "ActivitiesView.tsx"
Cohesion: 0.29
Nodes (8): ActivitiesView(), ActivitiesViewProps, ActivityCard(), ActivityCardProps, ActivityDetailModal(), ActivityDetailModalProps, UserRole, src_types_index_userrole

## Knowledge Gaps
- **161 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+156 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 180 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `drizzle-orm` connect `relations.ts` to `routes/permissions.ts`, `package.json`, `integration.test.ts`, `types.ts`, `routes/users.ts`, `middleware/auth.ts`, `seed.ts`, `routes/attendances.ts`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `package.json`, `App.tsx`, `integration.test.ts`, `Toast.tsx`, `PermissionFormModal.tsx`, `ActivityItem`, `api.ts`, `AuthUser`, `types/index.ts`, `ActivitiesView.tsx`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _161 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `relations.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11827956989247312 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.0553306342780027 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14619883040935672 - nodes in this community are weakly interconnected._