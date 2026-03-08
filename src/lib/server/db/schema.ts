import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const pairedDevice = sqliteTable('paired_device', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	pairedAt: integer('paired_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	lastSeen: integer('last_seen', { mode: 'timestamp' }),
});

export const project = sqliteTable('project', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	path: text('path').notNull().unique(),
	name: text('name').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export * from './auth.schema';
