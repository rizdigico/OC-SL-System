const BASE   = "http://localhost:3000/api/webhooks/openclaw";
const SECRET = "AarizScorpio18112009";
const HEADERS = {
    "Content-Type":  "application/json",
    "Authorization": `Bearer ${SECRET}`,
};

async function run() {
    // ── POST ──────────────────────────────────────────────────────────────────
    console.log("\n[1] Sending POST...");
    const postRes = await fetch(BASE, {
        method:  "POST",
        headers: HEADERS,
        body:    JSON.stringify({
            agentId:     "beru",
            status:      "EXECUTING",
            progress:    10,
            currentTask: "Beru test",
        }),
    });
    const postBody = await postRes.json();
    console.log(`[1] POST ${postRes.status}:`, JSON.stringify(postBody, null, 2));

    // ── WAIT ──────────────────────────────────────────────────────────────────
    console.log("\n[2] Waiting 2000ms...");
    await new Promise(r => setTimeout(r, 2000));

    // ── GET ───────────────────────────────────────────────────────────────────
    console.log("\n[3] Sending GET...");
    const getRes  = await fetch(`${BASE}?t=${Date.now()}`, { headers: HEADERS });
    const getBody = await getRes.json();
    console.log(`[3] GET ${getRes.status}:`, JSON.stringify(getBody, null, 2));

    // ── ANALYSIS ──────────────────────────────────────────────────────────────
    console.log("\n──── DIAGNOSIS ──────────────────────────────────────────────");

    if (postRes.status !== 200) {
        console.log("❌ POST failed — check Bearer secret or payload schema"); return;
    }
    if (getRes.status !== 200) {
        console.log("❌ GET failed — check Bearer secret"); return;
    }

    const keys = Object.keys(getBody);
    if (keys.length === 0) {
        console.log("❌ ROOT CAUSE: GET returned empty {} after a successful POST.");
        console.log("   REDIS_URL is not set — route fell back to the in-memory");
        console.log("   agent-store. On Vercel each serverless invocation gets its");
        console.log("   OWN process: POST writes to process A's memory, GET reads");
        console.log("   from process B's memory (empty). State is never shared.");
        console.log("\n   FIX: Set REDIS_URL in Vercel env vars AND in .env.local.");
        return;
    }

    const beru = getBody["beru"];
    if (!beru) {
        console.log("⚠️  GET returned data but no 'beru' key. Keys found:", keys); return;
    }
    if (typeof beru === "string") {
        console.log("❌ ROOT CAUSE: Redis value is a raw JSON string, not an object.");
        console.log("   hGetAll() returned stringified values. JSON.parse loop in");
        console.log("   redisGetAll() is not executing. Check route.ts hGetAll path.");
        return;
    }
    if (beru.status === "EXECUTING") {
        console.log("✅ Pipeline OK — beru.progress =", beru.progress);
        console.log("   Data is correct. If UI still shows mock data, the bug is");
        console.log("   in React: check browser console for [UI FETCH] and");
        console.log("   [UI RENDER] logs in ThroneRoom.");
    } else {
        console.log("⚠️  Unexpected beru shape:", JSON.stringify(beru));
    }
}

run().catch(err => {
    console.error("Fatal:", err.message);
    console.log("→ Is the dev server running?  cd frontend && npm run dev");
});
