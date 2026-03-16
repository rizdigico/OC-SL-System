/**
 * test_remote_redis.js
 * Tests direct Redis connectivity from your local machine to the remote URL.
 * Reads REDIS_URL from frontend/.env.local via dotenv.
 *
 * Usage: node test_remote_redis.js
 */

const path   = require("path");
// dotenv lives in frontend/node_modules — resolve from there
require(path.join(__dirname, "frontend", "node_modules", "dotenv")).config({
    path: path.join(__dirname, "frontend", ".env.local"),
});
// redis lives in frontend/node_modules too
const { createClient } = require(path.join(__dirname, "frontend", "node_modules", "redis"));


async function run() {
    const url = process.env.REDIS_URL;

    console.log("──────────────────────────────────────────────────────");
    console.log("[1] REDIS_URL:", url ?? "(not set — check .env.local)");

    if (!url) {
        console.log("\n❌ REDIS_URL is not set in frontend/.env.local");
        console.log("   Uncomment and fill in the REDIS_URL line, then re-run.");
        return;
    }

    // Detect protocol
    const isTLS = url.startsWith("rediss://");
    console.log(`[2] Protocol : ${isTLS ? "rediss:// (TLS)" : "redis:// (plain TCP)"}`);

    // Build client — force TLS options for rediss:// so Vercel/Upstash works
    const client = createClient({
        url,
        socket: isTLS ? { tls: true, rejectUnauthorized: false } : undefined,
    });

    client.on("error", err => console.error("[CLIENT ERROR]", err.message));

    // ── Step 1: connect ───────────────────────────────────────────────────────
    console.log("\n[3] Connecting...");
    const t0 = Date.now();
    try {
        await client.connect();
        console.log(`[3] ✅ Connected in ${Date.now() - t0}ms`);
    } catch (err) {
        console.log(`[3] ❌ Connection failed: ${err.message}`);
        console.log("   DIAGNOSIS: TCP/TLS handshake is broken.");
        console.log("   → If using Upstash, ensure URL starts with rediss://");
        console.log("   → Check Vercel env var spelling: must be REDIS_URL");
        return;
    }

    // ── Step 2: PING ──────────────────────────────────────────────────────────
    console.log("\n[4] Sending PING...");
    try {
        const pong = await client.ping();
        console.log(`[4] ✅ PING → ${pong}`);
    } catch (err) {
        console.log(`[4] ❌ PING failed: ${err.message}`);
        await client.disconnect();
        return;
    }

    // ── Step 3: Write ─────────────────────────────────────────────────────────
    console.log("\n[5] Writing test value to hash...");
    try {
        await client.hSet("shadow_army_state", "__test__", JSON.stringify({ ok: true, ts: Date.now() }));
        console.log("[5] ✅ hSet succeeded");
    } catch (err) {
        console.log(`[5] ❌ hSet failed: ${err.message}`);
        await client.disconnect();
        return;
    }

    // ── Step 4: Read back ─────────────────────────────────────────────────────
    console.log("\n[6] Reading hash back...");
    try {
        const raw = await client.hGetAll("shadow_army_state");
        console.log("[6] ✅ hGetAll raw result:", JSON.stringify(raw, null, 2));

        // Show whether values are strings or already objects
        for (const [k, v] of Object.entries(raw)) {
            try {
                const parsed = JSON.parse(v);
                console.log(`    key "${k}" → parsed OK:`, typeof parsed);
            } catch {
                console.log(`    key "${k}" → ❌ JSON.parse FAILED. Raw:`, v);
            }
        }
    } catch (err) {
        console.log(`[6] ❌ hGetAll failed: ${err.message}`);
    }

    // ── Cleanup ───────────────────────────────────────────────────────────────
    await client.hDel("shadow_army_state", "__test__");
    await client.disconnect();

    console.log("\n──── VERDICT ─────────────────────────────────────────────");
    console.log("✅ Remote Redis is reachable and read/write works.");
    console.log("   If Vercel is still not updating the UI, the bug is:");
    console.log("   → The redis npm package not passing TLS options on Vercel.");
    console.log("   → SOLUTION: migrate to @upstash/redis (HTTP, not TCP).");
    console.log("     It is immune to Vercel's serverless TCP limitations.");
}

run().catch(err => {
    console.error("\n[FATAL]", err.message);
});
