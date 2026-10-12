import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * Tabel konfigurasi aplikasi (Key-Value)
 * Digunakan untuk menyimpan pengaturan dinamis seperti URL & API Key Bot WA, dsb.
 */
export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull().default(''),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type AppSetting = typeof appSettings.$inferSelect;
export type NewAppSetting = typeof appSettings.$inferInsert;
