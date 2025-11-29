/**
 * Mock AI Client
 *
 * Returns realistic hardcoded responses for development and testing.
 * Use this until the real AI FastAPI service is ready.
 *
 * To switch to real service:
 * 1. Implement HTTPAIClient
 * 2. Update src/lib/integrations/ai/index.ts to use HTTPAIClient
 * 3. Configure HEALER_AI_BASE_URL and HEALER_AI_API_KEY in .env
 */

import type {
	IAIClient,
	SummarizeRequest,
	SummarizeResponse,
	GenerateTagsRequest,
	GenerateTagsResponse,
	GenerateEmbeddingsRequest,
	GenerateEmbeddingsResponse,
	AIClientConfig
} from './types';

export class MockAIClient implements IAIClient {
	private config: AIClientConfig;

	constructor(config: Partial<AIClientConfig> = {}) {
		this.config = {
			baseUrl: config.baseUrl || 'http://localhost:8000',
			timeout: config.timeout || 30000,
			retries: config.retries || 2,
			debug: config.debug || false,
			...config
		};

		if (this.config.debug) {
			console.log('[MockAIClient] Initialized with config:', this.config);
		}
	}

	async summarize(request: SummarizeRequest): Promise<SummarizeResponse> {
		if (this.config.debug) {
			console.log('[MockAIClient] summarize() called with:', request);
		}

		// Simulate network delay
		await this.simulateDelay(500, 1500);

		// Generate a mock summary based on content length
		const contentPreview = request.content.substring(0, 100);
		const summary = this.generateMockSummary(contentPreview);

		const response: SummarizeResponse = {
			summary,
			metadata: {
				model: 'mock-ai-v1',
				tokensUsed: Math.floor(Math.random() * 500) + 100,
				processingTimeMs: Math.floor(Math.random() * 1000) + 200
			}
		};

		if (this.config.debug) {
			console.log('[MockAIClient] summarize() response:', response);
		}

		return response;
	}

	async generateTags(request: GenerateTagsRequest): Promise<GenerateTagsResponse> {
		if (this.config.debug) {
			console.log('[MockAIClient] generateTags() called with:', request);
		}

		// Simulate network delay
		await this.simulateDelay(300, 1000);

		// Generate mock tags based on content
		const tags = this.generateMockTags(request.content, request.count || 3);

		const response: GenerateTagsResponse = {
			tags,
			metadata: {
				model: 'mock-ai-v1',
				tokensUsed: Math.floor(Math.random() * 200) + 50,
				processingTimeMs: Math.floor(Math.random() * 500) + 100
			}
		};

		if (this.config.debug) {
			console.log('[MockAIClient] generateTags() response:', response);
		}

		return response;
	}

	async generateEmbeddings(request: GenerateEmbeddingsRequest): Promise<GenerateEmbeddingsResponse> {
		if (this.config.debug) {
			console.log('[MockAIClient] generateEmbeddings() called with:', request);
		}

		// Simulate API delay
		await this.simulateDelay(200, 500);

		// Generate mock embedding (1536 dimensions like text-embedding-3-small)
		const dimensions = 1536;
		const mockEmbedding = Array.from({ length: dimensions }, () => (Math.random() - 0.5) * 2);

		const response: GenerateEmbeddingsResponse = {
			embedding: mockEmbedding,
			model: request.model || 'text-embedding-3-small',
			dimensions,
			tokens_used: Math.ceil(request.text.length / 4),
			processing_time_ms: Math.floor(Math.random() * 300) + 200
		};

		if (this.config.debug) {
			console.log('[MockAIClient] generateEmbeddings() response:', {
				...response,
				embedding: `[${dimensions} dimensions]`
			});
		}

		return response;
	}

	async healthCheck(): Promise<boolean> {
		if (this.config.debug) {
			console.log('[MockAIClient] healthCheck() called');
		}

		// Mock AI service is always "healthy"
		await this.simulateDelay(50, 150);
		return true;
	}

	// ========================================================================
	// Private Helper Methods
	// ========================================================================

	private async simulateDelay(minMs: number, maxMs: number): Promise<void> {
		const delay = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
		return new Promise((resolve) => setTimeout(resolve, delay));
	}

	private generateMockSummary(contentPreview: string): string {
		// Extract some keywords from content
		const words = contentPreview
			.toLowerCase()
			.split(/\s+/)
			.filter((w) => w.length > 4);
		const keyword = words[Math.floor(Math.random() * words.length)] || 'content';

		const templates = [
			`This article discusses ${keyword} and related topics. It provides insights into modern approaches and best practices in the field.`,
			`A comprehensive overview of ${keyword}, covering key concepts, practical applications, and future trends.`,
			`An in-depth analysis of ${keyword}, examining its impact and significance in current contexts.`,
			`This resource explores ${keyword} from multiple perspectives, offering valuable information for practitioners and enthusiasts.`,
			`A detailed examination of ${keyword}, including background information, current developments, and expert perspectives.`
		];

		return templates[Math.floor(Math.random() * templates.length)];
	}

	private generateMockTags(content: string, count: number): string[] {
		// Extract potential tag words from content
		const words = content
			.toLowerCase()
			.replace(/[^\w\s]/g, '')
			.split(/\s+/)
			.filter((w) => w.length > 3 && w.length < 15);

		// Common tech/general tags as fallback
		const fallbackTags = [
			'technology',
			'web-development',
			'programming',
			'tutorial',
			'guide',
			'reference',
			'tools',
			'productivity',
			'design',
			'documentation',
			'api',
			'database',
			'framework',
			'library',
			'best-practices'
		];

		// Combine extracted words and fallback tags
		const candidateTags = [...new Set([...words, ...fallbackTags])];

		// Randomly select tags
		const selectedTags: string[] = [];
		const shuffled = candidateTags.sort(() => Math.random() - 0.5);

		for (let i = 0; i < Math.min(count, shuffled.length); i++) {
			selectedTags.push(shuffled[i]);
		}

		// Ensure we always return the requested count
		while (selectedTags.length < count) {
			selectedTags.push(
				fallbackTags[Math.floor(Math.random() * fallbackTags.length)]
			);
		}

		return selectedTags.slice(0, count);
	}
}
