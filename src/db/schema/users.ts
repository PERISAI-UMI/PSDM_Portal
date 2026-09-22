import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { departments } from './departments.ts';
import { programStudi } from './academic.ts';

export const userRoleEnum = ['SUPER_ADMIN', 'ADMIN', 'PENGURUS', 'INTI'] as const;
export type UserRole = (typeof userRoleEnum)[number];

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  prn: text('prn').notNull().unique(), // username / Nomor Registrasi
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: userRoleEnum }).notNull().default('PENGURUS'),
  generasi: integer('generasi').notNull(),
  departmentId: text('department_id')
    .notNull()
    .references(() => departments.id, { onDelete: 'restrict' }),
  jabatan: text('jabatan').notNull(),
  namaLengkap: text('nama_lengkap').notNull(),
  tempatLahir: text('tempat_lahir').notNull(),
  tanggalLahir: text('tanggal_lahir').notNull(), // ISO DATE (YYYY-MM-DD)
  alamat: text('alamat').notNull(),
  noTelp: text('no_telp').notNull(),
  email: text('email').notNull().unique(),
  nim: text('nim').notNull().unique(),
  programStudiId: text('program_studi_id')
    .notNull()
    .references(() => programStudi.id, { onDelete: 'restrict' }),
  angkatan: integer('angkatan').notNull(),
  linkedinUrl: text('linkedin_url'),
  instagramUsername: text('instagram_username'),
  avatarUrl: text('avatar_url'),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
