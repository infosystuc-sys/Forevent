#!/usr/bin/env node
/**
 * Full app web benchmark — every route group, cold + warm.
 *
 * Reports per-route status and timing. Status codes:
 *   200 = rendered OK
 *   3xx = redirect (auth wall) — still measures compile time
 *   401 = API unauthorized
 *   404 = not found
 *   5xx = server error (real bug)
 */

const BASE = process.argv[2] || "http://localhost:3000";

const G = "cmm2ufi460001lw15io7a1m6l"; // Punto Hogar
const E = "69578815-d577-44d8-87a2-a96b72e6062c"; // Cena empresarial
const COUNTER = "7de0aed4-1080-49ed-aef4-30f8245be46c";
const DEPOSIT = "4c08742c-f59c-4d2f-8724-5625992a4f03";
const PRODUCT = "c22cfd15-e716-4566-9fe7-a5c5351b7f55";
const TICKET = "350dc176-9b23-4314-82c6-0956006a87a6";
const UOG = "b2d45682-b111-4508-93a7-95d854c1e51d";
const DEAL_E = "5436d3db-9eb8-414f-ac1c-92a115953448";
const DEAL = "5e21f4d5-e65d-4c92-8458-404fb648b1ef";

const ROUTES = [
  // Public
  ["public", "/"],
  ["public", "/aboutus"],
  ["public", "/workwithus"],
  ["public", "/help"],
  ["public", "/help/answers"],
  ["public", "/help/questions"],
  ["public", "/unathorized"],
  // Auth
  ["auth", "/login"],
  ["auth", "/register"],
  ["auth", "/restore"],
  ["auth", "/newpassword"],
  // Account
  ["account", "/account/invites"],
  ["account", "/account/restorepassword"],
  ["account", "/account/verifyemail"],
  // Admin
  ["admin", "/admin"],
  ["admin", "/admin/organizations"],
  ["admin", "/admin/organizations/new"],
  ["admin", `/admin/organizations/${G}/edit`],
  ["admin", "/admin/events/new"],
  ["admin", `/admin/events/${E}`],
  ["admin", `/admin/events/${E}/edit`],
  // v1 root
  ["v1", "/v1"],
  ["v1", "/v1/welcome"],
  ["v1", "/v1/create"],
  // v1 guild
  ["v1-guild", `/v1/${G}`],
  ["v1-guild", `/v1/${G}/sales`],
  ["v1-guild", `/v1/${G}/employees`],
  ["v1-guild", `/v1/${G}/employees/create`],
  ["v1-guild", `/v1/${G}/cashier`],
  ["v1-guild", `/v1/${G}/cashier/${COUNTER}`],
  ["v1-guild", `/v1/${G}/cashier/${COUNTER}/create`],
  ["v1-guild", `/v1/${G}/settings`],
  ["v1-guild", `/v1/${G}/settings/invites`],
  // v1 events
  ["v1-events", `/v1/${G}/events`],
  ["v1-events", `/v1/${G}/events/create`],
  ["v1-events", `/v1/${G}/events/${E}`],
  ["v1-events", `/v1/${G}/events/${E}/edit`],
  ["v1-events", `/v1/${G}/events/${E}/posts`],
  ["v1-events", `/v1/${G}/events/${E}/sales`],
  ["v1-events", `/v1/${G}/events/${E}/products`],
  ["v1-events", `/v1/${G}/events/${E}/products/create`],
  ["v1-events", `/v1/${G}/events/${E}/sales/products/${PRODUCT}`],
  ["v1-events", `/v1/${G}/events/${E}/sales/tickets/${TICKET}`],
  ["v1-events", `/v1/${G}/events/${E}/deposits`],
  ["v1-events", `/v1/${G}/events/${E}/deposits/${DEPOSIT}`],
  ["v1-events", `/v1/${G}/events/${E}/deals`],
  ["v1-events", `/v1/${G}/events/${E}/deals/create`],
  ["v1-events", `/v1/${G}/events/${DEAL_E}/sales/deals/${DEAL}`],
  ["v1-events", `/v1/${G}/events/${E}/employees`],
  ["v1-events", `/v1/${G}/events/${E}/employees/create`],
  ["v1-events", `/v1/${G}/events/${E}/employees/${UOG}`],
  ["v1-events", `/v1/${G}/events/${E}/employees/${UOG}/modify`],
  ["v1-events", `/v1/${G}/events/${E}/users`],
  // Internal
  ["internal", "/internal"],
  ["internal", "/internal/newpassword"],
  ["internal", "/internal/register"],
  ["internal", "/internal/restore"],
  ["internal", "/internal/v1"],
  ["internal", "/internal/v1/events"],
  ["internal", `/internal/v1/events/${E}`],
  ["internal", "/internal/v1/guilds"],
  ["internal", `/internal/v1/guilds/${G}`],
  // API
  ["api", "/api/auth/session"],
];

