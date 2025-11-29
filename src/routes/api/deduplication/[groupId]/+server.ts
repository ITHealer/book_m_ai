import { json } from '@sveltejs/kit';
import { deduplicationService } from '$lib/server/deduplication.service';
import { validateRequest } from '$lib/server/auth';

import type { RequestHandler } from './$types';

/**
 * DELETE /api/deduplication/[groupId]
 * Delete a duplicate group (ungroup bookmarks)
 */
export const DELETE: RequestHandler = async (event) => {
	const { user } = await validateRequest(event);

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const groupId = parseInt(event.params.groupId);

	if (!groupId) {
		return json({ error: 'Invalid group ID' }, { status: 400 });
	}

	try {
		await deduplicationService.deleteGroup(groupId, user.id);

		return json({
			success: true,
			message: `Duplicate group ${groupId} deleted`
		});
	} catch (error) {
		console.error('Failed to delete duplicate group:', error);
		return json(
			{
				error: error instanceof Error ? error.message : 'Failed to delete duplicate group'
			},
			{ status: 500 }
		);
	}
};
