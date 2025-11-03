<script lang="ts">
	import { signOut } from '$lib/auth-client.js';
	import { goto } from '$app/navigation';

	async function handleLogout() {
		await signOut();
		goto('/login');
	}
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-gray-50">
	<div class="rounded-xl bg-white p-8 shadow-md">
		<h2 class="mb-4 text-center text-2xl font-semibold text-gray-800">Logout</h2>
		<button
			on:click={handleLogout}
			class="w-full rounded-lg bg-red-600 py-2.5 text-white transition hover:bg-red-700"
		>
			Log out
		</button>
	</div>
</div>
