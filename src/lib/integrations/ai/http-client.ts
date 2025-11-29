/**
 * HTTP AI Client
 *
 * Makes real HTTP calls to the AI FastAPI service.
 * Use this when the real AI service is deployed and ready.
 *
 * Expected API endpoints:
 * - POST /v1/ai/summarize
 * - POST /v1/ai/generate-tags
 * - GET /v1/health
 */

import type {
	IAIClient,
	SummarizeRequest,
	SummarizeResponse,
	GenerateTagsRequest,
	GenerateTagsResponse,
	AIClientConfig,
	AIServiceErrorResponse
} from './types';
import { AIServiceError } from './types';

export class HTTPAIClient implements IAIClient {
	private config: Required<AIClientConfig>;

	constructor(config: AIClientConfig) {
		this.config = {
			baseUrl: config.baseUrl,
			apiKey: config.apiKey || '',
			timeout: config.timeout || 30000,
			retries: config.retries || 2,
			debug: config.debug || false
		};

		// Validate base URL
		if (!this.config.baseUrl) {
			throw new Error('AI service base URL is required');
		}

		if (this.config.debug) {
			console.log('[HTTPAIClient] Initialized with base URL:', this.config.baseUrl);
		}
	}

	async summarize(request: SummarizeRequest): Promise<SummarizeResponse> {
		const endpoint = '/v1/ai/summarize';
		const body = {
			content: request.content,
			system_prompt: request.systemPrompt,
			max_length: request.maxLength
		};

		return this.makeRequest<SummarizeResponse>(endpoint, body);
	}

	async generateTags(request: GenerateTagsRequest): Promise<GenerateTagsResponse> {
		const endpoint = '/v1/ai/generate-tags';
		const body = {
			content: request.content,
			system_prompt: request.systemPrompt,
			count: request.count || 3
		};

		return this.makeRequest<GenerateTagsResponse>(endpoint, body);
	}

	async healthCheck(): Promise<boolean> {
		try {
			const response = await this.fetchWithTimeout(`${this.config.baseUrl}/v1/health`, {
				method: 'GET',
				headers: this.getHeaders()
			});

			return response.ok;
		} catch (error) {
			if (this.config.debug) {
				console.error('[HTTPAIClient] Health check failed:', error);
			}
			return false;
		}
	}

	// ========================================================================
	// Private Helper Methods
	// ========================================================================

	private async makeRequest<T>(endpoint: string, body: unknown): Promise<T> {
		let lastError: Error | null = null;

		for (let attempt = 0; attempt <= this.config.retries; attempt++) {
			try {
				if (this.config.debug && attempt > 0) {
					console.log(`[HTTPAIClient] Retry attempt ${attempt}/${this.config.retries}`);
				}

				const response = await this.fetchWithTimeout(`${this.config.baseUrl}${endpoint}`, {
					method: 'POST',
					headers: this.getHeaders(),
					body: JSON.stringify(body)
				});

				if (!response.ok) {
					const errorData = await this.parseErrorResponse(response);
					throw new AIServiceError(
						errorData.message,
						errorData.code,
						response.status,
						errorData
					);
				}

				const data = await response.json();
				return data as T;
			} catch (error) {
				lastError = error as Error;

				// Don't retry on client errors (4xx)
				if (error instanceof AIServiceError && error.statusCode && error.statusCode < 500) {
					throw error;
				}

				// Wait before retry with exponential backoff
				if (attempt < this.config.retries) {
					const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
					await new Promise((resolve) => setTimeout(resolve, delay));
				}
			}
		}

		// All retries failed
		throw new AIServiceError(
			`AI service request failed after ${this.config.retries + 1} attempts: ${lastError?.message}`,
			'REQUEST_FAILED',
			undefined,
			lastError
		);
	}

	private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

		try {
			const response = await fetch(url, {
				...options,
				signal: controller.signal
			});
			return response;
		} catch (error) {
			if ((error as Error).name === 'AbortError') {
				throw new AIServiceError(
					`Request timeout after ${this.config.timeout}ms`,
					'TIMEOUT',
					undefined,
					error
				);
			}
			throw error;
		} finally {
			clearTimeout(timeoutId);
		}
	}

	private getHeaders(): HeadersInit {
		const headers: HeadersInit = {
			'Content-Type': 'application/json'
		};

		if (this.config.apiKey) {
			headers['Authorization'] = `Bearer ${this.config.apiKey}`;
		}

		return headers;
	}

	private async parseErrorResponse(response: Response): Promise<{ message: string; code: string }> {
		try {
			const data: AIServiceErrorResponse = await response.json();
			return {
				message: data.error?.message || `HTTP ${response.status}: ${response.statusText}`,
				code: data.error?.code || 'UNKNOWN_ERROR'
			};
		} catch {
			return {
				message: `HTTP ${response.status}: ${response.statusText}`,
				code: 'HTTP_ERROR'
			};
		}
	}
}
