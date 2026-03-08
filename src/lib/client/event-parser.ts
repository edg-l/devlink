// Block types for the UI
export type BlockType =
	| 'markdown'
	| 'tool-use'
	| 'tool-result'
	| 'thinking'
	| 'result'
	| 'rate-limit'
	| 'error'
	| 'session-init'
	| 'user-message';

export interface BaseBlock {
	id: string;
	type: BlockType;
	timestamp: Date;
}

export interface MarkdownBlock extends BaseBlock {
	type: 'markdown';
	content: string;
}

export interface ToolUseBlock extends BaseBlock {
	type: 'tool-use';
	toolName: string;
	toolUseId: string;
	input: Record<string, unknown>;
	result?: string;
	isError?: boolean;
	children?: Block[]; // Sub-blocks for Agent tool calls
}

export interface ThinkingBlock extends BaseBlock {
	type: 'thinking';
	content: string;
}

export interface ResultBlock extends BaseBlock {
	type: 'result';
	success: boolean;
	resultText: string;
	durationMs: number;
	totalCostUsd: number;
	usage: {
		inputTokens: number;
		outputTokens: number;
		cacheReadTokens: number;
		cacheCreationTokens: number;
	};
	stopReason: string;
}

export interface RateLimitBlock extends BaseBlock {
	type: 'rate-limit';
	status: string;
	resetsAt: number;
}

export interface ErrorBlock extends BaseBlock {
	type: 'error';
	message: string;
}

export interface SessionInitBlock extends BaseBlock {
	type: 'session-init';
	sessionId: string;
	model: string;
	cwd: string;
	tools: string[];
}

export interface UserMessageBlock extends BaseBlock {
	type: 'user-message';
	content: string;
}

export type Block =
	| MarkdownBlock
	| ToolUseBlock
	| ThinkingBlock
	| ResultBlock
	| RateLimitBlock
	| ErrorBlock
	| SessionInitBlock
	| UserMessageBlock;

// Raw stream-json event (loosely typed since it comes from Claude)
export interface StreamEvent {
	type: string;
	subtype?: string;
	[key: string]: unknown;
}

let blockCounter = 0;
function nextId(): string {
	return `block-${++blockCounter}`;
}

/**
 * Parse a single stream-json event into zero or more UI blocks.
 * Some events produce multiple blocks (e.g., an assistant message with both text and tool_use).
 */
export function parseEvent(event: StreamEvent): Block[] {
	const blocks: Block[] = [];
	const now = new Date();

	switch (event.type) {
		case 'system': {
			if (event.subtype === 'init') {
				blocks.push({
					id: nextId(),
					type: 'session-init',
					timestamp: now,
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					sessionId: (event as any).session_id ?? '',
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					model: (event as any).model ?? '',
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					cwd: (event as any).cwd ?? '',
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					tools: (event as any).tools ?? []
				});
			}
			break;
		}

		case 'assistant': {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const message = (event as any).message;
			if (!message?.content) break;

			for (const block of message.content) {
				if (block.type === 'text' && block.text) {
					blocks.push({
						id: nextId(),
						type: 'markdown',
						timestamp: now,
						content: block.text
					});
				} else if (block.type === 'tool_use') {
					blocks.push({
						id: nextId(),
						type: 'tool-use',
						timestamp: now,
						toolName: block.name,
						toolUseId: block.id,
						input: block.input || {}
					});
				} else if (block.type === 'thinking') {
					blocks.push({
						id: nextId(),
						type: 'thinking',
						timestamp: now,
						content: block.thinking || ''
					});
				}
			}
			break;
		}

		case 'user': {
			// Tool results come as user messages
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const message = (event as any).message;
			if (!message?.content) break;

			for (const item of message.content) {
				if (item.type === 'tool_result') {
					// Emit a tool-use block that the merging logic will attach to the parent
					blocks.push({
						id: nextId(),
						type: 'tool-use',
						timestamp: now,
						toolName: '', // Filled by mergeToolResults
						toolUseId: item.tool_use_id || '',
						input: {},
						result: typeof item.content === 'string' ? item.content : JSON.stringify(item.content),
						isError: item.is_error || false
					} as ToolUseBlock);
				}
			}
			break;
		}

		case 'result': {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const e = event as any;
			blocks.push({
				id: nextId(),
				type: 'result',
				timestamp: now,
				success: e.subtype === 'success',
				resultText: e.result || '',
				durationMs: e.duration_ms || 0,
				totalCostUsd: e.total_cost_usd || 0,
				usage: {
					inputTokens: e.usage?.input_tokens || 0,
					outputTokens: e.usage?.output_tokens || 0,
					cacheReadTokens: e.usage?.cache_read_input_tokens || 0,
					cacheCreationTokens: e.usage?.cache_creation_input_tokens || 0
				},
				stopReason: e.stop_reason || ''
			});
			break;
		}

		case 'rate_limit_event': {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const info = (event as any).rate_limit_info;
			blocks.push({
				id: nextId(),
				type: 'rate-limit',
				timestamp: now,
				status: info?.status || '',
				resetsAt: info?.resetsAt || 0
			});
			break;
		}

		case 'user_text': {
			blocks.push({
				id: nextId(),
				type: 'user-message',
				timestamp: now,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				content: (event as any).content || ''
			});
			break;
		}

		default: {
			if (event.type === 'stderr') {
				blocks.push({
					id: nextId(),
					type: 'error',
					timestamp: now,
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					message: (event as any).content || ''
				});
			}
			break;
		}
	}

	return blocks;
}

