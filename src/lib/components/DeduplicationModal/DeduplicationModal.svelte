<script lang="ts">
	import { IconX, IconTrash, IconCheck } from '@tabler/icons-svelte';
	import { onMount } from 'svelte';

	export let isOpen: boolean = false;
	export let onClose: () => void = () => {};

	interface DuplicateGroup {
		type: 'same_url' | 'same_domain' | 'similar_content';
		label: string;
		icon: string;
		color: string;
		items: DuplicateItem[];
		processed?: boolean;
	}

	interface DuplicateItem {
		id: number;
		url: string;
		title: string;
		similarity?: number;
		addedAt: string;
		selected: boolean;
	}

	let groups: DuplicateGroup[] = [];
	let loading = false;
	let selectedCount = 0;

	onMount(async () => {
		if (isOpen) {
			await loadDuplicates();
		}
	});

	$: if (isOpen) {
		loadDuplicates();
	}

	$: selectedCount = groups.reduce(
		(sum, group) => sum + group.items.filter(item => item.selected).length,
		0
	);

	async function loadDuplicates() {
		loading = true;
		try {
			const response = await fetch('/api/deduplication');
			const data = await response.json();

			if (data.success && data.groups) {
				// Transform API response to UI format
				groups = data.groups.map((g: any) => ({
					type: g.reason,
					label: formatGroupLabel(g.reason),
					icon: getGroupIcon(g.reason),
					color: getGroupColor(g.reason),
					items: g.bookmarks.map((b: any) => ({
						id: b.id,
						url: b.url,
						title: b.title,
						similarity: g.similarity,
						addedAt: new Date(b.created * 1000).toISOString().split('T')[0],
						selected: false
					})),
					processed: false
				}));
			}
		} catch (error) {
			console.error('Failed to load duplicates:', error);
		} finally {
			loading = false;
		}
	}

	function formatGroupLabel(type: string): string {
		switch (type) {
			case 'same_url':
				return 'Exact Same URL';
			case 'same_domain':
				return 'Same Domain, Different Path';
			case 'similar_content':
				return 'Similar Content';
			default:
				return type;
		}
	}

	function getGroupIcon(type: string): string {
		switch (type) {
			case 'same_url':
				return '🔗';
			case 'same_domain':
				return '🌐';
			case 'similar_content':
				return '📄';
			default:
				return '📋';
		}
	}

	function getGroupColor(type: string): string {
		switch (type) {
			case 'same_url':
				return 'border-red-500 bg-red-50 dark:bg-red-900/20';
			case 'same_domain':
				return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
			case 'similar_content':
				return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
			default:
				return 'border-base-300';
		}
	}

	function toggleItem(groupIndex: number, itemIndex: number) {
		groups[groupIndex].items[itemIndex].selected = !groups[groupIndex].items[itemIndex].selected;
		groups = groups;
	}

	function toggleAllInGroup(groupIndex: number) {
		const allSelected = groups[groupIndex].items.every(item => item.selected);
		groups[groupIndex].items.forEach(item => {
			item.selected = !allSelected;
		});
		groups = groups;
	}

	async function deleteSelected() {
		const selectedIds = groups.flatMap(group =>
			group.items.filter(item => item.selected).map(item => item.id)
		);

		if (selectedIds.length === 0) return;

		if (!confirm(`Delete ${selectedIds.length} selected bookmark(s)?`)) return;

		loading = true;
		try {
			// Delete each bookmark
			for (const id of selectedIds) {
				await fetch(`/api/bookmarks?id=${id}`, { method: 'DELETE' });
			}

			// Reload duplicates
			await loadDuplicates();
		} catch (error) {
			console.error('Failed to delete bookmarks:', error);
		} finally {
			loading = false;
		}
	}

	async function mergeGroup(groupIndex: number) {
		const group = groups[groupIndex];
		const selectedInGroup = group.items.filter(item => item.selected);

		if (selectedInGroup.length < 2) {
			alert('Please select at least 2 bookmarks to merge');
			return;
		}

		if (!confirm(`Merge ${selectedInGroup.length} bookmarks? The first selected will be kept.`)) {
			return;
		}

		loading = true;
		try {
			const masterBookmarkId = selectedInGroup[0].id;
			const duplicateIds = selectedInGroup.slice(1).map(item => item.id);

			const response = await fetch('/api/deduplication/merge', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					masterBookmarkId,
					duplicateIds
				})
			});

			if (response.ok) {
				groups[groupIndex].processed = true;
				groups = groups;
			}
		} catch (error) {
			console.error('Failed to merge bookmarks:', error);
		} finally {
			loading = false;
		}
	}

	function ignoreGroup(groupIndex: number) {
		groups[groupIndex].processed = true;
		groups = groups;
	}

	// Calculate summary statistics
	$: summaryStats = {
		exactUrl: groups.filter(g => g.type === 'same_url').length,
		sameDomain: groups.filter(g => g.type === 'same_domain').length,
		similarContent: groups.filter(g => g.type === 'similar_content').length
	};
