import { eq, and, ne, or, sql } from 'drizzle-orm';
import { db } from '$lib/database/db';
import { bookmarkSchema, duplicateGroupSchema, bookmarksToTagsSchema } from '$lib/database/schema';

import type { DB } from '$lib/database/db';

export type DuplicateReason = 'same_url' | 'same_domain' | 'similar_content';

interface DuplicateGroup {
	id: number;
	masterBookmarkId: number | null;
	reason: DuplicateReason;
	similarity?: number;
	bookmarks: any[];
}

interface DetectDuplicatesOptions {
	userId: number;
	method: DuplicateReason;
	threshold?: number; // For similar_content (0-100)
}

interface MergeDuplicatesOptions {
	masterBookmarkId: number;
	duplicateBookmarkIds: number[];
	userId: number;
}

/**
 * DeduplicationService
 * Detects and manages duplicate bookmarks
 */
export class DeduplicationService {
	constructor(private dbClient: DB = db) {}

	/**
	 * Detect duplicates using specified method
	 */
	async detectDuplicates(options: DetectDuplicatesOptions): Promise<DuplicateGroup[]> {
		const { userId, method, threshold = 80 } = options;

		switch (method) {
			case 'same_url':
				return this.detectSameUrl(userId);
			case 'same_domain':
				return this.detectSameDomain(userId);
			case 'similar_content':
				return this.detectSimilarContent(userId, threshold);
			default:
				throw new Error(`Invalid detection method: ${method}`);
		}
	}

	/**
	 * Detect exact URL duplicates
	 */
	private async detectSameUrl(userId: number): Promise<DuplicateGroup[]> {
		// Find URLs that appear more than once for this user
		const duplicateUrls = await this.dbClient
			.select({
				url: bookmarkSchema.url,
				count: sql<number>`count(*)`
			})
			.from(bookmarkSchema)
			.where(eq(bookmarkSchema.ownerId, userId))
			.groupBy(bookmarkSchema.url)
			.having(sql`count(*) > 1`);

		const groups: DuplicateGroup[] = [];

		for (const { url } of duplicateUrls) {
			const bookmarks = await this.dbClient.query.bookmarkSchema.findMany({
				where: and(eq(bookmarkSchema.url, url), eq(bookmarkSchema.ownerId, userId)),
				orderBy: (bookmark, { asc }) => [asc(bookmark.created)]
			});

			if (bookmarks.length > 1) {
				// Check if group already exists
				const existingGroup = await this.findExistingGroup(
					userId,
					bookmarks.map((b) => b.id),
					'same_url'
				);

				if (!existingGroup) {
					// Create new duplicate group
					const [group] = await this.dbClient
						.insert(duplicateGroupSchema)
						.values({
							masterBookmarkId: bookmarks[0].id, // Oldest bookmark is master
							reason: 'same_url',
							similarity: 100,
							ownerId: userId
						})
						.returning();

					// Update bookmarks to reference this group
					for (const bookmark of bookmarks) {
						await this.dbClient
							.update(bookmarkSchema)
							.set({ duplicateGroupId: group.id })
							.where(eq(bookmarkSchema.id, bookmark.id));
					}

					groups.push({
						id: group.id,
						masterBookmarkId: group.masterBookmarkId,
						reason: 'same_url',
						similarity: 100,
						bookmarks
					});
				}
			}
		}

		return groups;
	}

