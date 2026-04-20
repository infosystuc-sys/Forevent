#!/usr/bin/env node
/**
 * Pre-compiles hot routes in the Next dev server so the first
 * human click doesn't pay the 2-minute webpack compile.
 *
 * Usage: node scripts/warmup-dev.js [host]
 *   default host: http://localhost:3000
 *
 * Run in a second terminal AFTER `pnpm dev` prints "Ready".
 */

const BASE = process.argv[2] || "http://localhost:3000";

const ROUTES = [
  "/",
  "/admin",
  "/admin/organizations",
  "/account",
  "/api/auth/session",
];

async function waitReady(timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(BASE + "/api/auth/session", { signal: AbortSignal.timeout(5000) });
      if (res.ok || res.status === 401) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Next not responding at ${BASE} after ${timeoutMs / 1000}s`);
}

async function hit(route) {
  const t0 = Date.now();
  try {
    const res = await fetch(BASE + route, { redirect: "manual", signal: AbortSignal.timeout(300000) });
    console.log(`[warmup] ${res.status} ${route} ${Date.now() - t0}ms`);
  } catch (e) {
    console.warn(`[warmup] FAIL ${route} ${Date.now() - t0}ms: ${e.message}`);
  }
}

(async () => {
  console.log(`[warmup] waiting for ${BASE}...`);
  await waitReady();
  console.log(`[warmup] compiling ${ROUTES.length} routes (this may take a few minutes first time)...`);
  for (const r of ROUTES) {
    await hit(r);
  }
  console.log(`[warmup] done.`);
})();
