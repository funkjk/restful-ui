import { withClerkHandler } from 'svelte-clerk/server';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = withClerkHandler({
    // Clerk middleware options
    // Environment variables will be automatically read from:
    // PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY
    debug: true, // Enable debug logging to troubleshoot authentication
});

