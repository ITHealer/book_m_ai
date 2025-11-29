/**
 * AI Service Client Types
 *
 * Defines the contract between Healer and the AI service.
 * When the real AI FastAPI service is ready, these types ensure
 * seamless integration without code changes.
 */

// ============================================================================
// Request Types
// ============================================================================

export interface SummarizeRequest {
	/** Content to summarize (usually webpage content) */
	content: string;
	/** Optional custom system prompt override */
	systemPrompt?: string;
	/** Maximum length of summary in characters */
	maxLength?: number;
}

export interface GenerateTagsRequest {
	/** Content to analyze for tag generation */
	content: string;
	/** Optional custom system prompt override */
	systemPrompt?: string;
	/** Number of tags to generate (default: 3) */
	count?: number;
}

// ============================================================================
// Response Types
// ============================================================================

export interface SummarizeResponse {
	/** Generated summary text */
	summary: string;
	/** Optional metadata about the AI generation */
	metadata?: {
		model?: string;
		tokensUsed?: number;
		processingTimeMs?: number;
	};
}

export interface GenerateTagsResponse {
	/** Array of generated tag strings */
	tags: string[];
	/** Optional metadata about the AI generation */
	metadata?: {
		model?: string;
		tokensUsed?: number;
		processingTimeMs?: number;
	};
}

// ============================================================================
// Error Types
// ============================================================================

export class AIServiceError extends Error {
	constructor(
		message: string,
		public code: string,
		public statusCode?: number,
		public originalError?: unknown
	) {
		super(message);
		this.name = 'AIServiceError';
	}
}

export interface AIServiceErrorResponse {
	error: {
		message: string;
		code: string;
		details?: unknown;
	};
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface AIClientConfig {
	/** Base URL of the AI service (e.g., http://localhost:8000) */
	baseUrl: string;
	/** API key for authentication */
	apiKey?: string;
	/** Request timeout in milliseconds (default: 30000) */
	timeout?: number;
	/** Number of retry attempts for failed requests (default: 2) */
	retries?: number;
	/** Whether to enable debug logging (default: false) */
	debug?: boolean;
}

// ============================================================================
// Client Interface
// ============================================================================

/**
 * AI Service Client Interface
 *
 * Implementations:
 * - MockAIClient: Returns hardcoded responses for development/testing
 * - HTTPAIClient: Makes real HTTP calls to AI FastAPI service
 */
export interface IAIClient {
	/**
	 * Summarize content using AI
	 * @param request Summarization request
	 * @returns Promise resolving to summary response
	 * @throws AIServiceError on failure
	 */
	summarize(request: SummarizeRequest): Promise<SummarizeResponse>;

	/**
	 * Generate tags for content using AI
	 * @param request Tag generation request
	 * @returns Promise resolving to tags response
	 * @throws AIServiceError on failure
	 */
	generateTags(request: GenerateTagsRequest): Promise<GenerateTagsResponse>;

	/**
	 * Check if AI service is available and healthy
	 * @returns Promise resolving to true if service is healthy
	 */
	healthCheck(): Promise<boolean>;
}
