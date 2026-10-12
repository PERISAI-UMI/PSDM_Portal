import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { users } from './users.ts';
import { activities } from './activities.ts';

// Status pengiriman WA per penerima
export const waBroadcastStatusEnum = ['PENDING', 'SENT', 'FAILED', 'SKIPPED'] as const;
export type WaBroadcastStatus = (typeof waBroadcastStatusEnum)[number];

/**
 * Tabel utama: satu record per broadcast per kegiatan.
 * Menyimpan template pesan yang sudah dirangkai oleh backend.
 */
export const waBroadcasts = sqliteTable(
  'wa_broadcasts',
  {
    id: text('id').primaryKey(),
    activityId: text('activity_id')
      .notNull()
      .unique() // 1 kegiatan = 1 broadcast
      .references(() => activities.id, { onDelete: 'cascade' }),
    messageTemplate: text('message_template').notNull(), // Template pesan mentah (dengan placeholder)
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [index('wa_broadcasts_activity_idx').on(table.activityId)]
);

/**
 * Tabel detail: satu record per penerima per broadcast.
 * Frontend akan PATCH record ini setelah user klik "Kirim WA".
 */
export const waBroadcastRecipients = sqliteTable(
  'wa_broadcast_recipients',
  {
    id: text('id').primaryKey(),
    broadcastId: text('broadcast_id')
      .notNull()
      .references(() => waBroadcasts.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** Pesan final yang sudah di-render untuk user ini (nama, kegiatan, dll sudah diisi) */
    renderedMessage: text('rendered_message').notNull(),
    /** Nomor WA tujuan (dari users.no_telp, sudah dinormalisasi ke format internasional) */
    phoneNumber: text('phone_number').notNull(),
    status: text('status', { enum: waBroadcastStatusEnum }).notNull().default('PENDING'),
    error: text('error'),
    sentAt: integer('sent_at', { mode: 'timestamp' }),
    sentBy: text('sent_by').references(() => users.id, { onDelete: 'set null' }),
  },
  (table) => [
    index('wa_broadcast_recipients_broadcast_idx').on(table.broadcastId),
    index('wa_broadcast_recipients_user_idx').on(table.userId),
    index('wa_broadcast_recipients_status_idx').on(table.status),
  ]
);

export type WaBroadcast = typeof waBroadcasts.$inferSelect;
export type NewWaBroadcast = typeof waBroadcasts.$inferInsert;
export type WaBroadcastRecipient = typeof waBroadcastRecipients.$inferSelect;
export type NewWaBroadcastRecipient = typeof waBroadcastRecipients.$inferInsert;
