#!/usr/bin/env node
/**
 * Comprehensive speed benchmark for the dev server.
 * Hits each route cold then warm and reports timings.
 *
 * Usage: node scripts/speed-test.js [host]
 *   default host: http://localhost:3000
 */

const BASE = process.argv[2] || "http://localhost:3000";

// Real IDs fetched from DB
const GUILD_ID = "cmm2ufi460001lw15io7a1m6l";
const EVENT_ID = "69578815-d577-44d8-87a2-a96b72e6062c";

const ROUTES = [
  "/",
  "/api/auth/session",
  "/account",
  "/admin",
  "/admin/organizations",
  `/admin/events/${EVENT_ID}`,
  `/v1/${GUILD_ID}`,
  `/v1/${GUILD_ID}/events`,
  `/v1/${GUILD_ID}/sales`,
  `/v1/${GUILD_ID}/employees`,
];

async function waitReady(timeoutMs = 180000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(BASE + "/api/auth/session", {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok || res.status === 401) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Next not responding at ${BASE} after ${timeoutMs / 1000}s`);
}

async function hit(route) {
  const t0 = Date.now();
  try {
    const res = await fetch(BASE + route, {
      redirect: "manual",
      signal: AbortSignal.timeout(300000),
    });
    return { ok: true, status: res.status, ms: Date.now() - t0 };
  } catch (e) {
    return { ok: false, status: 0, ms: Date.now() - t0, err: e.message };
  }
}

function fmt(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

(async () => {
  console.log(`[speed-test] waiting for ${BASE}...`);
  await waitReady();
  console.log(`[speed-test] server ready, starting benchmark\n`);

  // COLD pass
  console.log("=== COLD PASS (first hit triggers compile) ===");
  const cold = {};
  for (const r of ROUTES) {
    const res = await hit(r);
    cold[r] = res;
    const tag = res.ok ? `${res.status}` : `ERR:${res.err}`;
    console.log(`  ${tag.padEnd(15)} ${fmt(res.ms).padStart(8)}  ${r}`);
  }

  // Brief pause to let any background work settle
  await new Promise((r) => setTimeout(r, 1000));

  // WARM pass
  console.log("\n=== WARM PASS (cached compile, real runtime cost) ===");
  const warm = {};
  for (const r of ROUTES) {
    const res = await hit(r);
    warm[r] = res;
    const tag = res.ok ? `${res.status}` : `ERR:${res.err}`;
    console.log(`  ${tag.padEnd(15)} ${fmt(res.ms).padStart(8)}  ${r}`);
  }

  // WARM 2nd pass to confirm steady state
  console.log("\n=== WARM PASS 2 (steady-state) ===");
  const warm2 = {};
  for (const r of ROUTES) {
    const res = await hit(r);
    warm2[r] = res;
    const tag = res.ok ? `${res.status}` : `ERR:${res.err}`;
    console.log(`  ${tag.padEnd(15)} ${fmt(res.ms).padStart(8)}  ${r}`);
  }

  // Summary table
  console.log("\n=== SUMMARY ===");
  console.log(
    "Route".padEnd(48) +
      "Cold".padStart(10) +
      "Warm1".padStart(10) +
      "Warm2".padStart(10) +
      "  Speedup",
  );
  console.log("-".repeat(90));
  for (const r of ROUTES) {
    const c = cold[r].ms;
    const w1 = warm[r].ms;
    const w2 = warm2[r].ms;
    const speedup = w2 > 0 ? (c / w2).toFixed(1) + "x" : "—";
    console.log(
      r.padEnd(48) +
        fmt(c).padStart(10) +
        fmt(w1).padStart(10) +
        fmt(w2).padStart(10) +
        "  " +
        speedup,
    );
  }

  const totalCold = Object.values(cold).reduce((s, x) => s + x.ms, 0);
  const totalWarm = Object.values(warm2).reduce((s, x) => s + x.ms, 0);
  console.log("-".repeat(90));
  console.log(
    "TOTAL".padEnd(48) +
      fmt(totalCold).padStart(10) +
      "".padStart(10) +
      fmt(totalWarm).padStart(10) +
      "  " +
      (totalWarm > 0 ? (totalCold / totalWarm).toFixed(1) + "x" : "—"),
  );
})();
