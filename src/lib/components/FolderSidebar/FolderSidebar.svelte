<script lang="ts">
	import { IconChevronDown, IconChevronRight, IconFolderPlus, IconFolder } from '@tabler/icons-svelte';
	import type { Category } from '$lib/types/Category.type';
	import FolderItem from './FolderItem.svelte';

	export let categories: Category[] = [];
	export let selectedCategoryId: number | null = null;
	export let onSelectFolder: (categoryId: number | null) => void = () => {};
	export let onNewFolder: () => void = () => {};

	// Build folder tree structure
	function buildFolderTree(categories: Category[]): (Category & { children: Category[] })[] {
		const categoryMap = new Map<number, Category & { children: Category[] }>();
		const roots: (Category & { children: Category[] })[] = [];

		// Initialize all categories with children array
		categories.forEach(cat => {
			categoryMap.set(cat.id, { ...cat, children: [] });
		});

		// Build tree
		categories.forEach(cat => {
			const node = categoryMap.get(cat.id)!;
			if (cat.parentId && categoryMap.has(cat.parentId)) {
				categoryMap.get(cat.parentId)!.children.push(node);
			} else {
				roots.push(node);
			}
		});

		return roots;
	}

	$: folderTree = buildFolderTree(categories);
	$: totalBookmarks = categories.reduce((sum, cat) => sum + (cat.bookmarksCount || 0), 0);

	// Track expanded folders
	let expandedFolders = new Set<number>();

	function toggleFolder(folderId: number) {
		if (expandedFolders.has(folderId)) {
			expandedFolders.delete(folderId);
		} else {
			expandedFolders.add(folderId);
		}
		expandedFolders = expandedFolders; // Trigger reactivity
	}
</script>

<aside class="w-64 bg-base-200 h-full overflow-y-auto border-r border-base-300 flex flex-col">
	<!-- Header -->
	<div class="p-4 border-b border-base-300">
		<h2 class="text-lg font-bold flex items-center gap-2">
			<IconFolder size={24} />
			Folders
		</h2>
	</div>

	<!-- All Bookmarks -->
	<button
		on:click={() => onSelectFolder(null)}
		class={`flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-base-300 transition-colors ${
			selectedCategoryId === null ? 'bg-primary text-primary-content' : ''
		}`}>
		<span class="text-xl">📚</span>
		<span class="flex-1 font-medium">All Bookmarks</span>
		<span class="badge badge-sm">{totalBookmarks}</span>
	</button>

	<!-- Folder Tree -->
	<div class="flex-1 overflow-y-auto">
		{#each folderTree as folder}
			<FolderItem
				{folder}
				level={0}
				{selectedCategoryId}
				{expandedFolders}
				on:toggle={(e) => toggleFolder(e.detail)}
				on:select={(e) => onSelectFolder(e.detail)} />
		{/each}
	</div>

	<!-- New Folder Button -->
	<button
		on:click={onNewFolder}
		class="flex items-center gap-2 px-4 py-3 border-t border-base-300 hover:bg-base-300 transition-colors">
		<IconFolderPlus size={20} class="text-primary" />
		<span class="font-medium">New Folder</span>
	</button>
</aside>

<style>
	aside {
		min-width: 16rem;
		max-width: 20rem;
	}
</style>
