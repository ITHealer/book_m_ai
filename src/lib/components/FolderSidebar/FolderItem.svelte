<script lang="ts">
	import { IconChevronDown, IconChevronRight } from '@tabler/icons-svelte';
	import { createEventDispatcher } from 'svelte';
	import type { Category } from '$lib/types/Category.type';

	export let folder: Category & { children?: Category[] };
	export let level: number = 0;
	export let selectedCategoryId: number | null = null;
	export let expandedFolders: Set<number> = new Set();

	const dispatch = createEventDispatcher<{
		toggle: number;
		select: number;
	}>();

	$: hasChildren = folder.children && folder.children.length > 0;
	$: isExpanded = expandedFolders.has(folder.id);
	$: isSelected = selectedCategoryId === folder.id;
</script>

<div>
	<button
		on:click={() => dispatch('select', folder.id)}
		style="padding-left: {level * 16 + 16}px"
		class={`flex items-center gap-2 py-2 pr-4 w-full text-left hover:bg-base-300 transition-colors ${
			isSelected ? 'bg-primary text-primary-content font-medium' : ''
		}`}>
		{#if hasChildren}
			<button
				on:click|stopPropagation={() => dispatch('toggle', folder.id)}
				class="btn btn-ghost btn-xs p-0 min-h-0 h-auto">
				{#if isExpanded}
					<IconChevronDown size={16} />
				{:else}
					<IconChevronRight size={16} />
				{/if}
			</button>
		{:else}
			<span class="w-4"></span>
		{/if}
		<span class="text-lg">{folder.icon || '📁'}</span>
		<span class="flex-1 truncate text-sm">{folder.name}</span>
		{#if folder.bookmarksCount !== undefined}
			<span class="badge badge-sm badge-ghost">{folder.bookmarksCount}</span>
		{/if}
	</button>

	{#if hasChildren && isExpanded}
		{#each folder.children || [] as child}
			<svelte:self
				folder={child}
				level={level + 1}
				{selectedCategoryId}
				{expandedFolders}
				on:toggle
				on:select />
		{/each}
	{/if}
</div>
