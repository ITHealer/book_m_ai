import { json } from '@sveltejs/kit';
import { semanticSearchService } from '$lib/server/semantic-search.service';
import { validateRequest } from '$lib/server/auth';

import type { RequestHandler } from './$types';

/**
 * POST /api/search/hybrid
 * Perform hybrid search combining fuzzy and semantic search
 *
 * Request body:
 * {
 *   query: string,            // Search query
 *   limit?: number,           // Max results (default 10)
 *   threshold?: number,       // Min combined score 0-1 (default 0.3)
 *   fuzzyWeight?: number,     // Weight for fuzzy search 0-1 (default 0.3)
 *   semanticWeight?: number   // Weight for semantic search 0-1 (default 0.7)
 * }
 */
export const POST: RequestHandler = async (event) => {
	const { user } = await validateRequest(event);

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await event.request.json();
		const {
			query,
			limit = 10,
			threshold = 0.3,
			fuzzyWeight = 0.3,
			semanticWeight = 0.7
		} = body;

		if (!query || typeof query !== 'string') {
			return json({ error: 'Invalid query parameter' }, { status: 400 });
		}

		// Validate weights sum to 1.0
		if (Math.abs(fuzzyWeight + semanticWeight - 1.0) > 0.01) {
			return json(
				{ error: 'fuzzyWeight and semanticWeight must sum to 1.0' },
				{ status: 400 }
			);
		}

		const results = await semanticSearchService.hybridSearch({
			query,
			limit,
			threshold,
			userId: user.id,
			fuzzyWeight,
			semanticWeight
		});

		return json({
			success: true,
			results: results.map((r) => ({
				bookmark: r.bookmark,
				similarity: r.similarity,
				score: r.score
			})),
			total: results.length,
			weights: {
				fuzzy: fuzzyWeight,
				semantic: semanticWeight
			}
		});
	} catch (error) {
		console.error('Hybrid search failed:', error);
		return json(
			{
				error: 'Failed to perform hybrid search',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
