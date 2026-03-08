import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface HistoricalSession {
	sessionId: string;
	firstPrompt: string;
	summary: string;
	messageCount: number;
	created: string;
	modified: string;
	gitBranch: string;
	projectPath: string;
}

function encodeProjectPath(projectPath: string): string {
	return '-' + projectPath.slice(1).replace(/\//g, '-');
}

function parseIndexFile(indexPath: string, fallbackProjectPath: string): HistoricalSession[] {
	const results: HistoricalSession[] = [];
	try {
		const index = JSON.parse(readFileSync(indexPath, 'utf-8'));
		for (const entry of index.entries || []) {
			if (entry.isSidechain) continue;
			results.push({
				sessionId: entry.sessionId,
				firstPrompt: entry.firstPrompt || '',
				summary: entry.summary || '',
				messageCount: entry.messageCount || 0,
				created: entry.created || '',
				modified: entry.modified || '',
				gitBranch: entry.gitBranch || '',
				projectPath: entry.projectPath || fallbackProjectPath
			});
		}
	} catch {
		// Ignore malformed index files
	}
	return results;
}

export function getSessionHistory(projectPath?: string): HistoricalSession[] {
	const claudeProjectsDir = join(homedir(), '.claude', 'projects');

	if (!existsSync(claudeProjectsDir)) return [];

	const results: HistoricalSession[] = [];

	if (projectPath) {
		const encoded = encodeProjectPath(projectPath);
		const indexPath = join(claudeProjectsDir, encoded, 'sessions-index.json');
		if (existsSync(indexPath)) {
			results.push(...parseIndexFile(indexPath, projectPath));
		}
	} else {
		try {
			const dirs = readdirSync(claudeProjectsDir);
			for (const dir of dirs) {
				const indexPath = join(claudeProjectsDir, dir, 'sessions-index.json');
				if (existsSync(indexPath)) {
					results.push(...parseIndexFile(indexPath, ''));
				}
			}
		} catch {
			// Ignore unreadable directories
		}
	}

	results.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
	return results;
}
