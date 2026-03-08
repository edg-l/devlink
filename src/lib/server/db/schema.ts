import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const pairedDevice = sqliteTable('paired_device', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	pairedAt: integer('paired_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	lastSeen: integer('last_seen', { mode: 'timestamp' })
});

export const project = sqliteTable('project', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	path: text('path').notNull().unique(),
	name: text('name').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export const claudeSession = sqliteTable('claude_session', {
	id: text('id').primaryKey(),
	claudeSessionId: text('claude_session_id'),
	projectId: text('project_id')
		.notNull()
		.references(() => project.id),
	projectPath: text('project_path').notNull(),
	model: text('model'),
	permissionMode: text('permission_mode').notNull(),
	status: text('status').notNull().default('idle'),
	totalCost: integer('total_cost'),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	endedAt: integer('ended_at', { mode: 'timestamp' }),
	summary: text('summary').default('')
});

export * from './auth.schema';