	/**
	 * Detect same domain duplicates
	 */
	private async detectSameDomain(userId: number): Promise<DuplicateGroup[]> {
		// Find domains that appear more than once
		const duplicateDomains = await this.dbClient
			.select({
				domain: bookmarkSchema.domain,
				count: sql<number>`count(*)`
			})
			.from(bookmarkSchema)
			.where(eq(bookmarkSchema.ownerId, userId))
			.groupBy(bookmarkSchema.domain)
			.having(sql`count(*) > 1`);

		const groups: DuplicateGroup[] = [];

		for (const { domain } of duplicateDomains) {
			const bookmarks = await this.dbClient.query.bookmarkSchema.findMany({
				where: and(eq(bookmarkSchema.domain, domain), eq(bookmarkSchema.ownerId, userId)),
				orderBy: (bookmark, { asc }) => [asc(bookmark.created)],
				limit: 10 // Limit to avoid huge groups
			});

			if (bookmarks.length > 1) {
				const existingGroup = await this.findExistingGroup(
					userId,
					bookmarks.map((b) => b.id),
					'same_domain'
				);

				if (!existingGroup) {
					const [group] = await this.dbClient
						.insert(duplicateGroupSchema)
						.values({
							masterBookmarkId: bookmarks[0].id,
							reason: 'same_domain',
							similarity: 90, // High but not 100% since URLs differ
							ownerId: userId
						})
						.returning();

					for (const bookmark of bookmarks) {
						await this.dbClient
							.update(bookmarkSchema)
							.set({ duplicateGroupId: group.id })
							.where(eq(bookmarkSchema.id, bookmark.id));
					}

					groups.push({
						id: group.id,
						masterBookmarkId: group.masterBookmarkId,
						reason: 'same_domain',
						similarity: 90,
						bookmarks
					});
				}
			}
		}

		return groups;
	}

	/**
	 * Detect similar content duplicates
	 * Note: This is a basic implementation. For semantic similarity,
	 * use embeddings (will be implemented in Phase 2.2)
	 */
	private async detectSimilarContent(
		userId: number,
		threshold: number
	): Promise<DuplicateGroup[]> {
		const bookmarks = await this.dbClient.query.bookmarkSchema.findMany({
			where: eq(bookmarkSchema.ownerId, userId)
		});

		const groups: DuplicateGroup[] = [];
		const processed = new Set<number>();

		for (let i = 0; i < bookmarks.length; i++) {
			if (processed.has(bookmarks[i].id)) continue;

			const similar: any[] = [bookmarks[i]];

			for (let j = i + 1; j < bookmarks.length; j++) {
				if (processed.has(bookmarks[j].id)) continue;

				// Simple similarity check based on title and description
				const similarity = this.calculateTextSimilarity(
					`${bookmarks[i].title} ${bookmarks[i].description || ''}`,
					`${bookmarks[j].title} ${bookmarks[j].description || ''}`
				);

				if (similarity >= threshold) {
					similar.push(bookmarks[j]);
					processed.add(bookmarks[j].id);
				}
			}

			if (similar.length > 1) {
				processed.add(bookmarks[i].id);

				const [group] = await this.dbClient
					.insert(duplicateGroupSchema)
					.values({
						masterBookmarkId: similar[0].id,
						reason: 'similar_content',
						similarity: threshold,
						ownerId: userId
					})
					.returning();

				for (const bookmark of similar) {
					await this.dbClient
						.update(bookmarkSchema)
						.set({ duplicateGroupId: group.id })
						.where(eq(bookmarkSchema.id, bookmark.id));
				}

				groups.push({
					id: group.id,
					masterBookmarkId: group.masterBookmarkId,
					reason: 'similar_content',
					similarity: threshold,
					bookmarks: similar
				});
			}
		}

		return groups;
	}

