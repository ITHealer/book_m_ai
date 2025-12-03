<script lang="ts">
	import { IconHeartbeat, IconRefresh } from '@tabler/icons-svelte';
	import { createEventDispatcher } from 'svelte';

	export let isChecking: boolean = false;

	const dispatch = createEventDispatcher<{
		check: void;
	}>();

	let stats = {
		total: 0,
		online: 0,
		offline: 0,
		error: 0
	};
	let showStats = false;

	async function handleCheck() {
		if (isChecking) return;

		dispatch('check');
		isChecking = true;
		showStats = false;

		try {
			const response = await fetch('/api/health-check', {
				method: 'POST'
			});

			const data = await response.json();

			if (data.success && data.summary) {
				stats = data.summary;
				showStats = true;

				// Hide stats after 5 seconds
				setTimeout(() => {
					showStats = false;
				}, 5000);
			}
		} catch (error) {
			console.error('Health check failed:', error);
		} finally {
			isChecking = false;
		}
	}
</script>

<div class="relative inline-block">
	<button
		on:click={handleCheck}
		disabled={isChecking}
		class="btn btn-primary gap-2"
		class:loading={isChecking}>
		{#if isChecking}
			<IconRefresh size={20} class="animate-spin" />
		{:else}
			<IconHeartbeat size={20} />
		{/if}
		<span class="hidden sm:inline">Health Check</span>
	</button>

	{#if showStats}
		<div class="absolute top-full mt-2 right-0 z-50 animate-fadeIn">
			<div class="card bg-base-100 shadow-xl border border-base-300 w-64">
				<div class="card-body p-4">
					<h4 class="font-bold text-sm mb-2 flex items-center gap-2">
						<IconHeartbeat size={16} />
						Health Check Results
					</h4>
					<div class="space-y-2 text-sm">
						<div class="flex justify-between">
							<span>Total Checked:</span>
							<span class="font-bold">{stats.total}</span>
						</div>
						<div class="flex justify-between">
							<span class="flex items-center gap-1">
								<span class="w-2 h-2 rounded-full bg-success"></span>
								Online:
							</span>
							<span class="font-bold text-success">{stats.online}</span>
						</div>
						<div class="flex justify-between">
							<span class="flex items-center gap-1">
								<span class="w-2 h-2 rounded-full bg-error"></span>
								Offline:
							</span>
							<span class="font-bold text-error">{stats.offline}</span>
						</div>
						<div class="flex justify-between">
							<span class="flex items-center gap-1">
								<span class="w-2 h-2 rounded-full bg-warning"></span>
								Error:
							</span>
							<span class="font-bold text-warning">{stats.error}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fadeIn {
		animation: fadeIn 0.2s ease-out;
	}
</style>
