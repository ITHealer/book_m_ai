import { eq } from 'drizzle-orm';
import { db } from '$lib/database/db';
import { bookmarkSchema, bookmarkEmbeddingSchema } from '$lib/database/schema';
import { aiClient } from '$lib/integrations/ai';

import type { DB } from '$lib/database/db';

interface SearchResult {
	bookmark: any;
	similarity: number;
	score: number; // Combined score for hybrid search
}

interface SemanticSearchOptions {
	query: string;
	limit?: number;
	threshold?: number; // Minimum similarity (0-1)
	userId: number;
}

interface HybridSearchOptions extends SemanticSearchOptions {
	fuzzyWeight?: number; // Weight for fuzzy search (0-1, default 0.3)
	semanticWeight?: number; // Weight for semantic search (0-1, default 0.7)
}

/**
 * Embedding Service
 * Generates and manages vector embeddings for bookmarks
 */
export class EmbeddingService {
	constructor(private dbClient: DB = db) {}

	/**
	 * Generate embedding for a bookmark
	 */
	async generateEmbedding(bookmarkId: number): Promise<void> {
		// Get bookmark
		const bookmark = await this.dbClient.query.bookmarkSchema.findFirst({
			where: eq(bookmarkSchema.id, bookmarkId)
		});

		if (!bookmark) {
			throw new Error(`Bookmark ${bookmarkId} not found`);
		}

		// Create text for embedding
		const text = this.createEmbeddingText(bookmark);

		try {
			// Call AI service to generate embedding
			const result = await aiClient.generateEmbeddings({ text });

			// Check if embedding already exists
			const existing = await this.dbClient.query.bookmarkEmbeddingSchema.findFirst({
				where: eq(bookmarkEmbeddingSchema.bookmarkId, bookmarkId)
			});

			if (existing) {
				// Update existing embedding
				await this.dbClient
					.update(bookmarkEmbeddingSchema)
					.set({
						embedding: result.embedding,
						model: result.model,
						dimensions: result.dimensions
					})
					.where(eq(bookmarkEmbeddingSchema.bookmarkId, bookmarkId));
			} else {
				// Create new embedding
				await this.dbClient.insert(bookmarkEmbeddingSchema).values({
					bookmarkId,
					embedding: result.embedding,
					model: result.model,
					dimensions: result.dimensions
				});
			}
		} catch (error) {
			console.error(`Failed to generate embedding for bookmark ${bookmarkId}:`, error);
			// Don't throw error - allow app to continue without embeddings
			// The bookmark will simply not have vector search capability
		}
	}

	/**
	 * Generate embeddings for multiple bookmarks
	 */
	async generateEmbeddings(bookmarkIds: number[]): Promise<void> {
		const BATCH_SIZE = 5;

		for (let i = 0; i < bookmarkIds.length; i += BATCH_SIZE) {
			const batch = bookmarkIds.slice(i, i + BATCH_SIZE);
			await Promise.all(
				batch.map((id) =>
					this.generateEmbedding(id).catch((error) =>
						console.error(`Failed to generate embedding for ${id}:`, error)
					)
				)
			);
		}
	}

	/**
	 * Delete embedding for a bookmark
	 */
	async deleteEmbedding(bookmarkId: number): Promise<void> {
		await this.dbClient
			.delete(bookmarkEmbeddingSchema)
			.where(eq(bookmarkEmbeddingSchema.bookmarkId, bookmarkId));
	}

	/**
	 * Helper: Create text representation for embedding
	 */
	private createEmbeddingText(bookmark: any): string {
		const parts = [
			bookmark.title,
			bookmark.description,
			bookmark.author,
			bookmark.contentText ? bookmark.contentText.substring(0, 1000) : '' // Limit content text
		].filter(Boolean);

		return parts.join(' ');
	}
}

/**
 * Semantic Search Service
 * Provides vector similarity search for bookmarks
 */
export class SemanticSearchService {
	constructor(private dbClient: DB = db) {}

	/**
	 * Semantic search using cosine similarity
	 */
	async search(options: SemanticSearchOptions): Promise<SearchResult[]> {
		const { query, limit = 10, threshold = 0.5, userId } = options;

		// Generate query embedding
		const queryEmbedding = await this.generateQueryEmbedding(query);

		// Get all bookmark embeddings for user
		const embeddings = await this.dbClient.query.bookmarkEmbeddingSchema.findMany({
			with: {
				bookmark: true
			}
		});

		// Filter by user ownership
		const userEmbeddings = embeddings.filter((e) => e.bookmark.ownerId === userId);

		// Calculate similarities
		const results: SearchResult[] = userEmbeddings
			.map((e) => {
				const similarity = this.cosineSimilarity(queryEmbedding, e.embedding);
				return {
					bookmark: e.bookmark,
					similarity,
					score: similarity // For semantic-only search, score = similarity
				};
			})
			.filter((r) => r.similarity >= threshold) // Filter by threshold
			.sort((a, b) => b.similarity - a.similarity) // Sort by similarity
			.slice(0, limit); // Limit results

		return results;
	}

