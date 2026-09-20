import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { users } from './users.ts';
import { departments } from './departments.ts';

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const pjDepartments = sqliteTable(
  'pj_departments',
  {
    adminId: text('admin_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    departmentId: text('department_id')
      .notNull()
      .references(() => departments.id, { onDelete: 'cascade' }),
    assignedAt: integer('assigned_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [
    primaryKey({ columns: [table.adminId, table.departmentId] }),
  ]
);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type PjDepartment = typeof pjDepartments.$inferSelect;
export type NewPjDepartment = typeof pjDepartments.$inferInsert;
