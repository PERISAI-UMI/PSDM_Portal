import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users.ts';

export const activities = sqliteTable('activities', {
  id: text('id').primaryKey(),
  nama: text('nama').notNull(),
  deskripsi: text('deskripsi'),
  jenis: text('jenis').notNull(), // e.g. 'RAPAT_PLENO', 'UPGRADING', 'PROKER', dll
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
  isPublished: integer('is_published', { mode: 'boolean' }).notNull().default(false),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
