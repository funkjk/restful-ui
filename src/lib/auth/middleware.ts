import { error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Require authentication for a request
 * Throws 401 error if user is not authenticated
 * @returns The authenticated user's ID
 * 
 * Note: event.locals.auth is set by withClerkHandler in hooks.server.ts
 * auth may be a function that returns AuthObject, so we need to call it if it's a function
 */
export function requireAuth(event: RequestEvent): string {
    const auth = event.locals?.auth;
    if (!auth) {
        throw error(401, {
            message: 'Unauthorized: Authentication required',
        });
    }
    
    // auth may be a function that returns AuthObject
    const authObject = typeof auth === 'function' ? auth() : auth;
    const userId = authObject?.userId;
    
    if (!userId) {
        throw error(401, {
            message: 'Unauthorized: Authentication required',
        });
    }
    
    return userId;
}

/**
 * Get the current user ID if authenticated, or null if not
 * Does not throw an error for unauthenticated users
 * 
 * Note: event.locals.auth is set by withClerkHandler in hooks.server.ts
 * auth may be a function that returns AuthObject, so we need to call it if it's a function
 */
export function getUserId(event: RequestEvent): string | null {
    const auth = event.locals?.auth;
    if (!auth) {
        return null;
    }
    
    // auth may be a function that returns AuthObject
    const authObject = typeof auth === 'function' ? auth() : auth;
    return authObject?.userId ?? null;
}

