import { json } from '@sveltejs/kit';
import { asc } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { db } from '$lib/server/db';
import { project } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const projects = await db.select().from(project).orderBy(asc(project.name));
	return json(projects);
};

export const POST: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await event.request.json();
	const { path: projectPath, name } = body as { path: string; name?: string };

	if (!projectPath) {
		return json({ error: 'path is required' }, { status: 400 });
	}

	let stat: fs.Stats;
	try {
		stat = fs.statSync(projectPath);
	} catch {
		return json({ error: 'path does not exist on filesystem' }, { status: 400 });
	}

	if (!stat.isDirectory()) {
		return json({ error: 'Path must be a directory' }, { status: 400 });
	}

	const derivedName = name || path.basename(projectPath);

	const [inserted] = await db
		.insert(project)
		.values({ path: projectPath, name: derivedName })
		.returning();

	return json(inserted, { status: 201 });
};
