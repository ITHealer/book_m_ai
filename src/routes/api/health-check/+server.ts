import { json } from '@sveltejs/kit';
import { healthCheckService } from '$lib/server/health-check.service';
import { validateRequest } from '$lib/server/auth';

import type { RequestHandler } from './$types';

/**
 * POST /api/health-check/check-all
 * Trigger health check for all user's bookmarks
 */
export const POST: RequestHandler = async (event) => {
	const { user } = await validateRequest(event);

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const results = await healthCheckService.checkAllUserBookmarks(user.id);

		return json({
			success: true,
			results,
			summary: {
				total: results.length,
				online: results.filter((r) => r.status === 'online').length,
				offline: results.filter((r) => r.status === 'offline').length,
				error: results.filter((r) => r.status === 'error').length
			}
		});
	} catch (error) {
		console.error('Failed to check all bookmarks:', error);
		return json(
			{
				error: 'Failed to check all bookmarks'
			},
			{ status: 500 }
		);
	}
};

/**
 * GET /api/health-check/stats
 * Get health statistics for user's bookmarks
 */
export const GET: RequestHandler = async (event) => {
	const { user } = await validateRequest(event);

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const stats = await healthCheckService.getHealthStats(user.id);

		return json({
			success: true,
			stats
		});
	} catch (error) {
		console.error('Failed to get health stats:', error);
		return json(
			{
				error: 'Failed to retrieve health statistics'
			},
			{ status: 500 }
		);
	}
};