	/**
	 * Hybrid search combining fuzzy and semantic search
	 */
	async hybridSearch(options: HybridSearchOptions): Promise<SearchResult[]> {
		const {
			query,
			limit = 10,
			threshold = 0.3,
			userId,
			fuzzyWeight = 0.3,
			semanticWeight = 0.7
		} = options;

		// Validate weights
		if (Math.abs(fuzzyWeight + semanticWeight - 1.0) > 0.01) {
			throw new Error('Fuzzy and semantic weights must sum to 1.0');
		}

		// Get semantic results
		const semanticResults = await this.search({
			query,
			limit: limit * 2, // Get more results for merging
			threshold: 0, // No threshold filtering yet
			userId
		});

		// Get fuzzy results (using existing search)
		const fuzzyResults = await this.fuzzySearch(query, userId, limit * 2);

		// Combine and score
		const combinedMap = new Map<number, SearchResult>();

		// Add semantic results
		for (const result of semanticResults) {
			combinedMap.set(result.bookmark.id, {
				...result,
				score: result.similarity * semanticWeight
			});
		}

		// Merge fuzzy results
		for (const fuzzy of fuzzyResults) {
			const existing = combinedMap.get(fuzzy.bookmarkId);
			if (existing) {
				// Combine scores
				existing.score += fuzzy.score * fuzzyWeight;
			} else {
				// Add new result
				combinedMap.set(fuzzy.bookmarkId, {
					bookmark: fuzzy.bookmark,
					similarity: 0, // No semantic similarity
					score: fuzzy.score * fuzzyWeight
				});
			}
		}

		// Sort by combined score and filter
		const results = Array.from(combinedMap.values())
			.filter((r) => r.score >= threshold)
			.sort((a, b) => b.score - a.score)
			.slice(0, limit);

		return results;
	}

	/**
	 * Helper: Generate query embedding
	 */
	private async generateQueryEmbedding(query: string): Promise<number[]> {
		try {
			const result = await aiClient.generateEmbeddings({ text: query });
			return result.embedding;
		} catch (error) {
			console.error('Failed to generate query embedding:', error);
			// Return empty embedding to allow fuzzy search fallback
			throw new Error('Failed to generate query embedding: AI service unavailable');
		}
	}

	/**
	 * Helper: Calculate cosine similarity
	 */
	private cosineSimilarity(a: number[], b: number[]): number {
		if (a.length !== b.length) {
			throw new Error('Vectors must have same dimensions');
		}

		let dotProduct = 0;
		let normA = 0;
		let normB = 0;

		for (let i = 0; i < a.length; i++) {
			dotProduct += a[i] * b[i];
			normA += a[i] * a[i];
			normB += b[i] * b[i];
		}

		const denominator = Math.sqrt(normA) * Math.sqrt(normB);
		return denominator === 0 ? 0 : dotProduct / denominator;
	}

	/**
	 * Helper: Fuzzy search (simple implementation)
	 * In production, use Fuse.js or similar
	 */
	private async fuzzySearch(
		query: string,
		userId: number,
		limit: number
	): Promise<Array<{ bookmark: any; bookmarkId: number; score: number }>> {
		const queryLower = query.toLowerCase();

		const bookmarks = await this.dbClient.query.bookmarkSchema.findMany({
			where: eq(bookmarkSchema.ownerId, userId),
			limit: limit * 3 // Get more for scoring
		});

		// Simple scoring based on keyword match
		const results = bookmarks
			.map((bookmark) => {
				let score = 0;
				const titleLower = bookmark.title.toLowerCase();
				const descLower = (bookmark.description || '').toLowerCase();

				// Exact match bonus
				if (titleLower.includes(queryLower)) score += 1.0;
				if (descLower.includes(queryLower)) score += 0.5;

				// Word match
				const queryWords = queryLower.split(/\s+/);
				for (const word of queryWords) {
					if (titleLower.includes(word)) score += 0.3;
					if (descLower.includes(word)) score += 0.1;
				}

				return {
					bookmark,
					bookmarkId: bookmark.id,
					score: Math.min(score, 1.0) // Cap at 1.0
				};
			})
			.filter((r) => r.score > 0)
			.sort((a, b) => b.score - a.score)
			.slice(0, limit);

		return results;
	}
}

// Export singleton instances
export const embeddingService = new EmbeddingService();
export const semanticSearchService = new SemanticSearchService();