/**
 * Merge tool results into their parent tool-use blocks.
 * Also nests sub-agent blocks under their parent Agent tool-use blocks.
 * Call this on the full block array to associate results with their tool calls.
 */
export function mergeToolResults(blocks: Block[]): Block[] {
	const toolUseMap = new Map<string, number>(); // map toolUseId -> index in result
	const result: Block[] = [];

	// Track active Agent tool-use IDs (stack for nested agents)
	const agentStack: string[] = [];

	for (const block of blocks) {
		if (block.type === 'tool-use') {
			const existingIdx = toolUseMap.get(block.toolUseId);
			if (existingIdx !== undefined && block.result !== undefined) {
				// This is a result for an existing tool-use — merge result
				const existing = findBlock(result, block.toolUseId) as ToolUseBlock | undefined;
				if (existing) {
					existing.result = block.result;
					existing.isError = block.isError;
				}
				// If this was an Agent, pop it from the stack
				if (agentStack[agentStack.length - 1] === block.toolUseId) {
					agentStack.pop();
				}
			} else {
				// New tool-use block
				if (agentStack.length > 0) {
					// We're inside an agent — add as child of the current agent
					const parentId = agentStack[agentStack.length - 1];
					const parent = findBlock(result, parentId) as ToolUseBlock | undefined;
					if (parent) {
						if (!parent.children) parent.children = [];
						toolUseMap.set(block.toolUseId, result.length); // track for result merging
						parent.children.push(block);
						// If this is a nested Agent, push onto stack
						if (block.toolName === 'Agent') {
							agentStack.push(block.toolUseId);
						}
						continue;
					}
				}
				toolUseMap.set(block.toolUseId, result.length);
				result.push(block);
				// If this is an Agent tool, push onto stack
				if (block.toolName === 'Agent') {
					agentStack.push(block.toolUseId);
				}
			}
		} else if (agentStack.length > 0) {
			// Inside an agent context — nest under agent (skip thinking/markdown that are agent-internal)
			const parentId = agentStack[agentStack.length - 1];
			const parent = findBlock(result, parentId) as ToolUseBlock | undefined;
			if (parent) {
				if (!parent.children) parent.children = [];
				parent.children.push(block);
				continue;
			}
			result.push(block);
		} else {
			result.push(block);
		}
	}

	return result;
}

/** Recursively find a tool-use block by toolUseId in result array (including agent children) */
function findBlock(blocks: Block[], toolUseId: string): ToolUseBlock | undefined {
	for (const b of blocks) {
		if (b.type === 'tool-use') {
			if (b.toolUseId === toolUseId) return b;
			if (b.children) {
				const found = findBlock(b.children, toolUseId);
				if (found) return found;
			}
		}
	}
	return undefined;
}
