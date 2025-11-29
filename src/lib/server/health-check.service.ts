import { eq, and, lt, or, isNull } from 'drizzle-orm';
import { db } from '$lib/database/db';
import { bookmarkSchema, healthCheckLogSchema } from '$lib/database/schema';

import type { DB } from '$lib/database/db';

export type HealthStatus = 'online' | 'offline' | 'error' | 'pending';

interface HealthCheckResult {
	bookmarkId: number;
	status: HealthStatus;
	statusCode?: number;
	responseTime?: number;
	errorMessage?: string;
}

interface CheckOptions {
	timeout?: number; // milliseconds
	followRedirects?: boolean;
}

/**
 * HealthCheckService
 * Monitors bookmark URL health and availability
 */
export class HealthCheckService {
	private readonly DEFAULT_TIMEOUT = 10000; // 10 seconds
	private readonly CHECK_INTERVAL_HOURS = 24; // Check every 24 hours

	constructor(private dbClient: DB = db) {}

	/**
	 * Check health of a single bookmark
	 */
	async checkBookmark(
		bookmarkId: number,
		options: CheckOptions = {}
	): Promise<HealthCheckResult> {
		const { timeout = this.DEFAULT_TIMEOUT, followRedirects = true } = options;

		// Get bookmark
		const bookmark = await this.dbClient.query.bookmarkSchema.findFirst({
			where: eq(bookmarkSchema.id, bookmarkId)
		});

		if (!bookmark) {
			throw new Error(`Bookmark ${bookmarkId} not found`);
		}

		const startTime = Date.now();
		let status: HealthStatus = 'error';
		let statusCode: number | undefined;
		let errorMessage: string | undefined;

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), timeout);

			const response = await fetch(bookmark.url, {
				method: 'HEAD',
				signal: controller.signal,
				redirect: followRedirects ? 'follow' : 'manual',
				headers: {
					'User-Agent': 'Healer-HealthCheck/1.0'
				}
			});

			clearTimeout(timeoutId);

			statusCode = response.status;

			// Determine status based on HTTP status code
			if (statusCode >= 200 && statusCode < 300) {
				status = 'online';
			} else if (statusCode >= 300 && statusCode < 400) {
				status = 'online'; // Redirects are OK
			} else if (statusCode >= 400 && statusCode < 500) {
				status = 'offline'; // Client errors (404, 403, etc.)
				errorMessage = `HTTP ${statusCode}`;
			} else {
				status = 'error'; // Server errors
				errorMessage = `HTTP ${statusCode}`;
			}
		} catch (error: any) {
			if (error.name === 'AbortError') {
				status = 'error';
				errorMessage = 'Request timeout';
			} else if (error.cause?.code === 'ENOTFOUND') {
				status = 'offline';
				errorMessage = 'Domain not found';
			} else if (error.cause?.code === 'ECONNREFUSED') {
				status = 'offline';
				errorMessage = 'Connection refused';
			} else {
				status = 'error';
				errorMessage = error.message || 'Unknown error';
			}
		}

		const responseTime = Date.now() - startTime;

		// Save health check log
		await this.dbClient.insert(healthCheckLogSchema).values({
			bookmarkId,
			status,
			statusCode,
			responseTime,
			errorMessage
		});

		// Update bookmark status and refreshedAt
		await this.dbClient
			.update(bookmarkSchema)
			.set({
				status,
				refreshedAt: new Date()
			})
			.where(eq(bookmarkSchema.id, bookmarkId));

		return {
			bookmarkId,
			status,
			statusCode,
			responseTime,
			errorMessage
		};
	}

	/**
	 * Check health of multiple bookmarks
	 */
	async checkMultipleBookmarks(bookmarkIds: number[]): Promise<HealthCheckResult[]> {
		const results: HealthCheckResult[] = [];

		// Process in batches to avoid overwhelming the system
		const BATCH_SIZE = 10;

		for (let i = 0; i < bookmarkIds.length; i += BATCH_SIZE) {
			const batch = bookmarkIds.slice(i, i + BATCH_SIZE);
			const batchResults = await Promise.all(
				batch.map((id) => this.checkBookmark(id).catch((error) => ({
					bookmarkId: id,
					status: 'error' as HealthStatus,
					errorMessage: error.message
				})))
			);
			results.push(...batchResults);
		}

		return results;
	}

	/**
	 * Check bookmarks that need health check
	 * (not checked in the last 24 hours or never checked)
	 */
	async checkStaleBookmarks(userId?: number): Promise<HealthCheckResult[]> {
		const cutoffTime = new Date(Date.now() - this.CHECK_INTERVAL_HOURS * 60 * 60 * 1000);

		// Find bookmarks that need checking
		const conditions = [
			or(
				lt(bookmarkSchema.refreshedAt, cutoffTime),
				isNull(bookmarkSchema.refreshedAt)
			)
		];

		if (userId) {
			conditions.push(eq(bookmarkSchema.ownerId, userId));
		}

		const staleBookmarks = await this.dbClient.query.bookmarkSchema.findMany({
			where: and(...conditions),
			limit: 100 // Limit to avoid overwhelming the system
		});

		const bookmarkIds = staleBookmarks.map((b) => b.id);

		if (bookmarkIds.length === 0) {
			return [];
		}

		console.log(`Checking ${bookmarkIds.length} stale bookmarks...`);
		return this.checkMultipleBookmarks(bookmarkIds);
	}

	/**
	 * Get health check history for a bookmark
	 */
	async getHealthHistory(bookmarkId: number, limit: number = 10) {
		return this.dbClient.query.healthCheckLogSchema.findMany({
			where: eq(healthCheckLogSchema.bookmarkId, bookmarkId),
			orderBy: (log, { desc }) => [desc(log.checked)],
			limit
		});
	}

	/**
	 * Get health statistics for user's bookmarks
	 */
	async getHealthStats(userId: number) {
		const bookmarks = await this.dbClient.query.bookmarkSchema.findMany({
			where: eq(bookmarkSchema.ownerId, userId)
		});

		const stats = {
			total: bookmarks.length,
			online: 0,
			offline: 0,
			error: 0,
			pending: 0
		};

		for (const bookmark of bookmarks) {
			stats[bookmark.status]++;
		}

		return stats;
	}

	/**
	 * Manual trigger: Check all bookmarks for a user
	 */
	async checkAllUserBookmarks(userId: number): Promise<HealthCheckResult[]> {
		const bookmarks = await this.dbClient.query.bookmarkSchema.findMany({
			where: eq(bookmarkSchema.ownerId, userId)
		});

		const bookmarkIds = bookmarks.map((b) => b.id);

		if (bookmarkIds.length === 0) {
			return [];
		}

		console.log(`Checking ${bookmarkIds.length} bookmarks for user ${userId}...`);
		return this.checkMultipleBookmarks(bookmarkIds);
	}
}

// Export singleton instance
export const healthCheckService = new HealthCheckService();