async function waitReady(timeoutMs = 60000) {
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
  throw new Error(`Next not responding at ${BASE}`);
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

const fmt = (ms) => (ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`);
const pad = (s, n) => String(s).padEnd(n);
const padR = (s, n) => String(s).padStart(n);

(async () => {
  console.log(`[full-test] waiting for ${BASE}...`);
  await waitReady();
  console.log(`[full-test] running ${ROUTES.length} routes\n`);

  const cold = {};
  console.log("=== COLD PASS ===");
  for (const [group, r] of ROUTES) {
    const res = await hit(r);
    cold[r] = { ...res, group };
    const tag = res.ok ? String(res.status) : `ERR`;
    console.log(`  ${pad(group, 11)} ${pad(tag, 4)} ${padR(fmt(res.ms), 8)}  ${r}`);
  }

  await new Promise((r) => setTimeout(r, 1000));

  const warm = {};
  console.log("\n=== WARM PASS ===");
  for (const [group, r] of ROUTES) {
    const res = await hit(r);
    warm[r] = { ...res, group };
    const tag = res.ok ? String(res.status) : `ERR`;
    console.log(`  ${pad(group, 11)} ${pad(tag, 4)} ${padR(fmt(res.ms), 8)}  ${r}`);
  }

  // Aggregate by group
  console.log("\n=== AGGREGATE BY GROUP ===");
  console.log(
    pad("Group", 12) +
      padR("Routes", 7) +
      padR("Cold sum", 12) +
      padR("Warm sum", 12) +
      padR("Cold avg", 12) +
      padR("Warm avg", 12) +
      "  500s",
  );
  console.log("-".repeat(80));
  const groups = [...new Set(ROUTES.map(([g]) => g))];
  for (const g of groups) {
    const rs = ROUTES.filter(([gg]) => gg === g).map(([, r]) => r);
    const cs = rs.reduce((s, r) => s + cold[r].ms, 0);
    const ws = rs.reduce((s, r) => s + warm[r].ms, 0);
    const errs = rs.filter((r) => cold[r].status >= 500 || warm[r].status >= 500).length;
    console.log(
      pad(g, 12) +
        padR(rs.length, 7) +
        padR(fmt(cs), 12) +
        padR(fmt(ws), 12) +
        padR(fmt(Math.round(cs / rs.length)), 12) +
        padR(fmt(Math.round(ws / rs.length)), 12) +
        "  " +
        errs,
    );
  }
  const allCold = ROUTES.reduce((s, [, r]) => s + cold[r].ms, 0);
  const allWarm = ROUTES.reduce((s, [, r]) => s + warm[r].ms, 0);
  const errs500 = ROUTES.filter(
    ([, r]) => cold[r].status >= 500 || warm[r].status >= 500,
  );
  console.log("-".repeat(80));
  console.log(
    pad("TOTAL", 12) +
      padR(ROUTES.length, 7) +
      padR(fmt(allCold), 12) +
      padR(fmt(allWarm), 12) +
      padR(fmt(Math.round(allCold / ROUTES.length)), 12) +
      padR(fmt(Math.round(allWarm / ROUTES.length)), 12) +
      "  " +
      errs500.length,
  );

  // Anomalies
  const slowWarm = ROUTES.filter(([, r]) => warm[r].ms > 1000)
    .map(([, r]) => [r, warm[r].ms])
    .sort((a, b) => b[1] - a[1]);
  if (slowWarm.length) {
    console.log("\n=== SLOW WARM (>1s) ===");
    slowWarm.forEach(([r, ms]) => console.log(`  ${padR(fmt(ms), 8)}  ${r}`));
  }

  if (errs500.length) {
    console.log("\n=== 500 ERRORS ===");
    errs500.forEach(([, r]) =>
      console.log(`  cold=${cold[r].status} warm=${warm[r].status}  ${r}`),
    );
  }
})();
