<script lang="ts">
	import { signUp } from '$lib/auth-client.js';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let email = '';
	let password = '';
	let confirmPassword = '';
	let message = '';
	let loading = false;

	async function handleSignup() {
		if (password !== confirmPassword) {
			message = "Passwords don't match";
			return;
		}
		loading = true;
		const resp = await signUp.email({ email, password });
		loading = false;

		if (resp.ok) {
			message = 'Account created successfully!';
			setTimeout(() => goto('/login'), 1000);
		} else {
			message = resp.error ?? 'Signup failed';
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
	<div class="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
		<h2 class="mb-6 text-center text-2xl font-semibold text-gray-800">Create Account</h2>
		<form on:submit|preventDefault={handleSignup} class="space-y-4">
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
			<input
				type="password"
				bind:value={confirmPassword}
				placeholder="Confirm Password"
				required
				class="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
			/>
			<button
				type="submit"
				class="w-full rounded-lg bg-blue-600 py-2.5 text-white transition hover:bg-blue-700 disabled:bg-blue-300"
				disabled={loading}
			>
				{loading ? 'Signing up...' : 'Sign Up'}
			</button>
		</form>

		<p class="mt-4 text-center text-sm text-gray-600">
			Already have an account?
			<a href="/login" class="font-medium text-blue-600 hover:underline">Log in</a>
		</p>

		<p class="mt-3 text-center text-sm text-red-500">{message}</p>
	</div>
</div>
