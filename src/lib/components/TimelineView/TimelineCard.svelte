<script lang="ts">
	import { IconExternalLink, IconClock } from '@tabler/icons-svelte';
	import type { Bookmark } from '$lib/types/Bookmark.type';

	export let bookmark: Bookmark;
	export let onClick: () => void = () => {};

	function formatDate(timestamp: number | Date | null): string {
		if (!timestamp) return 'Unknown';
		const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getStatusBadge(status: string) {
		switch (status) {
			case 'online':
				return { class: 'badge-success', label: 'Online' };
			case 'offline':
				return { class: 'badge-error', label: 'Offline' };
			case 'error':
				return { class: 'badge-warning', label: 'Error' };
			case 'pending':
				return { class: 'badge-ghost', label: 'Checking...' };
			default:
				return { class: 'badge-ghost', label: 'Unknown' };
		}
	}

	$: statusBadge = getStatusBadge(bookmark.status || 'pending');
</script>

<div
	on:click={onClick}
	on:keydown={(e) => e.key === 'Enter' && onClick()}
	role="button"
	tabindex="0"
	class="timeline-card bg-base-100 rounded-lg p-4 border border-base-300 hover:border-primary hover:shadow-lg transition-all duration-200 cursor-pointer">
	<div class="flex items-start gap-3">
		<!-- Favicon -->
		<div class="avatar flex-shrink-0">
			{#if bookmark.icon || bookmark.iconUrl}
				<div class="w-10 h-10 rounded">
					<img src={bookmark.icon || bookmark.iconUrl} alt={bookmark.domain} />
				</div>
			{:else}
				<div class="w-10 h-10 rounded bg-base-200 flex items-center justify-center text-xl">
					🔖
				</div>
			{/if}
		</div>

		<!-- Content -->
		<div class="flex-1 min-w-0">
			<!-- Title and URL -->
			<div class="flex items-start justify-between gap-2 mb-1">
				<h4 class="font-semibold text-base line-clamp-1 flex-1">{bookmark.title}</h4>
				<a
					href={bookmark.url}
					target="_blank"
					rel="noopener noreferrer"
					on:click|stopPropagation
					class="btn btn-ghost btn-xs btn-circle">
					<IconExternalLink size={14} />
				</a>
			</div>

			<!-- URL -->
			<p class="text-xs text-base-content/60 truncate mb-2">{bookmark.url}</p>

			<!-- Badges -->
			<div class="flex items-center gap-2 flex-wrap">
				<!-- Status -->
				<span class={`badge badge-sm ${statusBadge.class}`}>{statusBadge.label}</span>

				<!-- Snapshot Level -->
				{#if bookmark.snapshotLevel && bookmark.snapshotLevel !== 'none'}
					<span class="badge badge-sm badge-info font-mono">📸 {bookmark.snapshotLevel}</span>
				{/if}

				<!-- Timestamp -->
				<span class="badge badge-sm badge-ghost gap-1">
					<IconClock size={12} />
					{formatDate(bookmark.created)}
				</span>
			</div>
		</div>
	</div>
</div>

<style>
	.timeline-card:hover {
		transform: translateY(-2px);
	}
</style>
