<script lang="ts">
import { page } from '$app/stores';
</script>

<div class="w-full">
	<h1 class="text-2xl font-bold">About</h1>

	<div class="mb-14 flex w-full flex-wrap">
		<div class="mt-4 flex max-w-fit flex-none flex-col gap-2 indent-8 md:max-w-xl">
			<div role="alert" class="alert">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					class="h-6 w-6 shrink-0 stroke-info"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path
					></svg>
				<div class="flex flex-col">
					<span>
						Remember, Healer is a <strong>work-in-progress</strong> project.
					</span>
					<span>Some features are still evolving!</span>
				</div>
			</div>
			<div class="mb-6 mt-8 flex items-center justify-center">
				<div class="text-9xl">🔮⚕️</div>
			</div>
			<p>
				<strong class="font-serif text-3xl"><em>Healer</em></strong> 🔮⚕️
			</p>
			<p>
				An intelligent bookmark manager powered by AI, designed to heal your information overload.
			</p>
			<p>
				<strong>Organize effortlessly.</strong> Healer helps you store, categorize, and rediscover your bookmarks with AI-powered insights.
			</p>
			<p>
				Automatically extract content, generate summaries, and suggest tags—all while keeping your data under your control.
			</p>
			<p>
				Stop drowning in links. Let Healer restore order to your digital life. 📚✨
			</p>
			<div class="mt-6 rounded-lg bg-base-200 p-4">
				<p class="text-sm text-base-content/70">
					<strong>Note:</strong> Healer is a fork of
					<a href="https://github.com/goniszewski/grimoire" class="link">Grimoire</a>
					by Robert Goniszewski, licensed under MIT.
					We've added AI-powered features and architectural improvements while respecting the original project.
				</p>
			</div>
		</div>
		<div class="flex min-w-fit flex-1 flex-col">
			<div class="flex flex-col items-center justify-center">
				<h2 class="mb-4 mt-8 text-xl font-bold">Original Authors</h2>
				<div class="flex flex-col gap-1">
					<div class="flex max-w-[14rem] items-center">
						<div class="indicator">
							<span class="badge indicator-item badge-primary badge-sm indicator-middle"
								>original author</span>
							<a href="https://www.github.com/goniszewski" class="px-4 text-center hover:underline">
								Robert Goniszewski (@goniszewski)
							</a>
						</div>
					</div>
					{#if $page.data.contributors.length > 0}
						{#each $page.data.contributors as contributor}
							<div class="flex max-w-[14rem] items-center justify-center">
								<div
									class="tooltip"
									data-tip={`Thank you for ${contributor.contributions} contribution${contributor.contributions > 1 ? 's' : ''}!`}>
									<div class="indicator">
										<span class="badge indicator-item badge-accent badge-sm indicator-middle"
											>{contributor.contributions}</span>
										<a href={contributor.html_url} class="px-4 text-center hover:underline">
											{contributor.login}
										</a>
									</div>
								</div>
							</div>
						{/each}
						<div class="flex items-center justify-center">
							<div class="tooltip" data-tip="Thank you for your contribution!">
								<a
									href="https://github.com/goniszewski/grimoire/graphs/contributors"
									class="link pl-4 text-center">
									And others...
								</a>
							</div>
						</div>
					{/if}
				</div>
			</div>
			<div class="mt-8 flex flex-col items-center">
				<h2 class="mb-4 mt-8 text-xl font-bold">Built with amazing tools</h2>
				<p class="flex flex-col items-center gap-1">
					<a href="https://github.com/extractus/article-extractor" class="hover:underline">
						@extractus/article-extractor</a>
					<a href="https://github.com/oven-sh/bun" class="hover:underline">Bun</a>
					<a href="https://github.com/saadeghi/daisyui" class="hover:underline">DaisyUI</a>
					<a href="https://github.com/drizzle-team/drizzle-orm" class="hover:underline">Drizzle</a>
					<a href="https://github.com/krisk/fuse" class="hover:underline">Fuse.js</a>
					<a href="https://github.com/pilcrowOnPaper/lucia" class="hover:underline">Lucia</a>
					<a href="https://github.com/microlinkhq/metascraper" class="hover:underline"
						>MetaScraper</a>
					<a href="https://github.com/pocketbase/pocketbase" class="hover:underline">PocketBase</a>
					<a href="https://github.com/apostrophecms/sanitize-html" class="hover:underline"
						>sanitize-html</a>
					<a href="https://github.com/sveltejs/kit" class="hover:underline">SvelteKit</a>
					<a href="https://github.com/kbrgl/svelte-french-toast" class="hover:underline"
						>Svelte French Toast</a>
					<a href="https://github.com/rob-balfre/svelte-select" class="hover:underline"
						>Svelte Select</a>
					<a href="https://github.com/swagger-api/swagger-ui" class="hover:underline">Swagger UI</a>
					<a href="https://github.com/tabler/tabler-icons" class="hover:underline">Tabler Icons</a>
					<a href="https://tailwindcss.com" class="hover:underline">Tailwind CSS</a>
					<a href="https://github.com/laurengarcia/url-metadata" class="hover:underline"
						>url-metadata</a>
				</p>
			</div>
		</div>
	</div>
</div>
