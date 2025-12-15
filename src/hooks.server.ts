import { withClerkHandler } from 'svelte-clerk/server';
import type { Handle } from '@sveltejs/kit';

const e2eTest = process.env.E2E_TEST;
function createHandle(): Handle {
    if (e2eTest === 'true') {
        return (async ({ event, resolve }) => {
            return await resolve(event);
        });
    }
    return withClerkHandler({
        debug: false,
    });
}
export const handle: Handle = createHandle();
