<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { page } from '$app/stores';
	import { defaultUserSettings } from '$lib/config';
	import { checkAIHealth } from '$lib/integrations/ai';
	import type { UserSettings } from '$lib/types/UserSettings.type';
	import { showToast } from '$lib/utils/show-toast';
	import { themeChange } from '$lib/utils/theme-change';
	import { IconPlug, IconPlugConnected } from '@tabler/icons-svelte';
	import { writable } from 'svelte/store';

	const userSettingsStore = writable<UserSettings>({
		...defaultUserSettings,
		...$page.data.user?.settings
	});

	// Sync legacy llm.enabled to ai.enabled for backward compatibility
	if ($userSettingsStore.llm?.enabled && !$userSettingsStore.ai) {
		$userSettingsStore.ai = { enabled: $userSettingsStore.llm.enabled };
	}

	const aiHealthStatus = writable<{ checked: boolean; healthy: boolean }>({
		checked: false,
		healthy: false
	});

	function resetToDefaults() {
		userSettingsStore.set(defaultUserSettings);
		showToast.success('Settings reset to defaults. Remember to save!', {
			duration: 3000
		});
	}

	async function onTestAIConnection() {
		try {
			const isHealthy = await checkAIHealth();
			aiHealthStatus.set({ checked: true, healthy: isHealthy });
			if (isHealthy) {
				showToast.success('AI service connection successful!');
			} else {
				showToast.error('AI service is not responding. Check your configuration.');
			}
		} catch (error) {
			aiHealthStatus.set({ checked: true, healthy: false });
			showToast.error('Failed to connect to AI service.');
			console.error('[AI] Health check failed:', error);
		}
	}

	let form: HTMLFormElement;
</script>

<div class="flex w-full flex-col gap-8">
	<h1 class="text-2xl font-bold">User settings</h1>
	{#if !$page.data.user || $page.data.user.disabled}
		<p>Not logged in.</p>
	{:else}
		<form
			bind:this={form}
			class="flex w-full flex-col gap-8"
			method="POST"
			action="?/updateUserSettings"
			use:enhance={() => {
				return async ({ update, result }) => {
					if (result.type === 'success' && result?.data?.updatedSettings) {
						console.log('result.data.updatedSettings', result.data.updatedSettings);
						// @ts-ignore-next-line
						userSettingsStore.set(result.data.updatedSettings);
						// @ts-ignore-next-line
						themeChange(result.data.updatedSettings.theme);
						showToast.success('Settings updated!');
						await invalidate('/');
					}
					update();
				};
			}}
		>
			<div class="flex flex-col gap-4">
				<h2 class="text-xl font-bold">UI</h2>
				<div class="flex gap-2 rounded-md border p-4">
					<table class="table table-xs max-w-[25rem]">
						<tr>
							<td><span class="label-text min-w-[8rem]">Theme (save to keep)</span></td>
							<td>
								<select
									name="theme"
									class="select select-bordered w-full max-w-xs"
									bind:value={$userSettingsStore.theme}
								>
									<option value="light">Light</option>
									<option value="dark">Dark</option>
								</select>
							</td></tr
						>
						<tr>
							<td><span class="label-text min-w-[8rem]">Animations</span></td>
							<td
								><input
									type="checkbox"
									name="uiAnimations"
									class="checkbox-accent checkbox"
									checked={$userSettingsStore.uiAnimations}
									on:change={(e) => {
										// @ts-ignore
										$userSettingsStore.uiAnimations = e.target.checked;
									}}
								/></td
							>
						</tr>
					</table>
				</div>
			</div>

			<div class="flex flex-col gap-4">
				<h2 class="text-xl font-bold">AI Features</h2>
				<div class="flex flex-col gap-4 rounded-md border p-4">
					<div class="flex items-center gap-4">
						<input
							type="checkbox"
							name="aiEnabled"
							class="checkbox-accent checkbox"
							checked={$userSettingsStore.ai?.enabled}
							on:change={(e) => {
								if (!$userSettingsStore.ai) {
									$userSettingsStore.ai = { enabled: false };
								}
								// @ts-ignore
								$userSettingsStore.ai.enabled = e.target.checked;
							}}
						/>
						<div class="flex flex-1 flex-col">
							<span class="label-text font-semibold">Enable AI-powered features</span>
							<span class="text-xs text-base-content/60">
								Auto-generate tags, summaries, and more using AI
							</span>
						</div>
						<button
							class={`btn btn-sm ${$aiHealthStatus.healthy ? 'btn-success' : $aiHealthStatus.checked ? 'btn-error' : 'btn-warning'}`}
							on:click={(el) => {
								onTestAIConnection();
								el.preventDefault();
							}}
							>Test Connection
							{#if $aiHealthStatus.checked}
								{#if $aiHealthStatus.healthy}
									<IconPlugConnected class="h-4 w-4" />
								{:else}
									<IconPlug class="h-4 w-4" />
								{/if}
							{:else}
								<IconPlug class="h-4 w-4" />
							{/if}
						</button>
					</div>

					<div class="divider my-0"></div>

					<div class="flex flex-col gap-2">
						<p class="text-sm text-base-content/70">
							<strong>AI Service Configuration:</strong> AI features are powered by a separate AI service.
							Configuration is managed via environment variables on the server:
						</p>
						<ul class="list-inside list-disc space-y-1 text-xs text-base-content/60">
							<li><code class="rounded bg-base-200 px-1">HEALER_AI_BASE_URL</code> - AI service endpoint</li>
							<li><code class="rounded bg-base-200 px-1">HEALER_AI_API_KEY</code> - Authentication key (if required)</li>
							<li><code class="rounded bg-base-200 px-1">HEALER_AI_USE_MOCK</code> - Use mock responses for testing</li>
						</ul>
						<p class="text-xs text-base-content/60">
							Contact your administrator to configure these settings.
						</p>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-4">
				<button class="btn btn-secondary" on:click|preventDefault={() => resetToDefaults()}>
					Reset to Defaults
				</button><button class="btn btn-primary"> Save </button>
			</div>
		</form>
	{/if}
</div>
