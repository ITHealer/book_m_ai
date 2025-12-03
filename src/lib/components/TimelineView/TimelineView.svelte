<script lang="ts">
	import TimelineCard from './TimelineCard.svelte';
	import type { Bookmark } from '$lib/types/Bookmark.type';

	export let bookmarks: Bookmark[] = [];
	export let onBookmarkClick: (bookmark: Bookmark) => void = () => {};

	// Group bookmarks by month
	function groupByMonth(bookmarks: Bookmark[]): Map<string, Bookmark[]> {
		const groups = new Map<string, Bookmark[]>();

		bookmarks.forEach(bookmark => {
			const date = bookmark.created ? new Date(bookmark.created) : new Date();
			const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
			const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

			if (!groups.has(monthKey)) {
				groups.set(monthKey, []);
			}
			groups.get(monthKey)!.push(bookmark);
		});

		// Sort by date descending (newest first)
		return new Map([...groups.entries()].sort((a, b) => b[0].localeCompare(a[0])));
	}

	$: groupedBookmarks = groupByMonth(bookmarks);

	function formatMonth(monthKey: string): string {
		const [year, month] = monthKey.split('-');
		const date = new Date(parseInt(year), parseInt(month) - 1);
		return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
	}
</script>

<div class="timeline-view w-full p-4 overflow-y-auto">
	{#each Array.from(groupedBookmarks.entries()) as [monthKey, monthBookmarks], groupIndex}
		<div class="timeline-group mb-8">
			<!-- Month Header -->
			<div class="flex items-center gap-4 mb-4">
				<div class="timeline-dot"></div>
				<h3 class="text-xl font-bold">{formatMonth(monthKey)}</h3>
				<span class="badge badge-neutral">{monthBookmarks.length} bookmark{monthBookmarks.length !== 1 ? 's' : ''}</span>
			</div>

			<!-- Bookmarks List -->
			<div class="timeline-items ml-4 pl-8 border-l-2 border-base-300 space-y-3">
				{#each monthBookmarks as bookmark}
					<TimelineCard {bookmark} onClick={() => onBookmarkClick(bookmark)} />
				{/each}
			</div>
		</div>
	{/each}

	{#if groupedBookmarks.size === 0}
		<div class="text-center py-12 text-base-content/50">
			<p class="text-lg">No bookmarks found</p>
			<p class="text-sm mt-2">Start adding bookmarks to see them here</p>
		</div>
	{/if}
</div>

<style>
	.timeline-view {
		position: relative;
	}

	.timeline-dot {
		width: 12px;
		height: 12px;
		background: linear-gradient(135deg, var(--p) 0%, var(--s) 100%);
		border-radius: 50%;
		flex-shrink: 0;
	}

	.timeline-items {
		position: relative;
	}
</style>
