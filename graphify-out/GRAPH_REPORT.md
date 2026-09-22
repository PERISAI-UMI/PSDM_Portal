# Graph Report - PSDM-PORTAL  (2026-09-22)

## Corpus Check
- Corpus is ~46,020 words - fits in a single context window. You may not need a graph.

## Summary
- 353 nodes · 853 edges · 15 communities (14 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Backend & Edge API
- Database Schema & ORM
- Build & Configuration
- Application Routing & Auth
- Audit & Diagnostics
- Package Dependencies
- Master Data Management
- Activities & Proker Views
- Attendance & Scanner Module
- Executive & Admin Dashboards
- Member Management
- Permissions Management
- Layout & Navigation
- Profile & User Settings
- UI Components & Utilities

## God Nodes (most connected - your core abstractions)
1. `AuthUser` - 37 edges
2. `react` - 26 edges
3. `lucide-react` - 25 edges
4. `ActivityItem` - 23 edges
5. `users` - 16 edges
6. `compilerOptions` - 16 edges
7. `PermissionStatus` - 14 edges
8. `PermissionRecord` - 14 edges
9. `AppEnv` - 13 edges
10. `drizzle-orm` - 12 edges

## Surprising Connections (you probably didn't know these)
- `HeaderProps` --references--> `AuthUser`  [EXTRACTED]
  src/components/layout/Header.tsx → src/types/index.ts
- `SidebarProps` --references--> `AuthUser`  [EXTRACTED]
  src/components/layout/Sidebar.tsx → src/types/index.ts
- `ProfileModalProps` --references--> `AuthUser`  [EXTRACTED]
  src/components/profile/ProfileModal.tsx → src/types/index.ts
- `ProfileViewProps` --references--> `AuthUser`  [EXTRACTED]
  src/components/profile/ProfileView.tsx → src/types/index.ts
- `ActivitiesViewProps` --references--> `AuthUser`  [EXTRACTED]
  src/components/activities/ActivitiesView.tsx → src/types/index.ts

## Import Cycles
- None detected.

## Communities (15 total, 1 thin omitted)

### Community 0 - "Backend & Edge API"
Cohesion: 0.07
Nodes (64): drizzle-orm, hono, @hono/zod-validator, zod, AppDatabase, createDb(), DatabaseEnv, ProgramStudi (+56 more)

### Community 1 - "Database Schema & ORM"
Cohesion: 0.06
Nodes (36): Fakultas, NewFakultas, NewProgramStudi, Activity, NewActivity, Attendance, attendanceStatusEnum, NewAttendance (+28 more)

### Community 2 - "Build & Configuration"
Cohesion: 0.05
Nodes (37): name, private, scripts, build, clean, deploy, dev, lint (+29 more)

### Community 3 - "Application Routing & Auth"
Cohesion: 0.13
Nodes (17): react, ActiveSection, App(), LoginForm(), LoginFormProps, AdminView(), SuperAdminView(), Sidebar() (+9 more)

### Community 4 - "Audit & Diagnostics"
Cohesion: 0.17
Nodes (19): AuditModal(), AuditModalProps, DiagnosticCardItem, INITIAL_ITEMS, seed(), activitySchema, permissionSchema, pjDepartmentSchema (+11 more)

### Community 5 - "Package Dependencies"
Cohesion: 0.11
Nodes (19): dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, dotenv, drizzle-orm, drizzle-zod, @google/genai, hono (+11 more)

### Community 6 - "Master Data Management"
Cohesion: 0.20
Nodes (15): DeleteTarget, EditTarget, MasterDataTab, MasterDataView(), MasterDataViewProps, MemberFormModal(), MemberFormModalProps, MemberImportModal() (+7 more)

### Community 7 - "Activities & Proker Views"
Cohesion: 0.21
Nodes (13): lucide-react, ActivitiesView(), ActivitiesViewProps, ActivityCard(), ActivityCardProps, ActivityDetailModal(), ActivityDetailModalProps, CreateActivityModal() (+5 more)

### Community 8 - "Attendance & Scanner Module"
Cohesion: 0.18
Nodes (14): MainAppContent(), checkAuthSession(), AttendanceScannerModal(), ToastContext, ToastContextType, ToastItem, ToastProvider(), ToastType (+6 more)

### Community 9 - "Executive & Admin Dashboards"
Cohesion: 0.29
Nodes (10): AdminViewProps, SuperAdminViewProps, MemberListModalProps, PermissionListTable(), PermissionListTableProps, PermissionsViewProps, PermissionStatus, AuthUser (+2 more)

### Community 10 - "Member Management"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 11 - "Permissions Management"
Cohesion: 0.26
Nodes (7): PengurusView(), PengurusViewProps, AttendanceStatus, api, getStoredToken(), request(), AttendanceRecord

### Community 12 - "Layout & Navigation"
Cohesion: 0.18
Nodes (11): devDependencies, autoprefixer, drizzle-kit, esbuild, tailwindcss, tsx, @types/node, @types/react (+3 more)

### Community 13 - "Profile & User Settings"
Cohesion: 0.48
Nodes (5): PermissionFormModal(), compressImageFile(), CompressionResult, CompressOptions, formatFileSize()

## Knowledge Gaps
- **149 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+144 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 156 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Package Dependencies` to `Build & Configuration`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `react` connect `Application Routing & Auth` to `Build & Configuration`, `Audit & Diagnostics`, `Master Data Management`, `Activities & Proker Views`, `Attendance & Scanner Module`, `Executive & Admin Dashboards`, `Permissions Management`, `Profile & User Settings`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `Activities & Proker Views` to `Build & Configuration`, `Application Routing & Auth`, `Audit & Diagnostics`, `Master Data Management`, `Attendance & Scanner Module`, `Executive & Admin Dashboards`, `Permissions Management`, `Profile & User Settings`, `UI Components & Utilities`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _149 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Backend & Edge API` be split into smaller, more focused modules?**
  _Cohesion score 0.06699970614163973 - nodes in this community are weakly interconnected._
- **Should `Database Schema & ORM` be split into smaller, more focused modules?**
  _Cohesion score 0.05919661733615222 - nodes in this community are weakly interconnected._
- **Should `Build & Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.0524390243902439 - nodes in this community are weakly interconnected._