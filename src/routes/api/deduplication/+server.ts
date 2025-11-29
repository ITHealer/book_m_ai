import { json } from '@sveltejs/kit';
import { deduplicationService } from '$lib/server/deduplication.service';
import { validateRequest } from '$lib/server/auth';

import type { RequestHandler } from './$types';

/**
 * POST /api/deduplication/detect
 * Detect duplicate bookmarks
 */
export const POST: RequestHandler = async (event) => {
	const { user } = await validateRequest(event);

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { method, threshold } = await event.request.json();

	// Validate method
	if (!['same_url', 'same_domain', 'similar_content'].includes(method)) {
		return json(
			{ error: 'Invalid method. Must be same_url, same_domain, or similar_content' },
			{ status: 400 }
		);
	}

	try {
		const groups = await deduplicationService.detectDuplicates({
			userId: user.id,
			method,
			threshold: threshold || 80
		});

		return json({
			success: true,
			groups,
			summary: {
				totalGroups: groups.length,
				totalDuplicates: groups.reduce((sum, g) => sum + g.bookmarks.length, 0)
			}
		});
	} catch (error) {
		console.error('Failed to detect duplicates:', error);
		return json(
			{
				error: error instanceof Error ? error.message : 'Failed to detect duplicates'
			},
			{ status: 500 }
		);
	}
};

/**
 * GET /api/deduplication/groups
 * Get all duplicate groups for the user
 */
export const GET: RequestHandler = async (event) => {
	const { user } = await validateRequest(event);

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const groups = await deduplicationService.getDuplicateGroups(user.id);

		return json({
			success: true,
			groups
		});
	} catch (error) {
		console.error('Failed to get duplicate groups:', error);
		return json(
			{
				error: 'Failed to retrieve duplicate groups'
			},
			{ status: 500 }
		);
	}
};
