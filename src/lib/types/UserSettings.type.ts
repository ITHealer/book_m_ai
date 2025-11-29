import type { sortByType } from '$lib/utils/sort-bookmarks';

/**
 * AI Settings
 *
 * AI service configuration is now managed via environment variables.
 * User settings only control whether to enable AI features.
 */
export type AISettings = {
	/** Whether AI features are enabled for this user */
	enabled: boolean;
};

/**
 * Legacy LLM settings types (kept for backward compatibility during migration)
 * @deprecated Use AISettings instead
 */
export type ollamaSettings = {
	url: string;
	model: string;
	generateTags: {
		enabled: boolean;
		system: string;
	};
	summarize: {
		enabled: boolean;
		system: string;
	};
};

export type llmSettings = {
	enabled: boolean;
	provider: 'ollama' | 'openai';
	ollama: ollamaSettings;
	openai: {
		apiKey: string;
	};
};

/**
 * User Settings Type
 */
export type UserSettings = {
	bookmarksView: 'list' | 'grid';
	bookmarksSortedBy: sortByType;
	bookmarksOnlyShowFlagged: boolean;
	bookmarksOnlyShowRead: boolean;
	theme: 'light' | 'dark';
	uiAnimations: boolean;

	/** AI feature settings */
	ai?: AISettings;

	/** @deprecated Legacy LLM settings - kept for backward compatibility */
	llm?: llmSettings;
};
