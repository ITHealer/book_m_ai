/**
 * AI Service Configuration
 *
 * Reads configuration from environment variables.
 * Supports both server-side and client-side usage in SvelteKit.
 */

import type { AIClientConfig } from './types';

// Server-side env access
const getServerEnv = (key: string): string | undefined => {
	if (typeof process !== 'undefined' && process.env) {
		return process.env[key];
	}
	return undefined;
};

/**
 * Get AI service configuration from environment
 */
export function getAIConfig(): AIClientConfig {
	const baseUrl =
		getServerEnv('HEALER_AI_BASE_URL') ||
		getServerEnv('PUBLIC_AI_BASE_URL') ||
		'http://localhost:8000';

	const apiKey = getServerEnv('HEALER_AI_API_KEY') || getServerEnv('PUBLIC_AI_API_KEY') || '';

	const timeout = parseInt(getServerEnv('HEALER_AI_TIMEOUT') || '30000', 10);
	const retries = parseInt(getServerEnv('HEALER_AI_RETRIES') || '2', 10);
	const debug = getServerEnv('HEALER_AI_DEBUG') === 'true';

	return {
		baseUrl,
		apiKey,
		timeout,
		retries,
		debug
	};
}

/**
 * Check if we should use mock AI client
 * Returns true if:
 * - HEALER_AI_USE_MOCK=true explicitly set
 * - OR no AI service URL is configured
 */
export function shouldUseMock(): boolean {
	const useMockEnv = getServerEnv('HEALER_AI_USE_MOCK');
	if (useMockEnv !== undefined) {
		return useMockEnv === 'true';
	}

	// Default to mock if no base URL configured
	const baseUrl = getServerEnv('HEALER_AI_BASE_URL') || getServerEnv('PUBLIC_AI_BASE_URL');
	return !baseUrl || baseUrl === 'http://localhost:8000';
}
