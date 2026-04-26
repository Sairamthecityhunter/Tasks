/** Server: prefer importing from `auth-cookies` / `auth-core` in API routes to keep `next/headers` out of route bundles. */
export * from "./auth-core";
export { getSessionFromCookies, setSessionCookie, clearSessionCookie } from "./auth-cookies";
