import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { users } from './users.ts';
import { activityCategories } from './activityCategories.ts';

export const activities = sqliteTable(
  'activities',
  {
    id: text('id').primaryKey(),
    nama: text('nama').notNull(),
    deskripsi: text('deskripsi'),
    categoryId: text('category_id')
      .notNull()
      .references(() => activityCategories.id, { onDelete: 'restrict' }),
    mode: text('mode', { enum: ['OFFLINE', 'ONLINE'] }).notNull().default('OFFLINE'),
    lokasi: text('lokasi'),
    meetingUrl: text('meeting_url'),
    isLocked: integer('is_locked', { mode: 'boolean' }).notNull().default(false),
    startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
    endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
    isPublished: integer('is_published', { mode: 'boolean' }).notNull().default(false),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [
    index('activities_category_idx').on(table.categoryId),
    index('activities_start_date_idx').on(table.startDate),
    index('activities_is_published_idx').on(table.isPublished),
  ]
);

export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
