import { json } from '@sveltejs/kit';
import { snapshotService } from '$lib/server/snapshot.service';
import { validateRequest } from '$lib/server/auth';

import type { RequestHandler } from './$types';

/**
 * POST /api/bookmarks/[id]/snapshot
 * Create a snapshot of a bookmark
 */
export const POST: RequestHandler = async (event) => {
	const { user } = await validateRequest(event);

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const bookmarkId = parseInt(event.params.id);
	const { level } = await event.request.json();

	// Validate level
	if (!['L1', 'L2', 'L3'].includes(level)) {
		return json({ error: 'Invalid snapshot level. Must be L1, L2, or L3' }, { status: 400 });
	}

	try {
		const snapshot = await snapshotService.createSnapshot({
			bookmarkId,
			level,
			userId: user.id
		});

		return json({
			success: true,
			snapshot
		});
	} catch (error) {
		console.error('Failed to create snapshot:', error);
		return json(
			{
				error: error instanceof Error ? error.message : 'Failed to create snapshot'
			},
			{ status: 500 }
		);
	}
};

/**
 * GET /api/bookmarks/[id]/snapshot
 * Get the latest snapshot of a bookmark
 */
export const GET: RequestHandler = async (event) => {
	const { user } = await validateRequest(event);

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const bookmarkId = parseInt(event.params.id);

	try {
		const snapshot = await snapshotService.getSnapshot(bookmarkId);

		if (!snapshot) {
			return json({ error: 'Snapshot not found' }, { status: 404 });
		}

		return json({
			success: true,
			snapshot
		});
	} catch (error) {
		console.error('Failed to get snapshot:', error);
		return json(
			{
				error: 'Failed to retrieve snapshot'
			},
			{ status: 500 }
		);
	}
};

/**
 * DELETE /api/bookmarks/[id]/snapshot/[snapshotId]
 * Delete a specific snapshot
 */
export const DELETE: RequestHandler = async (event) => {
	const { user } = await validateRequest(event);

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const snapshotId = parseInt(event.url.searchParams.get('snapshotId') || '0');

	if (!snapshotId) {
		return json({ error: 'Snapshot ID required' }, { status: 400 });
	}

	try {
		await snapshotService.deleteSnapshot(snapshotId);

		return json({
			success: true
		});
	} catch (error) {
		console.error('Failed to delete snapshot:', error);
		return json(
			{
				error: 'Failed to delete snapshot'
			},
			{ status: 500 }
		);
	}
};
