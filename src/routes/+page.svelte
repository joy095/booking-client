<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { signOut, useSession } from '$lib/auth-client.js';

	let user: { email: string } | null = null;
	let loading = true;

	onMount(async () => {
		const session = await useSession();
		user = session?.user ?? null;
		loading = false;
	});

	function handleLogout() {
		signOut();
		goto('/login');
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
	<div class="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-xl">
		<h1 class="text-3xl font-bold text-gray-800">Welcome to BetterAuth App</h1>
		<p class="mt-3 text-gray-600">
			A simple authentication setup using Hono + SvelteKit + TailwindCSS
		</p>

		{#if loading}
			<p class="mt-6 animate-pulse text-gray-500">Checking session...</p>
		{:else if user}
			<div class="mt-6">
				<p class="text-gray-700">
					Hello, <span class="font-semibold text-blue-600">{user.email}</span> 👋
				</p>
				<button
					on:click={handleLogout}
					class="mt-6 w-full rounded-lg bg-red-600 py-2.5 text-white transition hover:bg-red-700"
				>
					Logout
				</button>
			</div>
		{:else}
			<div class="mt-6 space-y-4">
				<a
					href="/login"
					class="block w-full rounded-lg bg-blue-600 py-2.5 text-white transition hover:bg-blue-700"
				>
					Login
				</a>
				<a
					href="/signup"
					class="block w-full rounded-lg border border-blue-600 py-2.5 text-blue-600 transition hover:bg-blue-50"
				>
					Sign Up
				</a>
			</div>
		{/if}

		<footer class="mt-10 text-sm text-gray-400">
			Made with 💙 using <span class="font-medium text-gray-500">SvelteKit + Hono</span>
		</footer>
	</div>
</div>
