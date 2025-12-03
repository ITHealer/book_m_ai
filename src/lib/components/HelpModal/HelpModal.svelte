<script lang="ts">
	import { IconX, IconBook } from '@tabler/icons-svelte';

	export let isOpen: boolean = false;
	export let onClose: () => void = () => {};

	const gettingStartedCards = [
		{
			icon: '🔖',
			title: 'Save Pages',
			description: 'Save any webpage with Ctrl+Shift+S or use the browser extension'
		},
		{
			icon: '🤖',
			title: 'Auto Processing',
			description: 'AI automatically generates summaries, tags, and snapshots'
		},
		{
			icon: '🔍',
			title: 'Semantic Search',
			description: 'Find bookmarks by meaning, not just keywords - AI understands context'
		},
		{
			icon: '📁',
			title: 'Organize',
			description: 'Create folders, add tags, and categorize your bookmarks efficiently'
		},
		{
			icon: '🏥',
			title: 'Health Check',
			description: 'Monitor bookmark status and restore from snapshots if links die'
		},
		{
			icon: '🔄',
			title: 'Smart Deduplication',
			description: 'Detect and merge duplicate bookmarks automatically'
		}
	];

	const keyboardShortcuts = [
		{ keys: ['Ctrl', 'Shift', 'S'], description: 'Save current page' },
		{ keys: ['Ctrl', 'Shift', 'B'], description: 'Open bookmark manager' },
		{ keys: ['Ctrl', 'K'], description: 'Focus search' },
		{ keys: ['↑', '↓'], description: 'Navigate bookmarks' },
		{ keys: ['Enter'], description: 'Open selected bookmark' },
		{ keys: ['ESC'], description: 'Close panel/modal' }
	];

	const snapshotLevels = [
		{
			level: 'L1',
			name: 'Text Only',
			description: 'Lightweight snapshot (~10KB) - Just text and summary for quick reference',
			icon: '📄'
		},
		{
			level: 'L2',
			name: 'Text + Images',
			description: 'Balanced snapshot (~100KB) - Text content with key images preserved',
			icon: '🖼️'
		},
		{
			level: 'L3',
			name: 'Full Archive',
			description: 'Complete page (~1MB) - Full DOM archive like Wayback Machine',
			icon: '💾'
		}
	];
</script>

{#if isOpen}
	<!-- Modal -->
	<div class="modal modal-open">
		<div class="modal-box max-w-4xl h-5/6 flex flex-col p-0">
			<!-- Header -->
			<div class="sticky top-0 bg-primary text-primary-content px-6 py-4 flex items-center justify-between z-10 shadow-sm">
				<div class="flex items-center gap-3">
					<IconBook size={24} />
					<h3 class="font-bold text-xl">User Guide - Smart Bookmarks</h3>
				</div>
				<button on:click={onClose} class="btn btn-ghost btn-sm btn-circle">
					<IconX size={20} />
				</button>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto p-6 space-y-8">
				<!-- Getting Started -->
				<section>
					<h4 class="text-lg font-bold mb-4 flex items-center gap-2">
						<span class="text-xl">🚀</span>
						Getting Started
					</h4>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						{#each gettingStartedCards as card}
							<div class="card bg-base-200 shadow-sm">
								<div class="card-body p-4">
									<div class="flex items-start gap-3">
										<span class="text-3xl">{card.icon}</span>
										<div>
											<h5 class="font-bold mb-1">{card.title}</h5>
											<p class="text-sm opacity-80">{card.description}</p>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</section>

				<!-- Keyboard Shortcuts -->
				<section>
					<h4 class="text-lg font-bold mb-4 flex items-center gap-2">
						<span class="text-xl">⌨️</span>
						Keyboard Shortcuts
					</h4>
					<div class="space-y-2">
						{#each keyboardShortcuts as shortcut}
							<div class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
								<span class="text-sm">{shortcut.description}</span>
								<div class="flex gap-1">
									{#each shortcut.keys as key}
										<kbd class="kbd kbd-sm">{key}</kbd>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				</section>

				<!-- Snapshot Levels -->
				<section>
					<h4 class="text-lg font-bold mb-4 flex items-center gap-2">
						<span class="text-xl">📸</span>
						Snapshot Levels
					</h4>
					<div class="space-y-3">
						{#each snapshotLevels as level}
							<div class="card bg-base-200 shadow-sm">
								<div class="card-body p-4">
									<div class="flex items-start gap-3">
										<span class="text-3xl">{level.icon}</span>
										<div class="flex-1">
											<div class="flex items-center gap-2 mb-1">
												<span class="badge badge-primary font-mono font-bold">{level.level}</span>
												<h5 class="font-bold">{level.name}</h5>
											</div>
											<p class="text-sm opacity-80">{level.description}</p>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</section>

				<!-- AI Features -->
				<section>
					<h4 class="text-lg font-bold mb-4 flex items-center gap-2">
						<span class="text-xl">🤖</span>
						AI Features
					</h4>
					<div class="prose prose-sm max-w-none">
						<ul class="space-y-2">
							<li>
								<strong>Auto-Summary:</strong> AI generates concise summaries of webpage content automatically
							</li>
							<li>
								<strong>Auto-Tagging:</strong> Relevant tags are suggested and created based on content analysis
							</li>
							<li>
								<strong>Semantic Search:</strong> Search by meaning - find "frontend framework" and get React, Vue, Angular results
							</li>
							<li>
								<strong>Smart Deduplication:</strong> AI detects similar content even across different URLs
							</li>
						</ul>
					</div>
				</section>

				<!-- Tips & Tricks -->
				<section>
					<h4 class="text-lg font-bold mb-4 flex items-center gap-2">
						<span class="text-xl">💡</span>
						Tips & Tricks
					</h4>
					<div class="alert alert-info shadow-sm">
						<div class="text-sm space-y-2">
							<p>• Use <strong>Semantic Search</strong> for better results - type "AI tools" to find GPT-4, ChatGPT, machine learning resources</p>
							<p>• Run <strong>Health Check</strong> periodically to detect dead links before you need them</p>
							<p>• Use <strong>L2 snapshots</strong> for important pages - good balance of size and completeness</p>
							<p>• Organize with <strong>nested folders</strong> - create hierarchies like "Work → Projects → Client A"</p>
						</div>
					</div>
				</section>
			</div>

			<!-- Footer -->
			<div class="sticky bottom-0 bg-base-200 px-6 py-4 border-t border-base-300 flex items-center justify-between">
				<div class="text-sm opacity-70">
					Smart Bookmarks v1.0 - Powered by AI
				</div>
				<button on:click={onClose} class="btn btn-primary btn-sm">
					Got it!
				</button>
			</div>
		</div>
	</div>
{/if}
