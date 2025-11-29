import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { convert } from 'html-to-text';
import sanitize from 'sanitize-html';
import { extract } from '@extractus/article-extractor';

import { db } from '$lib/database/db';
import { bookmarkSchema, snapshotSchema, fileSchema } from '$lib/database/schema';
import { FileStorageTypeEnum, FileSourceEnum } from '$lib/enums/files';

import type { DB } from '$lib/database/db';

export type SnapshotLevel = 'L1' | 'L2' | 'L3';

interface SnapshotResult {
	id: number;
	level: SnapshotLevel;
	size: number;
	contentHash: string;
}

interface CreateSnapshotOptions {
	bookmarkId: number;
	level: SnapshotLevel;
	userId: number;
}

/**
 * SnapshotService
 * Handles creation and management of bookmark snapshots at different levels:
 * - L1: Text only (lightweight)
 * - L2: HTML + images (medium)
 * - L3: Full archive (comprehensive)
 */
export class SnapshotService {
	constructor(private dbClient: DB = db) {}

	/**
	 * Create a snapshot of a bookmark at the specified level
	 */
	async createSnapshot(options: CreateSnapshotOptions): Promise<SnapshotResult> {
		const { bookmarkId, level, userId } = options;

		// Get bookmark details
		const bookmark = await this.dbClient.query.bookmarkSchema.findFirst({
			where: eq(bookmarkSchema.id, bookmarkId),
			with: {
				owner: true
			}
		});

		if (!bookmark) {
			throw new Error(`Bookmark ${bookmarkId} not found`);
		}

		// Verify ownership
		if (bookmark.ownerId !== userId) {
			throw new Error('Unauthorized: User does not own this bookmark');
		}

		let snapshotData;

		switch (level) {
			case 'L1':
				snapshotData = await this.createL1Snapshot(bookmark);
				break;
			case 'L2':
				snapshotData = await this.createL2Snapshot(bookmark, userId);
				break;
			case 'L3':
				snapshotData = await this.createL3Snapshot(bookmark, userId);
				break;
			default:
				throw new Error(`Invalid snapshot level: ${level}`);
		}

		// Save snapshot to database
		const [snapshot] = await this.dbClient
			.insert(snapshotSchema)
			.values({
				bookmarkId,
				level,
				...snapshotData
			})
			.returning();

		// Update bookmark snapshot level and refreshed time
		await this.dbClient
			.update(bookmarkSchema)
			.set({
				snapshotLevel: level,
				refreshedAt: new Date()
			})
			.where(eq(bookmarkSchema.id, bookmarkId));

		return {
			id: snapshot.id,
			level,
			size: snapshot.size || 0,
			contentHash: snapshot.contentHash || ''
		};
	}

	/**
	 * L1 Snapshot: Text only
	 * Extracts and stores only the text content
	 */
	private async createL1Snapshot(bookmark: any) {
		let textContent: string;

		// Use existing contentText if available
		if (bookmark.contentText) {
			textContent = bookmark.contentText;
		} else {
			// Fetch and extract fresh content
			try {
				const article = await extract(bookmark.url);
				textContent = article?.content
					? convert(article.content, { wordwrap: false })
					: '';
			} catch (error) {
				console.error('L1 snapshot extraction failed:', error);
				textContent = bookmark.description || bookmark.title || '';
			}
		}

		const contentHash = this.generateHash(textContent);

		return {
			textContent,
			htmlContent: null,
			imageFileIds: null,
			archiveFileId: null,
			size: Buffer.byteLength(textContent, 'utf8'),
			contentHash
		};
	}

