<script lang="ts">
	import { IconX, IconExternalLink, IconCalendar, IconRefresh, IconCamera } from '@tabler/icons-svelte';
	import type { Bookmark } from '$lib/types/Bookmark.type';

	export let bookmark: Bookmark | null = null;
	export let onClose: () => void = () => {};

	function formatDate(timestamp: number | Date | null): string {
		if (!timestamp) return 'Unknown';
		const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp);
		return date.toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getStatusInfo(status: string) {
		switch (status) {
			case 'online':
				return { label: '✓ Active', class: 'badge-success' };
			case 'offline':
				return { label: '✗ Offline', class: 'badge-error' };
			case 'error':
				return { label: '⚠ Error', class: 'badge-warning' };
			case 'pending':
				return { label: '○ Checking...', class: 'badge-ghost' };
			default:
				return { label: '○ Unknown', class: 'badge-ghost' };
		}
	}

	const snapshotLevels = [
		{
			level: 'L1',
			name: 'Text Only',
			description: 'Lightweight snapshot with text and summary (~10KB)',
			icon: '📄'
		},
		{
			level: 'L2',
			name: 'Text + Images',
			description: 'Text content with key images (~100KB)',
			icon: '🖼️'
		},
		{
			level: 'L3',
			name: 'Full Archive',
			description: 'Complete page capture with DOM, CSS, and all assets (~1MB)',
			icon: '💾'
		}
	];

	$: statusInfo = bookmark ? getStatusInfo(bookmark.status || 'pending') : null;
</script>

<aside class="detail-panel w-96 bg-base-100 h-full overflow-y-auto border-l border-base-300 flex flex-col">
	{#if bookmark}
		<!-- Header -->
		<div class="sticky top-0 bg-base-100 border-b border-base-300 p-4 flex items-center justify-between z-10">
			<h2 class="text-lg font-bold">Bookmark Details</h2>
			<button on:click={onClose} class="btn btn-ghost btn-sm btn-circle">
				<IconX size={20} />
			</button>
		</div>

		<div class="flex-1 p-4 space-y-6">
			<!-- Icon and Title -->
			<div class="flex items-start gap-3">
				<div class="avatar">
					{#if bookmark.icon || bookmark.iconUrl}
						<div class="w-12 h-12 rounded">
							<img src={bookmark.icon || bookmark.iconUrl} alt={bookmark.domain} />
						</div>
					{:else}
						<div class="w-12 h-12 rounded bg-base-200 flex items-center justify-center text-2xl">
							🔖
						</div>
					{/if}
				</div>
				<div class="flex-1 min-w-0">
					<h3 class="font-bold text-lg mb-1">{bookmark.title}</h3>
					<a
						href={bookmark.url}
						target="_blank"
						rel="noopener noreferrer"
						class="text-sm text-primary hover:underline flex items-center gap-1 break-all">
						{bookmark.url}
						<IconExternalLink size={14} />
					</a>
				</div>
			</div>

			<!-- Status and Snapshot -->
			<div class="flex gap-2">
				{#if statusInfo}
					<span class={`badge ${statusInfo.class} gap-1 font-semibold`}>
						{statusInfo.label}
					</span>
				{/if}
				{#if bookmark.snapshotLevel && bookmark.snapshotLevel !== 'none'}
					<span class="badge badge-info gap-1 font-mono font-semibold">
						📸 {bookmark.snapshotLevel}
					</span>
				{/if}
			</div>

			<!-- AI Summary -->
			<div class="card bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 shadow-sm">
				<div class="card-body p-4">
					<h4 class="card-title text-sm flex items-center gap-2">
						<span class="text-lg">🤖</span>
						AI Summary
					</h4>
					{#if bookmark.summary}
						<p class="text-sm leading-relaxed">{bookmark.summary}</p>
					{:else if bookmark.description}
						<p class="text-sm leading-relaxed">{bookmark.description}</p>
					{:else}
						<p class="text-sm italic opacity-60">No summary available</p>
					{/if}
				</div>
			</div>

			<!-- Tags -->
			<div>
				<h4 class="font-bold text-sm mb-2 flex items-center gap-2">
					<span>🏷️</span>
					Tags
				</h4>
				<div class="flex flex-wrap gap-2">
					{#if bookmark.tags && bookmark.tags.length > 0}
						{#each bookmark.tags as tag}
							<a
								href={`/tags/${tag.slug}`}
								class="badge badge-primary badge-lg gap-1 hover:badge-secondary transition-colors">
								{tag.name}
							</a>
						{/each}
					{:else}
						<p class="text-sm italic opacity-60">No tags</p>
					{/if}
				</div>
			</div>

			<!-- Timestamps -->
			<div class="space-y-3">
				<h4 class="font-bold text-sm flex items-center gap-2">
					<IconCalendar size={18} />
					Timestamps
				</h4>
				<div class="space-y-2 text-sm">
					<div class="flex justify-between">
						<span class="opacity-70">Added</span>
						<span class="font-medium">{formatDate(bookmark.created)}</span>
					</div>
					{#if bookmark.refreshedAt}
						<div class="flex justify-between">
							<span class="opacity-70">Last Refreshed</span>
							<span class="font-medium">{formatDate(bookmark.refreshedAt)}</span>
						</div>
					{/if}
				</div>
			</div>

			<!-- Snapshots -->
			<div class="space-y-3">
				<h4 class="font-bold text-sm flex items-center gap-2">
					<IconCamera size={18} />
					Snapshots
				</h4>
				<div class="space-y-2">
					{#each snapshotLevels as level}
						<div
							class={`card border ${
								bookmark.snapshotLevel === level.level
									? 'border-primary bg-primary/5'
									: 'border-base-300'
							} transition-all`}>
							<div class="card-body p-3">
								<div class="flex items-center justify-between mb-1">
									<div class="flex items-center gap-2">
										<span class="text-lg">{level.icon}</span>
										<span class="font-bold text-sm">{level.level} - {level.name}</span>
									</div>
									{#if bookmark.snapshotLevel === level.level}
										<span class="badge badge-primary badge-sm font-bold">✓ Current</span>
									{/if}
								</div>
								<p class="text-xs opacity-70">{level.description}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Main Image Preview -->
			{#if bookmark.mainImage || bookmark.mainImageUrl}
				<div>
					<h4 class="font-bold text-sm mb-2">Preview</h4>
					<img
						src={bookmark.mainImage || bookmark.mainImageUrl}
						alt={bookmark.title}
						class="w-full rounded-lg border border-base-300" />
				</div>
			{/if}
		</div>
	{:else}
		<!-- Empty State -->
		<div class="flex-1 flex items-center justify-center p-8">
			<div class="text-center opacity-50">
				<p class="text-lg font-medium mb-2">No bookmark selected</p>
				<p class="text-sm">Select a bookmark to view details</p>
			</div>
		</div>
	{/if}
</aside>

<style>
	.detail-panel {
		min-width: 24rem;
		max-width: 28rem;
	}
</style>
