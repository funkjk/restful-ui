import { withClerkHandler } from 'svelte-clerk/server';
import type { Handle } from '@sveltejs/kit';

const clerkHandle = withClerkHandler({
	debug: false,
});

function shouldSkipClerk(): boolean {
	return (
		process.env.E2E_TEST === 'true' || process.env.BUILD_STATIC === 'true'
	);
}

export const handle: Handle = async ({ event, resolve }) => {
	if (shouldSkipClerk()) {
		return resolve(event);
	}
	return clerkHandle({ event, resolve });
};
