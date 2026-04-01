// with-env.js — Load ../../.env if it exists, then exec the remaining args.
// On Vercel the .env file doesn't exist; env vars come from the dashboard.
// Locally, dotenv-cli would load ../../.env but it errors when the file is missing.
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const envPath = path.resolve(__dirname, "..", ".env");

if (fs.existsSync(envPath)) {
  // Read .env and inject into process.env (simple KEY=VALUE parser)
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = val;
    }
  }
}

const cmd = process.argv.slice(2).join(" ");
if (!cmd) {
  console.error("[with-env] No command specified");
  process.exit(1);
}

try {
  execSync(cmd, { stdio: "inherit", env: process.env });
} catch (e) {
  process.exit(e.status ?? 1);
}
