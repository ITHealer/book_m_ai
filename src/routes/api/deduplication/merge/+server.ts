import { json } from '@sveltejs/kit';
import { deduplicationService } from '$lib/server/deduplication.service';
import { validateRequest } from '$lib/server/auth';

import type { RequestHandler } from './$types';

/**
 * POST /api/deduplication/merge
 * Merge duplicate bookmarks
 */
export const POST: RequestHandler = async (event) => {
	const { user } = await validateRequest(event);

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { masterBookmarkId, duplicateBookmarkIds } = await event.request.json();

	if (!masterBookmarkId || !Array.isArray(duplicateBookmarkIds) || duplicateBookmarkIds.length === 0) {
		return json(
			{
				error: 'Invalid request. Provide masterBookmarkId and duplicateBookmarkIds array'
			},
			{ status: 400 }
		);
	}

	try {
		await deduplicationService.mergeDuplicates({
			masterBookmarkId,
			duplicateBookmarkIds,
			userId: user.id
		});

		return json({
			success: true,
			message: `Merged ${duplicateBookmarkIds.length} duplicates into bookmark ${masterBookmarkId}`
		});
	} catch (error) {
		console.error('Failed to merge duplicates:', error);
		return json(
			{
				error: error instanceof Error ? error.message : 'Failed to merge duplicates'
			},
			{ status: 500 }
		);
	}
};