</script>

{#if isOpen}
	<!-- Modal Backdrop -->
	<div class="modal modal-open">
		<div class="modal-box max-w-6xl h-5/6 flex flex-col p-0">
			<!-- Header -->
			<div class="sticky top-0 bg-warning text-warning-content px-6 py-4 flex items-center justify-between z-10 shadow-sm">
				<div class="flex items-center gap-3">
					<span class="text-2xl">🔄</span>
					<h3 class="font-bold text-xl">Deduplication - Manage Duplicates</h3>
				</div>
				<button on:click={onClose} class="btn btn-ghost btn-sm btn-circle">
					<IconX size={20} />
				</button>
			</div>

			<!-- Summary Stats -->
			<div class="px-6 py-4 border-b border-base-300 bg-base-200">
				<div class="flex gap-4 justify-center">
					<div class="stats stats-compact shadow">
						<div class="stat place-items-center">
							<div class="stat-title text-xs">Exact URL Match</div>
							<div class="stat-value text-red-600">{summaryStats.exactUrl}</div>
						</div>
					</div>
					<div class="stats stats-compact shadow">
						<div class="stat place-items-center">
							<div class="stat-title text-xs">Same Domain</div>
							<div class="stat-value text-yellow-600">{summaryStats.sameDomain}</div>
						</div>
					</div>
					<div class="stats stats-compact shadow">
						<div class="stat place-items-center">
							<div class="stat-title text-xs">Similar Content</div>
							<div class="stat-value text-blue-600">{summaryStats.similarContent}</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Groups List -->
			<div class="flex-1 overflow-y-auto p-6 space-y-4">
				{#if loading}
					<div class="flex items-center justify-center h-full">
						<span class="loading loading-spinner loading-lg"></span>
					</div>
				{:else if groups.length === 0}
					<div class="flex items-center justify-center h-full text-center">
						<div>
							<p class="text-lg font-medium mb-2">✨ No duplicates found!</p>
							<p class="text-sm opacity-70">Your bookmarks are clean and organized.</p>
						</div>
					</div>
				{:else}
					{#each groups as group, groupIndex}
						<div class={`card border-2 ${group.color} ${group.processed ? 'opacity-50' : ''}`}>
							<div class="card-body p-4">
								<!-- Group Header -->
								<div class="flex items-center justify-between mb-3">
									<div class="flex items-center gap-2">
										<span class="text-2xl">{group.icon}</span>
										<h4 class="font-bold text-lg">{group.label}</h4>
										<span class="badge badge-neutral">{group.items.length} items</span>
									</div>
									<div class="flex gap-2">
										{#if !group.processed}
											<button
												on:click={() => mergeGroup(groupIndex)}
												class="btn btn-success btn-sm gap-1">
												<IconCheck size={16} />
												Merge & Keep
											</button>
											<button
												on:click={() => ignoreGroup(groupIndex)}
												class="btn btn-ghost btn-sm">
												Ignore
											</button>
										{:else}
											<span class="badge badge-success gap-1">
												<IconCheck size={14} />
												✓ Processed
											</span>
										{/if}
									</div>
								</div>

								<!-- Items -->
								<div class="space-y-2">
									{#each group.items as item, itemIndex}
										<div class="flex items-center gap-3 p-3 bg-base-100 rounded-lg border border-base-300">
											<input
												type="checkbox"
												checked={item.selected}
												on:change={() => toggleItem(groupIndex, itemIndex)}
												class="checkbox checkbox-sm"
												disabled={group.processed} />
											<div class="flex-1 min-w-0">
												<p class="font-medium truncate">{item.title}</p>
												<a
													href={item.url}
													target="_blank"
													rel="noopener noreferrer"
													class="text-xs text-primary hover:underline truncate block">
													{item.url}
												</a>
												<p class="text-xs opacity-60 mt-1">{item.addedAt}</p>
											</div>
											{#if item.similarity !== undefined}
												<span class="badge badge-info badge-sm">{item.similarity}% similar</span>
											{/if}
											<button
												on:click={async () => {
													if (confirm('Delete this bookmark?')) {
														await fetch(`/api/bookmarks?id=${item.id}`, { method: 'DELETE' });
														await loadDuplicates();
													}
												}}
												class="btn btn-ghost btn-sm btn-circle text-error"
												disabled={group.processed}>
												<IconTrash size={16} />
											</button>
										</div>
									{/each}
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<!-- Footer Actions -->
			<div class="sticky bottom-0 bg-base-200 px-6 py-4 border-t border-base-300 flex items-center justify-between">
				<button on:click={loadDuplicates} class="btn btn-ghost btn-sm" disabled={loading}>
					🔄 Refresh
				</button>
				<div class="flex gap-2">
					<button
						on:click={deleteSelected}
						disabled={selectedCount === 0 || loading}
						class="btn btn-error btn-sm gap-1">
						<IconTrash size={16} />
						Delete Selected ({selectedCount})
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
