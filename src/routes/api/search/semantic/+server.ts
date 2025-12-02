import { json } from '@sveltejs/kit';
import { semanticSearchService } from '$lib/server/semantic-search.service';
import { validateRequest } from '$lib/server/auth';

import type { RequestHandler } from './$types';

/**
 * POST /api/search/semantic
 * Perform semantic search using vector embeddings
 *
 * Request body:
 * {
 *   query: string,        // Search query
 *   limit?: number,       // Max results (default 10)
 *   threshold?: number    // Min similarity 0-1 (default 0.5)
 * }
 */
export const POST: RequestHandler = async (event) => {
	const { user } = await validateRequest(event);

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await event.request.json();
		const { query, limit = 10, threshold = 0.5 } = body;

		if (!query || typeof query !== 'string') {
			return json({ error: 'Invalid query parameter' }, { status: 400 });
		}

		const results = await semanticSearchService.search({
			query,
			limit,
			threshold,
			userId: user.id
		});

		return json({
			success: true,
			results: results.map((r) => ({
				bookmark: r.bookmark,
				similarity: r.similarity,
				score: r.score
			})),
			total: results.length
		});
	} catch (error) {
		console.error('Semantic search failed:', error);
		return json(
			{
				error: 'Failed to perform semantic search',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
