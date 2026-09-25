# Graph Report - PSDM-PORTAL  (2026-09-25)

## Corpus Check
- 74 files · ~58,451 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 439 nodes · 1092 edges · 32 communities (26 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Database Schema & Validation
- Activities & Attendances Model
- System Audit & Diagnostics
- Dashboard & Role Views
- Attendance Scanner & Import
- Master Data Management
- Package Configuration
- Database Clean & Academic Seed
- Core Runtime Dependencies
- Authentication & Session Cache
- Activities UI Components
- Application Shell & Modals
- TypeScript Compiler Setup
- Storage Routes & B2 Auth
- Database Client & Connection
- User Profile & Avatar Crop
- Development Tooling & Build
- Layout & Navigation Controls
- NPM Build Scripts
- Deployment Documentation
- Permissions Form & Image Compression
- System Handover & Architecture Spec
- UI Toast Notifications
- S3 Storage & Presigned URLs
- Vite & Tailwind Config
- Edge Infrastructure & Portal Entry
- Integration Testing Specs
- Turso & 3NF Schema Specs
- Drizzle Kit Migration Config
- Edge Secrets Management
- Audit & Health Diagnostics Panel
- RBAC Matrix Documentation

## God Nodes (most connected - your core abstractions)
1. `AuthUser` - 42 edges
2. `react` - 30 edges
3. `lucide-react` - 29 edges
4. `ActivityItem` - 25 edges
5. `users` - 17 edges
6. `compilerOptions` - 16 edges
7. `PermissionStatus` - 14 edges
8. `AppEnv` - 14 edges
9. `PermissionRecord` - 14 edges
10. `drizzle-orm` - 13 edges

## Surprising Connections (you probably didn't know these)
- `4. Struktur Database Ternormalisasi (3NF)` --references--> `Fakultas`  [INFERRED]
  HANDOVER.md → src/db/schema/academic.ts
- `Pre-deployment Integration Tests` --semantically_similar_to--> `Integration Test Suites`  [INFERRED] [semantically similar]
  DEPLOYMENT.md → HANDOVER.md
- `Cloudflare Workers Deployment` --conceptually_related_to--> `Edge Serverless Architecture`  [INFERRED]
  DEPLOYMENT.md → HANDOVER.md
- `Turso Database Setup` --conceptually_related_to--> `3NF Normalized Database Schema`  [INFERRED]
  DEPLOYMENT.md → HANDOVER.md
- `Backblaze B2 Object Storage` --conceptually_related_to--> `Edge Serverless Architecture`  [INFERRED]
  DEPLOYMENT.md → HANDOVER.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Edge Serverless Infrastructure Stack** — deployment_cloudflare_workers, deployment_turso_db, deployment_backblaze_b2, handover_edge_serverless_architecture [INFERRED 0.95]

## Communities (32 total, 6 thin omitted)

### Community 0 - "Database Schema & Validation"
Cohesion: 0.10
Nodes (34): drizzle-orm, hono, zod, src_db_schema_index_activities, src_db_schema_index_attendancestatusenum, src_db_schema_index_departments, src_db_schema_index_permissionstatusenum, src_db_schema_index_users (+26 more)

### Community 1 - "Activities & Attendances Model"
Cohesion: 0.08
Nodes (31): activities, Activity, NewActivity, Attendance, attendances, attendanceStatusEnum, NewAttendance, Department (+23 more)

### Community 2 - "System Audit & Diagnostics"
Cohesion: 0.10
Nodes (29): AuditModal(), AuditModalProps, DiagnosticCardItem, INITIAL_ITEMS, activityModeEnum, activitySchema, attendanceSchema, createActivitySchema (+21 more)

### Community 3 - "Dashboard & Role Views"
Cohesion: 0.18
Nodes (20): react, AdminViewProps, PengurusView(), PengurusViewProps, SuperAdminViewProps, AlphaMemberStat, AttendanceCategory, CATEGORIES (+12 more)

### Community 4 - "Attendance Scanner & Import"
Cohesion: 0.19
Nodes (16): MainAppContent(), checkAuthSession(), AttendanceImportModal(), ParsedAttendanceRow, AttendanceScannerModal(), useToast(), AttendanceStatus, api (+8 more)

### Community 5 - "Master Data Management"
Cohesion: 0.17
Nodes (17): ActivityCardProps, DeleteTarget, EditTarget, MasterDataTab, MasterDataView(), MasterDataViewProps, MemberFormModal(), MemberFormModalProps (+9 more)

### Community 6 - "Package Configuration"
Cohesion: 0.10
Nodes (20): name, private, type, version, autoprefixer, dotenv, drizzle-zod, esbuild (+12 more)

### Community 7 - "Database Clean & Academic Seed"
Cohesion: 0.15
Nodes (15): 4. Struktur Database Ternormalisasi (3NF), db, Fakultas, NewFakultas, NewProgramStudi, ProgramStudi, src_db_schema_index_attendances, src_db_schema_index_fakultas (+7 more)

### Community 8 - "Core Runtime Dependencies"
Cohesion: 0.11
Nodes (19): dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, dotenv, drizzle-orm, drizzle-zod, @google/genai, hono (+11 more)

### Community 9 - "Authentication & Session Cache"
Cohesion: 0.15
Nodes (15): @hono/zod-validator, src_db_schema_index_userrole, sessions, CachedSessionUser, invalidateSessionCache(), SESSION_COOKIE_NAME, sessionMicroCache, cleanupExpired() (+7 more)

### Community 10 - "Activities UI Components"
Cohesion: 0.26
Nodes (12): lucide-react, ActivitiesView(), ActivitiesViewProps, ActivityCard(), ActivityDetailModal(), AttendanceImportModalProps, RealtimeClockWidget(), ActivityItem (+4 more)

### Community 11 - "Application Shell & Modals"
Cohesion: 0.15
Nodes (13): ActiveSection, App(), CreateActivityModal(), CreateActivityModalProps, getWitaDateParts(), LoginForm(), LoginFormProps, AdminView() (+5 more)

### Community 12 - "TypeScript Compiler Setup"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 13 - "Storage Routes & B2 Auth"
Cohesion: 0.15
Nodes (13): src_db_schema_index_userroleenum, authMiddleware, B2AuthCache, B2AuthorizeResponse, B2GetUploadUrlResponse, getB2Credentials(), handleStorageFileStream(), storageRouter (+5 more)

### Community 14 - "Database Client & Connection"
Cohesion: 0.19
Nodes (11): AppDatabase, createDb(), DatabaseEnv, src_db_schema_index_pjdepartment, src_db_schema_index_session, src_db_schema_index_user, PjDepartment, dbMiddleware (+3 more)

### Community 15 - "User Profile & Avatar Crop"
Cohesion: 0.24
Nodes (8): AvatarCropModal(), AvatarCropModalProps, ProfileModal(), ProfileModalProps, ProfileView(), ProfileViewProps, ConfirmModal(), ConfirmModalProps

### Community 16 - "Development Tooling & Build"
Cohesion: 0.18
Nodes (11): devDependencies, autoprefixer, drizzle-kit, esbuild, tailwindcss, tsx, @types/node, @types/react (+3 more)

### Community 17 - "Layout & Navigation Controls"
Cohesion: 0.24
Nodes (7): ActivityDetailModalProps, AttendanceScannerModalProps, HeaderProps, Sidebar(), SidebarProps, MemberListModalProps, AuthUser

### Community 18 - "NPM Build Scripts"
Cohesion: 0.22
Nodes (9): scripts, build, clean, deploy, dev, lint, preview, seed (+1 more)

### Community 19 - "Deployment Documentation"
Cohesion: 0.25
Nodes (7): 1. Prasyarat Akun & Peralatan CLI, 2. Setup Database Turso (Edge libSQL 3NF), 3. Setup Bucket Backblaze B2 (Penyimpanan Berkas Izin Mahasiswa), 4. Konfigurasi Rahasia di Cloudflare Workers, 5. Build & Rilis ke Cloudflare Workers, 6. Verifikasi Pasca-Deployment, Panduan Deployment Edge Serverless (Cloudflare Workers, Turso & Backblaze B2)

### Community 20 - "Permissions Form & Image Compression"
Cohesion: 0.39
Nodes (6): PermissionFormModal(), PermissionFormModalProps, compressImageFile(), CompressionResult, CompressOptions, formatFileSize()

### Community 21 - "System Handover & Architecture Spec"
Cohesion: 0.29
Nodes (6): 1. Ikhtisar Sistem, 2. Arsitektur Teknologi & Edge Stack, 3. Matriks Hak Akses (Role-Based Access Control / RBAC), 5. Ringkasan Hasil Pengujian Integrasi (Tahap 6), 6. Audit & Health Panel Langsung pada Aplikasi, PSDM.web 2.0 - Dokumen Handover & Ringkasan Arsitektur (Tahap 6)

### Community 22 - "UI Toast Notifications"
Cohesion: 0.33
Nodes (5): ToastContext, ToastContextType, ToastItem, ToastProvider(), ToastType

### Community 23 - "S3 Storage & Presigned URLs"
Cohesion: 0.40
Nodes (4): @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, PresignedUrlResult, StorageConfig

### Community 24 - "Vite & Tailwind Config"
Cohesion: 0.40
Nodes (4): ref_path, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 25 - "Edge Infrastructure & Portal Entry"
Cohesion: 0.50
Nodes (4): Backblaze B2 Object Storage, Cloudflare Workers Deployment, Edge Serverless Architecture, Portal PSDM HTML Document

## Knowledge Gaps
- **184 isolated node(s):** `1. Prasyarat Akun & Peralatan CLI`, `2. Setup Database Turso (Edge libSQL 3NF)`, `3. Setup Bucket Backblaze B2 (Penyimpanan Berkas Izin Mahasiswa)`, `4. Konfigurasi Rahasia di Cloudflare Workers`, `5. Build & Rilis ke Cloudflare Workers` (+179 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 203 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Dashboard & Role Views` to `System Audit & Diagnostics`, `Attendance Scanner & Import`, `Master Data Management`, `Package Configuration`, `Activities UI Components`, `Application Shell & Modals`, `User Profile & Avatar Crop`, `Layout & Navigation Controls`, `Permissions Form & Image Compression`, `UI Toast Notifications`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Core Runtime Dependencies` to `Package Configuration`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `Activities UI Components` to `System Audit & Diagnostics`, `Dashboard & Role Views`, `Attendance Scanner & Import`, `Master Data Management`, `Package Configuration`, `Application Shell & Modals`, `User Profile & Avatar Crop`, `Layout & Navigation Controls`, `Permissions Form & Image Compression`, `UI Toast Notifications`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **What connects `1. Prasyarat Akun & Peralatan CLI`, `2. Setup Database Turso (Edge libSQL 3NF)`, `3. Setup Bucket Backblaze B2 (Penyimpanan Berkas Izin Mahasiswa)` to the rest of the system?**
  _184 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Database Schema & Validation` be split into smaller, more focused modules?**
  _Cohesion score 0.10336817653890824 - nodes in this community are weakly interconnected._
- **Should `Activities & Attendances Model` be split into smaller, more focused modules?**
  _Cohesion score 0.08392603129445235 - nodes in this community are weakly interconnected._
- **Should `System Audit & Diagnostics` be split into smaller, more focused modules?**
  _Cohesion score 0.10416666666666667 - nodes in this community are weakly interconnected._