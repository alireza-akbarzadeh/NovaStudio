import { readFile } from "node:fs/promises";
import path from "node:path";

/** Serve TypeScript for the Monaco JSX highlight worker (same-origin importScripts). */
export async function GET() {
  const filePath = path.join(
    process.cwd(),
    "node_modules/typescript/lib/typescript.js",
  );
  const body = await readFile(filePath);

  return new Response(body, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
