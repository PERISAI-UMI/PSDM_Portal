import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { users } from './users.ts';
import { activities } from './activities.ts';

export const permissionStatusEnum = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type PermissionStatus = (typeof permissionStatusEnum)[number];

export const permissions = sqliteTable(
  'permissions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    activityId: text('activity_id')
      .notNull()
      .references(() => activities.id, { onDelete: 'cascade' }),
    jenisIzin: text('jenis_izin').notNull(), // e.g. 'SAKIT', 'AKADEMIK', 'KEPERLUAN_KELUARGA'
    alasan: text('alasan').notNull(),
    evidenceUrl: text('evidence_url'), // Backblaze B2 public / presigned URL
    status: text('status', { enum: permissionStatusEnum }).notNull().default('PENDING'),
    reviewedBy: text('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [
    index('permissions_user_id_idx').on(table.userId),
    index('permissions_activity_id_idx').on(table.activityId),
    index('permissions_status_idx').on(table.status),
  ]
);

export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