	/**
	 * Merge duplicate bookmarks
	 * Keeps master bookmark and merges tags, notes from duplicates
	 */
	async mergeDuplicates(options: MergeDuplicatesOptions): Promise<void> {
		const { masterBookmarkId, duplicateBookmarkIds, userId } = options;

		// Verify ownership of master bookmark
		const masterBookmark = await this.dbClient.query.bookmarkSchema.findFirst({
			where: eq(bookmarkSchema.id, masterBookmarkId),
			with: {
				tags: {
					with: {
						tag: true
					}
				}
			}
		});

		if (!masterBookmark || masterBookmark.ownerId !== userId) {
			throw new Error('Master bookmark not found or unauthorized');
		}

		// Get all duplicate bookmarks
		const duplicates = await this.dbClient.query.bookmarkSchema.findMany({
			where: and(
				sql`${bookmarkSchema.id} IN ${duplicateBookmarkIds}`,
				eq(bookmarkSchema.ownerId, userId)
			),
			with: {
				tags: {
					with: {
						tag: true
					}
				}
			}
		});

		// Merge tags from duplicates
		const existingTagIds = new Set(masterBookmark.tags.map((t) => t.tag.id));

		for (const duplicate of duplicates) {
			for (const { tag } of duplicate.tags) {
				if (!existingTagIds.has(tag.id)) {
					await this.dbClient.insert(bookmarksToTagsSchema).values({
						bookmarkId: masterBookmarkId,
						tagId: tag.id
					});
					existingTagIds.add(tag.id);
				}
			}

			// Merge notes (append to master if both have notes)
			if (duplicate.note && duplicate.note.trim()) {
				const updatedNote = masterBookmark.note
					? `${masterBookmark.note}\n\n---\nMerged from duplicate:\n${duplicate.note}`
					: duplicate.note;

				await this.dbClient
					.update(bookmarkSchema)
					.set({ note: updatedNote })
					.where(eq(bookmarkSchema.id, masterBookmarkId));
			}
		}

		// Delete duplicate bookmarks
		await this.dbClient
			.delete(bookmarkSchema)
			.where(
				and(sql`${bookmarkSchema.id} IN ${duplicateBookmarkIds}`, eq(bookmarkSchema.ownerId, userId))
			);
	}

	/**
	 * Get all duplicate groups for a user
	 */
	async getDuplicateGroups(userId: number): Promise<DuplicateGroup[]> {
		const groups = await this.dbClient.query.duplicateGroupSchema.findMany({
			where: eq(duplicateGroupSchema.ownerId, userId),
			with: {
				bookmarks: true,
				masterBookmark: true
			}
		});

		return groups.map((g) => ({
			id: g.id,
			masterBookmarkId: g.masterBookmarkId,
			reason: g.reason as DuplicateReason,
			similarity: g.similarity || undefined,
			bookmarks: g.bookmarks
		}));
	}

	/**
	 * Delete a duplicate group (ungroup bookmarks)
	 */
	async deleteGroup(groupId: number, userId: number): Promise<void> {
		// Verify ownership
		const group = await this.dbClient.query.duplicateGroupSchema.findFirst({
			where: eq(duplicateGroupSchema.id, groupId)
		});

		if (!group || group.ownerId !== userId) {
			throw new Error('Group not found or unauthorized');
		}

		// Remove group reference from bookmarks
		await this.dbClient
			.update(bookmarkSchema)
			.set({ duplicateGroupId: null })
			.where(eq(bookmarkSchema.duplicateGroupId, groupId));

		// Delete group
		await this.dbClient.delete(duplicateGroupSchema).where(eq(duplicateGroupSchema.id, groupId));
	}

	/**
	 * Helper: Find existing duplicate group
	 */
	private async findExistingGroup(
		userId: number,
		bookmarkIds: number[],
		reason: DuplicateReason
	): Promise<any> {
		// Check if any bookmark is already in a group with same reason
		const bookmark = await this.dbClient.query.bookmarkSchema.findFirst({
			where: and(
				sql`${bookmarkSchema.id} IN ${bookmarkIds}`,
				ne(bookmarkSchema.duplicateGroupId, null)
			),
			with: {
				duplicateGroup: true
			}
		});

		return bookmark?.duplicateGroup?.reason === reason ? bookmark.duplicateGroup : null;
	}

	/**
	 * Helper: Calculate text similarity (Jaccard similarity)
	 */
	private calculateTextSimilarity(text1: string, text2: string): number {
		const words1 = new Set(text1.toLowerCase().split(/\s+/));
		const words2 = new Set(text2.toLowerCase().split(/\s+/));

		const intersection = new Set([...words1].filter((w) => words2.has(w)));
		const union = new Set([...words1, ...words2]);

		return (intersection.size / union.size) * 100;
	}
}

// Export singleton instance
export const deduplicationService = new DeduplicationService();
