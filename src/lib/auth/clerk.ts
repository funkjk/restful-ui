import type { RequestEvent } from '@sveltejs/kit';
import { buildClerkProps } from 'svelte-clerk/server';

/**
 * Get Clerk authentication props for the current request
 */
export async function getClerkProps(event: RequestEvent) {
    return await buildClerkProps(event);
}

/**
 * Check if the current user is authenticated
 */
export async function isAuthenticated(event: RequestEvent): Promise<boolean> {
    const { userId } = await buildClerkProps(event);
    return userId !== null;
}

