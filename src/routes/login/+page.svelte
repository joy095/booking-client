<script lang="ts">
	import { goto } from '$app/navigation';
	import { signIn } from '$lib/auth-client.js';
	let email = '';
	let password = '';
	let message = '';
	let loading = false;

	async function handleLogin() {
		loading = true;
		const resp = await signIn.email({ email, password });
		loading = false;

		if (resp.ok) {
			message = 'Welcome back!';
			setTimeout(() => goto('/dashboard'), 1000);
		} else {
			message = resp.error ?? 'Login failed';
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
	<div class="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
		<h2 class="mb-6 text-center text-2xl font-semibold text-gray-800">Login</h2>
		<form on:submit|preventDefault={handleLogin} class="space-y-4">
			<input
				type="email"
				bind:value={email}
				placeholder="Email"
				required
				class="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
			/>
			<input
				type="password"
				bind:value={password}
				placeholder="Password"
				required
				class="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
			/>
			<button
				type="submit"
				class="w-full rounded-lg bg-blue-600 py-2.5 text-white transition hover:bg-blue-700 disabled:bg-blue-300"
				disabled={loading}
			>
				{loading ? 'Signing in...' : 'Sign In'}
			</button>
		</form>

		<p class="mt-4 text-center text-sm text-gray-600">
			Don't have an account?
			<a href="/signup" class="font-medium text-blue-600 hover:underline">Sign up</a>
		</p>

		<p class="mt-3 text-center text-sm text-red-500">{message}</p>
	</div>
</div>
