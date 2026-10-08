import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { users } from './users.ts';

export const pointConfigs = sqliteTable('point_configs', {
  id: text('id').primaryKey(), // Default single record: 'default_config'
  hadirPoints: integer('hadir_points').notNull().default(10),
  izinPoints: integer('izin_points').notNull().default(3),
  sakitPoints: integer('sakit_points').notNull().default(3),
  alphaPoints: integer('alpha_points').notNull().default(-10),
  telatPoints: integer('telat_points').notNull().default(5),
  updatedBy: text('updated_by').references(() => users.id, { onDelete: 'set null' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export type PointConfig = typeof pointConfigs.$inferSelect;
export type NewPointConfig = typeof pointConfigs.$inferInsert;
