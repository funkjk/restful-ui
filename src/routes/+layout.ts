export const prerender = "auto"
export const ssr = false;
export const trailingSlash = 'always';

// SSR is disabled, so ClerkProvider will be initialized on the client side
// Authentication checks are still performed on the server side in API endpoints