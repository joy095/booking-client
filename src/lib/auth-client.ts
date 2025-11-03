import { createAuthClient } from 'better-auth/svelte';
import { PUBLIC_API_URL } from '$env/static/public';
import { emailOTPClient, phoneNumberClient } from 'better-auth/client/plugins';

export const client = createAuthClient({
	baseURL: PUBLIC_API_URL,
	plugins: [phoneNumberClient(), emailOTPClient()]
});

export const { signIn, signUp, signOut, useSession, verifyEmail } = client;
