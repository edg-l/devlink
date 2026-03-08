export const models = [
	{ value: 'claude-opus-4-6', label: 'Opus' },
	{ value: 'claude-sonnet-4-6', label: 'Sonnet' },
	{ value: 'claude-haiku-4-5', label: 'Haiku' }
] as const;

export type ModelId = (typeof models)[number]['value'];

export const defaultModel: ModelId = 'claude-sonnet-4-6';

export function modelLabel(modelId: string): string {
	return models.find((m) => m.value === modelId)?.label ?? modelId;
}
