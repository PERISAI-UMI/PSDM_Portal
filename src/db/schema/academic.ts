import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const fakultas = sqliteTable('fakultas', {
  id: text('id').primaryKey(),
  nama: text('nama').notNull().unique(),
});

export const programStudi = sqliteTable('program_studi', {
  id: text('id').primaryKey(),
  fakultasId: text('fakultas_id')
    .notNull()
    .references(() => fakultas.id, { onDelete: 'cascade' }),
  nama: text('nama').notNull(),
});

export type Fakultas = typeof fakultas.$inferSelect;
export type NewFakultas = typeof fakultas.$inferInsert;

export type ProgramStudi = typeof programStudi.$inferSelect;
export type NewProgramStudi = typeof programStudi.$inferInsert;
