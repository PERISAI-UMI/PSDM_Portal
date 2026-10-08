import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { users } from './users.ts';

export const activityCategories = sqliteTable(
  'activity_categories',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    description: text('description'),
    hadirPoints: integer('hadir_points').notNull().default(3),
    izinPoints: integer('izin_points').notNull().default(0),
    sakitPoints: integer('sakit_points').notNull().default(0),
    alphaPoints: integer('alpha_points').notNull().default(-5),
    telatPoints: integer('telat_points').notNull().default(-1),
    createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
    updatedBy: text('updated_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [
    index('activity_categories_name_idx').on(table.name),
  ]
);

export type ActivityCategory = typeof activityCategories.$inferSelect;
export type NewActivityCategory = typeof activityCategories.$inferInsert;
