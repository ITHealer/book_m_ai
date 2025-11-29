/**
 * AI Service Client - Main Entry Point
 *
 * Usage:
 *   import { aiClient } from '$lib/integrations/ai';
 *   const summary = await aiClient.summarize({ content: "..." });
 *   const tags = await aiClient.generateTags({ content: "..." });
 *
 * Configuration:
 *   Set environment variables in .env:
 *   - HEALER_AI_BASE_URL: AI service URL (default: http://localhost:8000)
 *   - HEALER_AI_API_KEY: API key for authentication
 *   - HEALER_AI_USE_MOCK: Set to "true" to use mock client (default: auto-detect)
 *   - HEALER_AI_DEBUG: Set to "true" to enable debug logging
 *
 * Switching from Mock to Real Service:
 *   1. Deploy your AI FastAPI service
 *   2. Set HEALER_AI_BASE_URL to your service URL
 *   3. Set HEALER_AI_API_KEY if needed
 *   4. Set HEALER_AI_USE_MOCK=false (or remove it)
 *   5. Restart the app
 *
 * No code changes needed - the client will automatically switch!
 */

import type { IAIClient } from './types';
import { MockAIClient } from './mock-client';
import { HTTPAIClient } from './http-client';
import { getAIConfig, shouldUseMock } from './config';

// Export types for convenience
export type {
	IAIClient,
	SummarizeRequest,
	SummarizeResponse,
	GenerateTagsRequest,
	GenerateTagsResponse,
	AIClientConfig,
	AIServiceError
} from './types';

// Singleton AI client instance
let clientInstance: IAIClient | null = null;

/**
 * Get AI client instance (singleton)
 *
 * Automatically chooses between MockAIClient and HTTPAIClient
 * based on environment configuration.
 */
export function getAIClient(): IAIClient {
	if (!clientInstance) {
		const config = getAIConfig();
		const useMock = shouldUseMock();

		if (useMock) {
			console.log('[Healer AI] Using MockAIClient (development mode)');
			clientInstance = new MockAIClient(config);
		} else {
			console.log('[Healer AI] Using HTTPAIClient connected to:', config.baseUrl);
			clientInstance = new HTTPAIClient(config);
		}
	}

	return clientInstance;
}

/**
 * Reset client instance (useful for testing or config changes)
 */
export function resetAIClient(): void {
	clientInstance = null;
}

/**
 * Default export - AI client singleton
 */
export const aiClient = getAIClient();

/**
 * Convenience functions for direct usage
 */
export const summarize = (content: string, systemPrompt?: string) =>
	aiClient.summarize({ content, systemPrompt });

export const generateTags = (content: string, count: number = 3, systemPrompt?: string) =>
	aiClient.generateTags({ content, count, systemPrompt });

export const checkAIHealth = () => aiClient.healthCheck();
