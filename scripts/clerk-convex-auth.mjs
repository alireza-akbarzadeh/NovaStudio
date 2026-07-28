#!/usr/bin/env node
/**
 * Keep Clerk ↔ Convex auth aligned.
 *
 * Convex only accepts JWTs whose `iss` matches CLERK_JWT_ISSUER_DOMAIN in the
 * Convex deployment env. If .env.local points at a different Clerk app than
 * Convex, you get:
 *   "No auth provider found matching the given token"
 *
 * Organizations (optional membership):
 *   The Clerk JWT template named `convex` must include active-org claims so
 *   Convex can scope projects by tenant:
 *     org_id:   {{org.id}}
 *     org_role: {{org.role}}
 *     org_slug: {{org.slug}}
 *   Without these, org switching will not refresh Convex access correctly.
 *   Verify with: clerk api /v1/jwt_templates  (look for name "convex")
 *
 * Usage:
 *   node scripts/clerk-convex-auth.mjs check
 *   node scripts/clerk-convex-auth.mjs sync   # copy local Clerk → Convex (default)
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const ENV_PATH = resolve(ROOT, ".env.local");

const mode = (process.argv[2] ?? "sync").toLowerCase();
if (mode !== "check" && mode !== "sync") {
  console.error(`Usage: node scripts/clerk-convex-auth.mjs [check|sync]`);
  process.exit(2);
}

function parseEnvFile(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // Strip unquoted inline comments: FOO=bar # note
    if (
      !value.startsWith('"') &&
      !value.startsWith("'") &&
      value.includes(" #")
    ) {
      value = value.slice(0, value.indexOf(" #")).trim();
    }
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value.trim();
  }
  return out;
}

function publishableKeyHost(pk) {
  if (!pk) return null;
  const raw = pk.split("_").slice(2).join("_");
  if (!raw) return null;
  try {
    return Buffer.from(raw, "base64")
      .toString("utf8")
      .replace(/\0+$/g, "")
      .replace(/\$$/, "");
  } catch {
    return null;
  }
}

function normalizeIssuer(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

function runNpx(args, { inherit = false } = {}) {
  const result = spawnSync("npx", args, {
    cwd: ROOT,
    env: process.env,
    encoding: "utf8",
    shell: true, // Windows: resolve npx.cmd
    stdio: inherit ? "inherit" : ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    const error = new Error(
      `npx ${args.join(" ")} failed (exit ${result.status ?? "null"})`,
    );
    error.stderr = result.stderr;
    error.stdout = result.stdout;
    throw error;
  }
  return (result.stdout ?? "").toString().trim();
}

function convexEnvGet(name) {
  try {
    return runNpx(["convex", "env", "get", name]);
  } catch (error) {
    const stderr = String(error?.stderr ?? "");
    if (/Environment variable .+ not found/i.test(stderr)) return null;
    throw error;
  }
}

function convexEnvSet(name, value) {
  runNpx(["convex", "env", "set", name, value], { inherit: true });
}

const local = parseEnvFile(ENV_PATH);

// Prefer .env.local over a stale/broken shell CONVEX_DEPLOYMENT.
if (local.CONVEX_DEPLOYMENT) {
  process.env.CONVEX_DEPLOYMENT = local.CONVEX_DEPLOYMENT;
}

const localIssuer = normalizeIssuer(local.CLERK_JWT_ISSUER_DOMAIN);
const localSecret = local.CLERK_SECRET_KEY?.trim() || null;
const pkHost = publishableKeyHost(local.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

if (!existsSync(ENV_PATH)) {
  console.error(`Missing ${ENV_PATH}. Create it before starting Convex.`);
  process.exit(1);
}

if (!localIssuer) {
  console.error(
    "CLERK_JWT_ISSUER_DOMAIN is missing or invalid in .env.local.\n" +
      "Set it to your Clerk Frontend API URL, e.g.\n" +
      "  CLERK_JWT_ISSUER_DOMAIN=https://your-app.clerk.accounts.dev",
  );
  process.exit(1);
}

if (!localSecret?.startsWith("sk_")) {
  console.error("CLERK_SECRET_KEY is missing or invalid in .env.local.");
  process.exit(1);
}

if (pkHost && pkHost !== new URL(localIssuer).host) {
  console.error(
    [
      "Clerk publishable key and CLERK_JWT_ISSUER_DOMAIN point at different apps:",
      `  publishable key host: ${pkHost}`,
      `  issuer host:          ${new URL(localIssuer).host}`,
      "Fix .env.local so both come from the same Clerk application.",
    ].join("\n"),
  );
  process.exit(1);
}

let convexIssuer;
let convexSecret;
try {
  convexIssuer = normalizeIssuer(convexEnvGet("CLERK_JWT_ISSUER_DOMAIN"));
  convexSecret = convexEnvGet("CLERK_SECRET_KEY")?.trim() || null;
} catch (error) {
  console.error(
    "Could not read Convex env. Is CONVEX_DEPLOYMENT set and are you logged in?\n" +
      String(error?.stderr ?? error?.message ?? error),
  );
  process.exit(1);
}

const issuerMatch = convexIssuer === localIssuer;
const secretMatch = convexSecret === localSecret;
const ok = issuerMatch && secretMatch;

console.log(
  [
    "Clerk ↔ Convex auth",
    `  local issuer:  ${localIssuer}`,
    `  convex issuer: ${convexIssuer ?? "(not set)"}`,
    `  secret:        ${secretMatch ? "match" : "MISMATCH"}`,
    `  status:        ${ok ? "OK" : "DRIFT"}`,
  ].join("\n"),
);

if (mode === "check") {
  if (!ok) {
    console.error(
      "\nFix with: npm run auth:sync\n" +
        "(or start the backend — it syncs automatically)",
    );
    process.exit(1);
  }
  process.exit(0);
}

let changed = false;
if (!issuerMatch) {
  console.log(`→ Setting Convex CLERK_JWT_ISSUER_DOMAIN → ${localIssuer}`);
  convexEnvSet("CLERK_JWT_ISSUER_DOMAIN", localIssuer);
  changed = true;
}
if (!secretMatch) {
  console.log("→ Setting Convex CLERK_SECRET_KEY from .env.local");
  convexEnvSet("CLERK_SECRET_KEY", localSecret);
  changed = true;
}

if (changed) {
  console.log("→ Pushing auth.config so Convex trusts the new issuer…");
  try {
    runNpx(["convex", "dev", "--once"], { inherit: true });
  } catch {
    console.error(
      "Env updated, but push failed. Run `npm run backend` to finish.",
    );
    process.exit(1);
  }
  console.log("Clerk ↔ Convex auth synced.");
} else {
  console.log("Already in sync — nothing to do.");
}
