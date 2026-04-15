import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware to protect private routes at the server level.
 *
 * Checks for the existence of a Supabase auth session cookie before
 * allowing access to protected pages. If no session cookie is found,
 * the user is redirected to the home page.
 *
 * Note: This is a lightweight cookie-existence check, not a full token
 * validation. Supabase RLS still enforces data-level access control.
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

    // Supabase @supabase/ssr stores auth tokens in cookies with the pattern:
    // sb-<project-ref>-auth-token (may be chunked as .0, .1, etc.)
    const hasAuthCookie = request.cookies
        .getAll()
        .some((cookie) => cookie.name.includes("auth-token"));

    if (!hasAuthCookie) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/my-list/:path*", "/settings/:path*"],
};
