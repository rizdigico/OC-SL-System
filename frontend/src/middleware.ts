import { NextRequest, NextResponse } from "next/server";

/**
 * Edge Middleware — Basic Auth gate for the Sovereign Command Center.
 *
 * Rules:
 *  1. /api/webhooks/* — bypassed immediately (bots use their own Bearer token)
 *  2. Everything else  — requires valid Basic Auth credentials
 *
 * Set DASHBOARD_PASSWORD in .env.local (never commit this value).
 * Username is hardcoded to "admin".
 */

const REALM    = "Sovereign Command Center";
const USERNAME = "admin";

function unauthorized(): NextResponse {
    return new NextResponse("Access Denied", {
        status:  401,
        headers: {
            "WWW-Authenticate": `Basic realm="${REALM}"`,
        },
    });
}

export function middleware(req: NextRequest): NextResponse {
    // ── 1. Let webhook pings through — they carry their own Bearer token ───────
    if (req.nextUrl.pathname.startsWith("/api/webhooks")) {
        return NextResponse.next();
    }

    // ── 1b. /api/sovereign — also accept the Architect's Bearer token ─────────
    //    The route is still reachable via normal Basic Auth (browser sessions).
    //    This block only fires when a Bearer header is present so browser
    //    requests fall through to the Basic Auth check below as before.
    if (req.nextUrl.pathname.startsWith("/api/sovereign")) {
        const authHeader = req.headers.get("authorization") ?? "";
        if (authHeader.startsWith("Bearer ")) {
            const secret = process.env.OPENCLAW_SECRET
                        ?? process.env.SOVEREIGN_SECRET_KEY
                        ?? "SOVEREIGN_SECRET_KEY";
            if (authHeader === `Bearer ${secret}`) {
                return NextResponse.next();
            }
            // Bad Bearer token → reject immediately, don't fall into Basic Auth
            return unauthorized();
        }
        // No Bearer header → fall through to Basic Auth check (normal browser flow)
    }

    // ── 2. Basic Auth check for every other route ─────────────────────────────
    const authHeader = req.headers.get("authorization") ?? "";

    if (!authHeader.startsWith("Basic ")) {
        return unauthorized();
    }

    // Decode base64 credentials
    let decoded: string;
    try {
        decoded = atob(authHeader.slice("Basic ".length).trim());
    } catch {
        return unauthorized();
    }

    // credentials are "username:password" — split on first colon only
    const colonIdx = decoded.indexOf(":");
    if (colonIdx === -1) return unauthorized();

    const username = decoded.slice(0, colonIdx);
    const password = decoded.slice(colonIdx + 1);

    const validPassword = process.env.DASHBOARD_PASSWORD ?? "";

    // Reject if password env var is not set (fail-safe: never grant open access)
    if (!validPassword) {
        console.warn("[middleware] DASHBOARD_PASSWORD is not set — denying all access.");
        return unauthorized();
    }

    if (username !== USERNAME || password !== validPassword) {
        return unauthorized();
    }

    return NextResponse.next();
}

// ── Matcher ───────────────────────────────────────────────────────────────────
// Runs on all routes except Next.js internals and static assets.

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
