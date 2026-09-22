import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { users } from './users.ts';
import { activities } from './activities.ts';

export const attendanceStatusEnum = ['HADIR', 'IZIN', 'SAKIT', 'ALPHA', 'TELAT'] as const;
export type AttendanceStatus = (typeof attendanceStatusEnum)[number];

export const attendances = sqliteTable(
  'attendances',
  {
    id: text('id').primaryKey(),
    activityId: text('activity_id')
      .notNull()
      .references(() => activities.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: text('status', { enum: attendanceStatusEnum }).notNull(),
    recordedBy: text('recorded_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    recordedAt: integer('recorded_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex('attendances_activity_user_unique').on(table.activityId, table.userId),
  ]
);

export type Attendance = typeof attendances.$inferSelect;
export type NewAttendance = typeof attendances.$inferInsert;
