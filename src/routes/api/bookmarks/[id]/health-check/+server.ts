import { json } from '@sveltejs/kit';
import { healthCheckService } from '$lib/server/health-check.service';
import { validateRequest } from '$lib/server/auth';

import type { RequestHandler } from './$types';

/**
 * POST /api/bookmarks/[id]/health-check
 * Manually trigger health check for a specific bookmark
 */
export const POST: RequestHandler = async (event) => {
	const { user } = await validateRequest(event);

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const bookmarkId = parseInt(event.params.id);

	try {
		const result = await healthCheckService.checkBookmark(bookmarkId);

		return json({
			success: true,
			result
		});
	} catch (error) {
		console.error('Failed to check bookmark health:', error);
		return json(
			{
				error: error instanceof Error ? error.message : 'Failed to check bookmark health'
			},
			{ status: 500 }
		);
	}
};

/**
 * GET /api/bookmarks/[id]/health-check/history
 * Get health check history for a bookmark
 */
export const GET: RequestHandler = async (event) => {
	const { user } = await validateRequest(event);

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const bookmarkId = parseInt(event.params.id);
	const limit = parseInt(event.url.searchParams.get('limit') || '10');

	try {
		const history = await healthCheckService.getHealthHistory(bookmarkId, limit);

		return json({
			success: true,
			history
		});
	} catch (error) {
		console.error('Failed to get health check history:', error);
		return json(
			{
				error: 'Failed to retrieve health check history'
			},
			{ status: 500 }
		);
	}
};
