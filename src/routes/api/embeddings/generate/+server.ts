import { json } from '@sveltejs/kit';
import { embeddingService } from '$lib/server/semantic-search.service';
import { validateRequest } from '$lib/server/auth';
import { getBookmarkById } from '$lib/database/repositories/Bookmark.repository';

import type { RequestHandler } from './$types';

/**
 * POST /api/embeddings/generate
 * Generate embeddings for one or more bookmarks
 *
 * Request body:
 * {
 *   bookmarkId?: number,      // Single bookmark ID
 *   bookmarkIds?: number[],   // Multiple bookmark IDs
 *   all?: boolean             // Generate for all user bookmarks (admin only)
 * }
 */
export const POST: RequestHandler = async (event) => {
	const { user } = await validateRequest(event);

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await event.request.json();
		const { bookmarkId, bookmarkIds, all } = body;

		// Validate input
		if (!bookmarkId && !bookmarkIds && !all) {
			return json(
				{ error: 'Must provide bookmarkId, bookmarkIds, or all=true' },
				{ status: 400 }
			);
		}

		let idsToProcess: number[] = [];

		if (bookmarkId) {
			// Single bookmark
			const bookmark = await getBookmarkById(bookmarkId);
			if (!bookmark) {
				return json({ error: 'Bookmark not found' }, { status: 404 });
			}
			if (bookmark.ownerId !== user.id) {
				return json({ error: 'Forbidden: Not your bookmark' }, { status: 403 });
			}
			idsToProcess = [bookmarkId];
		} else if (bookmarkIds && Array.isArray(bookmarkIds)) {
			// Multiple bookmarks - verify ownership
			const bookmarks = await Promise.all(
				bookmarkIds.map((id) => getBookmarkById(id))
			);

			const unauthorizedBookmarks = bookmarks.filter(
				(b) => !b || b.ownerId !== user.id
			);

			if (unauthorizedBookmarks.length > 0) {
				return json(
					{ error: 'Some bookmarks not found or not owned by you' },
					{ status: 403 }
				);
			}

			idsToProcess = bookmarkIds;
		} else if (all) {
			// All user bookmarks
			// TODO: Implement getAllBookmarksByUserId
			return json(
				{ error: 'Generate all not yet implemented. Use bookmarkIds instead.' },
				{ status: 501 }
			);
		}

		// Generate embeddings (async process)
		// Don't await - let it run in background for large batches
		const promise = embeddingService.generateEmbeddings(idsToProcess);

		// For small batches, wait for completion
		if (idsToProcess.length <= 5) {
			await promise;
			return json({
				success: true,
				message: `Generated embeddings for ${idsToProcess.length} bookmark(s)`,
				processed: idsToProcess.length
			});
		}

		// For large batches, return immediately
		return json({
			success: true,
			message: `Started generating embeddings for ${idsToProcess.length} bookmarks`,
			processing: idsToProcess.length,
			status: 'processing'
		});
	} catch (error) {
		console.error('Failed to generate embeddings:', error);
		return json(
			{
				error: 'Failed to generate embeddings',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
