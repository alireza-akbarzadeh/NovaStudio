/**
 * Copy Monaco AMD assets into /public so the editor loads same-origin.
 * Project routes use COEP (credentialless) for WebContainers — the default
 * jsDelivr CDN is blocked there and leaves a stuck "Loading editor…" screen.
 */
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "monaco-editor", "min", "vs");
const dest = join(root, "public", "monaco", "vs");

if (!existsSync(src)) {
  console.warn("[copy-monaco] monaco-editor missing — skip");
  process.exit(0);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(dirname(dest), { recursive: true });
cpSync(src, dest, { recursive: true });
console.log("[copy-monaco] public/monaco/vs ready");