	/**
	 * L2 Snapshot: HTML + images
	 * Stores HTML content and downloads referenced images
	 */
	private async createL2Snapshot(bookmark: any, userId: number) {
		let htmlContent: string;
		const imageFileIds: number[] = [];

		try {
			// Fetch fresh HTML content
			const article = await extract(bookmark.url);
			htmlContent = article?.content ? sanitize(article.content) : bookmark.contentHtml || '';

			// Extract image URLs from HTML
			const imageUrls = this.extractImageUrls(htmlContent);

			// Download and save images (limit to first 10 to avoid excessive storage)
			for (const imageUrl of imageUrls.slice(0, 10)) {
				try {
					const fileId = await this.downloadAndSaveImage(imageUrl, userId, bookmark.url);
					if (fileId) {
						imageFileIds.push(fileId);
					}
				} catch (error) {
					console.error(`Failed to download image ${imageUrl}:`, error);
				}
			}
		} catch (error) {
			console.error('L2 snapshot extraction failed:', error);
			htmlContent = bookmark.contentHtml || '';
		}

		const contentHash = this.generateHash(htmlContent);

		return {
			textContent: convert(htmlContent, { wordwrap: false }),
			htmlContent,
			imageFileIds: imageFileIds.length > 0 ? imageFileIds : null,
			archiveFileId: null,
			size: Buffer.byteLength(htmlContent, 'utf8'),
			contentHash
		};
	}

	/**
	 * L3 Snapshot: Full archive
	 * Creates a complete archive of the page (future enhancement: MHTML/WARC format)
	 */
	private async createL3Snapshot(bookmark: any, userId: number) {
		// For now, L3 includes L2 features plus the original HTML
		// Future: Generate MHTML or WARC archive
		const l2Data = await this.createL2Snapshot(bookmark, userId);

		// TODO: Create actual archive file (MHTML/WARC)
		// For now, we'll just mark it as L3 with enhanced metadata

		return {
			...l2Data,
			// archiveFileId: null // Will be implemented when archive generation is added
		};
	}

	/**
	 * Get snapshot for a bookmark
	 */
	async getSnapshot(bookmarkId: number): Promise<any> {
		const snapshots = await this.dbClient.query.snapshotSchema.findMany({
			where: eq(snapshotSchema.bookmarkId, bookmarkId),
			orderBy: (snapshot, { desc }) => [desc(snapshot.created)],
			limit: 1
		});

		return snapshots[0] || null;
	}

	/**
	 * Delete snapshot
	 */
	async deleteSnapshot(snapshotId: number): Promise<void> {
		await this.dbClient.delete(snapshotSchema).where(eq(snapshotSchema.id, snapshotId));
	}

	/**
	 * Helper: Extract image URLs from HTML
	 */
	private extractImageUrls(html: string): string[] {
		const imageRegex = /<img[^>]+src="([^">]+)"/g;
		const urls: string[] = [];
		let match;

		while ((match = imageRegex.exec(html)) !== null) {
			const url = match[1];
			if (url && url.startsWith('http')) {
				urls.push(url);
			}
		}

		return urls;
	}

	/**
	 * Helper: Download and save image
	 */
	private async downloadAndSaveImage(
		imageUrl: string,
		userId: number,
		bookmarkUrl: string
	): Promise<number | null> {
		try {
			const response = await fetch(imageUrl);
			if (!response.ok) return null;

			const buffer = await response.arrayBuffer();
			const fileName = this.generateImageFileName(imageUrl);
			const mimeType = response.headers.get('content-type') || 'image/jpeg';

			// Save to local storage (data/user-uploads)
			const relativePath = `snapshots/${userId}/${fileName}`;
			const fs = await import('fs/promises');
			const path = await import('path');

			const fullPath = path.join(process.cwd(), 'data', 'user-uploads', relativePath);
			await fs.mkdir(path.dirname(fullPath), { recursive: true });
			await fs.writeFile(fullPath, Buffer.from(buffer));

			// Create file record
			const [file] = await this.dbClient
				.insert(fileSchema)
				.values({
					fileName,
					storageType: FileStorageTypeEnum.Local,
					relativePath,
					size: buffer.byteLength,
					mimeType,
					source: FileSourceEnum.Url,
					ownerId: userId
				})
				.returning();

			return file.id;
		} catch (error) {
			console.error('Failed to download image:', error);
			return null;
		}
	}

	/**
	 * Helper: Generate unique file name for image
	 */
	private generateImageFileName(url: string): string {
		const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
		const hash = crypto.createHash('md5').update(url).digest('hex').substring(0, 8);
		return `img_${hash}_${Date.now()}.${ext}`;
	}

	/**
	 * Helper: Generate content hash
	 */
	private generateHash(content: string): string {
		return crypto.createHash('sha256').update(content).digest('hex');
	}
}

// Export singleton instance
export const snapshotService = new SnapshotService();
