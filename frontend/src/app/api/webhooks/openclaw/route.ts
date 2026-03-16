// Force Next.js to never cache this route — live state must always be fresh
export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/openclaw
 *   Receive a status ping from a running OpenClaw agent.
 *   Headers: Authorization: Bearer <OPENCLAW_SECRET>
 *   Body:    { agentId, status, progress, currentTask }
 *
 * GET  /api/webhooks/openclaw
 *   Return the current snapshot of all known agents.
 *   Headers: Authorization: Bearer <OPENCLAW_SECRET>
 *
 * To test from cURL:
 *   curl -X POST http://localhost:3000/api/webhooks/openclaw \
 *     -H "Authorization: Bearer SOVEREIGN_SECRET_KEY" \
 *     -H "Content-Type: application/json" \
 *     -d '{"agentId":"beru","status":"EXECUTING","progress":42,"currentTask":"Scraping page 5/12"}'
 */

import { NextRequest, NextResponse } from "next/server";
import { upsertAgent, getState, AgentPayload } from "@/lib/agent-store";

// ── Auth ──────────────────────────────────────────────────────────────────────

/** Reads from OPENCLAW_SECRET env var; falls back to literal for local dev. */
const SECRET = process.env.OPENCLAW_SECRET ?? process.env.SOVEREIGN_SECRET_KEY ?? "SOVEREIGN_SECRET_KEY";

function authorized(req: NextRequest): boolean {
    const header = req.headers.get("authorization") ?? "";
    return header === `Bearer ${SECRET}`;
}

// ── POST — receive agent ping ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    if (!authorized(req)) {
        return NextResponse.json(
            { error: "Unauthorized — include: Authorization: Bearer <secret>" },
            { status: 401 },
        );
    }

    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Body must be valid JSON" }, { status: 400 });
    }

    const { agentId, status, progress, currentTask } = body;

    const VALID_STATUSES = ["IDLE", "EXECUTING", "FAILED", "COMPLETED"] as const;

    if (
        typeof agentId     !== "string" || !agentId.trim() ||
        typeof status      !== "string" || !(VALID_STATUSES as readonly string[]).includes(status) ||
        typeof progress    !== "number" || progress < 0 || progress > 100 ||
        typeof currentTask !== "string"
    ) {
        return NextResponse.json(
            {
                error:   "Invalid payload",
                schema: {
                    agentId:     "string (non-empty)",
                    status:      "IDLE | EXECUTING | FAILED | COMPLETED",
                    progress:    "number 0–100",
                    currentTask: "string",
                },
            },
            { status: 422 },
        );
    }

    const saved = upsertAgent({
        agentId:     agentId.trim(),
        status:      status as AgentPayload["status"],
        progress:    Math.round(progress),
        currentTask: currentTask.trim(),
    });

    return NextResponse.json({ ok: true, agent: saved }, { status: 200 });
}

// ── GET — return current snapshot ────────────────────────────────────────────

export async function GET(req: NextRequest) {
    if (!authorized(req)) {
        return NextResponse.json(
            { error: "Unauthorized — include: Authorization: Bearer <secret>" },
            { status: 401 },
        );
    }

    return NextResponse.json(getState(), {
        headers: {
            // Prevent CDN caching — always fresh
            "Cache-Control": "no-store, no-cache, must-revalidate",
        },
    });
}
