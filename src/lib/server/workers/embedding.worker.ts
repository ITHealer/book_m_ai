import { embeddingService } from '../semantic-search.service';
import { db } from '$lib/database/db';
import { bookmarkSchema, bookmarkEmbeddingSchema } from '$lib/database/schema';
import { notInArray, sql } from 'drizzle-orm';

/**
 * Embedding Worker
 * Runs periodically to generate embeddings for bookmarks
 */
export class EmbeddingWorker {
	private intervalId: NodeJS.Timeout | null = null;
	private isRunning = false;
	private isProcessing = false;

	/**
	 * Start the worker
	 * @param intervalMinutes - How often to run (default: 30 minutes)
	 */
	start(intervalMinutes: number = 30) {
		if (this.isRunning) {
			console.warn('Embedding worker is already running');
			return;
		}

		console.log(`🤖 Starting embedding worker (interval: ${intervalMinutes} minutes)`);

		// Run immediately on start
		this.runGeneration();

		// Schedule periodic runs
		this.intervalId = setInterval(
			() => {
				this.runGeneration();
			},
			intervalMinutes * 60 * 1000
		);

		this.isRunning = true;
	}

	/**
	 * Stop the worker
	 */
	stop() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
		this.isRunning = false;
		console.log('🤖 Embedding worker stopped');
	}

	/**
	 * Generate embeddings for bookmarks without them
	 */
	private async runGeneration() {
		if (this.isProcessing) {
			console.log('🤖 Embedding generation already in progress, skipping...');
			return;
		}

		this.isProcessing = true;

		try {
			console.log('🤖 Finding bookmarks without embeddings...');

			// Get all bookmark IDs with embeddings
			const existingEmbeddings = await db.query.bookmarkEmbeddingSchema.findMany({
				columns: { bookmarkId: true }
			});

			const embeddedIds = existingEmbeddings.map((e) => e.bookmarkId);

			// Get bookmarks without embeddings
			let bookmarksWithoutEmbeddings;

			if (embeddedIds.length === 0) {
				// No embeddings exist yet, get all bookmarks
				bookmarksWithoutEmbeddings = await db.query.bookmarkSchema.findMany({
					columns: { id: true },
					limit: 50 // Process max 50 at a time
				});
			} else {
				// Get bookmarks not in the embedded list
				bookmarksWithoutEmbeddings = await db.query.bookmarkSchema.findMany({
					where: notInArray(bookmarkSchema.id, embeddedIds),
					columns: { id: true },
					limit: 50 // Process max 50 at a time
				});
			}

			if (bookmarksWithoutEmbeddings.length === 0) {
				console.log('🤖 All bookmarks have embeddings');
				this.isProcessing = false;
				return;
			}

			console.log(
				`🤖 Generating embeddings for ${bookmarksWithoutEmbeddings.length} bookmark(s)...`
			);

			const bookmarkIds = bookmarksWithoutEmbeddings.map((b) => b.id);

			// Generate embeddings in batches
			await embeddingService.generateEmbeddings(bookmarkIds);

			console.log(`🤖 Successfully generated embeddings for ${bookmarkIds.length} bookmarks`);
		} catch (error) {
			console.error('🤖 Embedding worker error:', error);
		} finally {
			this.isProcessing = false;
		}
	}

	/**
	 * Manually trigger generation (for testing or admin use)
	 */
	async triggerGeneration() {
		await this.runGeneration();
	}

	/**
	 * Get worker status
	 */
	getStatus() {
		return {
			running: this.isRunning,
			processing: this.isProcessing,
			intervalId: this.intervalId !== null
		};
	}
}

// Export singleton instance
export const embeddingWorker = new EmbeddingWorker();
