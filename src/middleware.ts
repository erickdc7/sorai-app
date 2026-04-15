import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware for protected routes.
 *
 * Since the Supabase JS client stores auth tokens in localStorage
 * (not cookies), Edge middleware cannot reliably validate sessions.
 * Instead, we check for the Supabase auth storage key cookie pattern.
 * If no auth indicator is found, we redirect to home.
 *
 * Data-level security is enforced by Supabase RLS policies,
 * and client-side pages verify the session via useAuth().
 */

const PROTECTED_PATHS = ["/my-list", "/settings"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isProtected = PROTECTED_PATHS.some((path) =>
        pathname.startsWith(path)
    );

    if (!isProtected) {
        return NextResponse.next();
    }

    // Check for any Supabase auth cookie (sb-*-auth-token or chunked variants)
    const hasAuthCookie = request.cookies
        .getAll()
        .some((cookie) => cookie.name.includes("auth-token"));

    // Also check for the sb-<ref>-auth-token in the request headers
    // Some Supabase configurations use localStorage, in which case
    // we allow the request through and let client-side handle the redirect
    if (!hasAuthCookie) {
        // Check if the referer suggests the user came from within the app
        // This allows client-side navigation while blocking direct URL access
        const referer = request.headers.get("referer");
        const origin = request.nextUrl.origin;

        if (referer && referer.startsWith(origin)) {
            // User is navigating within the app — let client-side auth handle it
            return NextResponse.next();
        }

        // Direct URL access without auth cookie — redirect to home
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/my-list/:path*", "/settings/:path*"],
};
