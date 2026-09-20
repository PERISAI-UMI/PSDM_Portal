import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const departments = sqliteTable('departments', {
  id: text('id').primaryKey(),
  nama: text('nama').notNull().unique(),
});

export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;
