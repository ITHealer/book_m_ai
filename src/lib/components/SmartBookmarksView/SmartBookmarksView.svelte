<script lang="ts">
	import { page } from '$app/stores';
	import { writable } from 'svelte/store';
	import {
		IconCalendarTime,
		IconLayoutGrid,
		IconBook,
		IconRefresh,
		IconHeartbeat
	} from '@tabler/icons-svelte';

	import FolderSidebar from '$lib/components/FolderSidebar/FolderSidebar.svelte';
	import TimelineView from '$lib/components/TimelineView/TimelineView.svelte';
	import DetailPanel from '$lib/components/DetailPanel/DetailPanel.svelte';
	import BookmarkList from '$lib/components/BookmarksList/BookmarkList.svelte';
	import DeduplicationModal from '$lib/components/DeduplicationModal/DeduplicationModal.svelte';
	import HelpModal from '$lib/components/HelpModal/HelpModal.svelte';
	import HealthCheckButton from '$lib/components/HealthCheckButton/HealthCheckButton.svelte';
	import AddBookmarkButton from '$lib/components/AddBookmarkButton/AddBookmarkButton.svelte';
	import { addCategoryStore } from '$lib/stores/add-category.store';

	import type { Bookmark } from '$lib/types/Bookmark.type';
	import type { Category } from '$lib/types/Category.type';

	export let bookmarks: Bookmark[] = [];
	export let categories: Category[] = [];

	// View states
	type ViewMode = 'card' | 'timeline';
	let viewMode: ViewMode = 'card';
	let selectedCategoryId: number | null = null;
	let selectedBookmark: Bookmark | null = null;
	let showDetailPanel = false;
	let showDeduplicationModal = false;
	let showHelpModal = false;
	let isHealthChecking = false;

	// Filtered bookmarks based on selected folder
	$: filteredBookmarks = selectedCategoryId
		? bookmarks.filter(b => b.categoryId === selectedCategoryId)
		: bookmarks;

	function handleFolderSelect(categoryId: number | null) {
		selectedCategoryId = categoryId;
		selectedBookmark = null;
		showDetailPanel = false;
	}

	function handleBookmarkClick(bookmark: Bookmark) {
		selectedBookmark = bookmark;
		showDetailPanel = true;
	}

	function handleCloseDetail() {
		showDetailPanel = false;
		selectedBookmark = null;
	}

	function handleNewFolder() {
		addCategoryStore.set({
			open: true,
			parentCategory: null
		});
	}

	function toggleViewMode() {
		viewMode = viewMode === 'card' ? 'timeline' : 'card';
	}

	// Keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		// ESC - Close panels/modals
		if (event.key === 'Escape') {
			if (showHelpModal) showHelpModal = false;
			else if (showDeduplicationModal) showDeduplicationModal = false;
			else if (showDetailPanel) handleCloseDetail();
		}

		// Ctrl+K - Focus search (handled by layout)
		// ? - Show help
		if (event.key === '?') {
			showHelpModal = true;
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="smart-bookmarks-view h-screen flex flex-col">
	<!-- Top Navigation Bar -->
	<header class="bg-base-100 border-b border-base-300 px-4 py-3 flex items-center gap-4 shadow-sm z-20">
		<h1 class="text-xl font-bold flex items-center gap-2">
			🔮 Smart Bookmarks
		</h1>

		<div class="flex-1"></div>

		<!-- Feature Buttons -->
		<div class="flex items-center gap-2">
			<!-- View Toggle -->
			<div class="tooltip tooltip-bottom" data-tip={viewMode === 'card' ? 'Switch to Timeline View' : 'Switch to Card View'}>
				<button
					on:click={toggleViewMode}
					class="btn btn-ghost btn-sm gap-2">
					{#if viewMode === 'card'}
						<IconCalendarTime size={18} />
						<span class="hidden sm:inline">Timeline View</span>
					{:else}
						<IconLayoutGrid size={18} />
						<span class="hidden sm:inline">Card View</span>
					{/if}
				</button>
			</div>

			<!-- Health Check -->
			<div class="tooltip tooltip-bottom" data-tip="Check bookmark health status">
				<HealthCheckButton bind:isChecking={isHealthChecking} />
			</div>

			<!-- Deduplication -->
			<div class="tooltip tooltip-bottom" data-tip="Find and merge duplicate bookmarks">
				<button
					on:click={() => showDeduplicationModal = true}
					class="btn btn-warning btn-sm gap-2">
					<span>🔄</span>
					<span class="hidden sm:inline">Deduplication</span>
				</button>
			</div>

			<!-- Help -->
			<div class="tooltip tooltip-bottom" data-tip="User guide and keyboard shortcuts">
				<button
					on:click={() => showHelpModal = true}
					class="btn btn-ghost btn-sm btn-circle">
					<IconBook size={18} />
				</button>
			</div>

			<!-- Add Bookmark -->
			<AddBookmarkButton />
		</div>
	</header>

	<!-- Main Content Area -->
	<div class="flex-1 flex overflow-hidden">
		<!-- Folder Sidebar -->
		<FolderSidebar
			{categories}
			{selectedCategoryId}
			onSelectFolder={handleFolderSelect}
			onNewFolder={handleNewFolder} />

		<!-- Bookmarks Content -->
		<main class="flex-1 overflow-y-auto bg-base-100">
			{#if filteredBookmarks.length === 0}
				<div class="flex items-center justify-center h-full text-center p-8">
					<div>
						<p class="text-lg font-medium mb-2">No bookmarks found</p>
						<p class="text-sm opacity-70 mb-4">
							{#if selectedCategoryId}
								This folder is empty. Start adding bookmarks!
							{:else}
								You haven't added any bookmarks yet.
							{/if}
						</p>
						<AddBookmarkButton />
					</div>
				</div>
			{:else if viewMode === 'timeline'}
				<TimelineView
					bookmarks={filteredBookmarks}
					onBookmarkClick={handleBookmarkClick} />
			{:else}
				<div class="p-4">
					<BookmarkList bookmarks={filteredBookmarks} />
				</div>
			{/if}
		</main>

		<!-- Detail Panel (conditionally shown) -->
		{#if showDetailPanel}
			<DetailPanel
				bookmark={selectedBookmark}
				onClose={handleCloseDetail} />
		{/if}
	</div>
</div>

<!-- Modals -->
<DeduplicationModal
	isOpen={showDeduplicationModal}
	onClose={() => showDeduplicationModal = false} />

<HelpModal
	isOpen={showHelpModal}
	onClose={() => showHelpModal = false} />

<style>
	.smart-bookmarks-view {
		background: var(--b1);
	}
</style>
