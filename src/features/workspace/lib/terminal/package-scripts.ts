/**
 * Derive npm script names from the project's package.json.
 * Reads live file content so edits stay in sync with autocomplete.
 */

export type PackageScriptFile = {
  path: string;
  kind: "file" | "folder";
  content?: string;
};

const PACKAGE_MANAGERS = ["npm", "pnpm", "yarn", "bun"] as const;

/** Package managers + `npx` — all run inside WebContainer. */
const NODE_CLI_COMMANDS = ["npm", "pnpm", "yarn", "bun", "npx"] as const;

export type PackageManager = (typeof PACKAGE_MANAGERS)[number];
export type NodeCliCommand = (typeof NODE_CLI_COMMANDS)[number];

export { PACKAGE_MANAGERS, NODE_CLI_COMMANDS };

/** True when the token is a supported package manager binary. */
export function isPackageManager(command: string): command is PackageManager {
  return (PACKAGE_MANAGERS as readonly string[]).includes(command);
}

/** True when the token should spawn inside WebContainer (npm family + npx). */
export function isNodeCliCommand(command: string): command is NodeCliCommand {
  return (NODE_CLI_COMMANDS as readonly string[]).includes(command);
}

/**
 * Parse script names from package.json text.
 * Returns [] on missing/invalid JSON or when scripts is absent.
 */
export function parsePackageScripts(content: string): string[] {
  try {
    const parsed = JSON.parse(content) as unknown;
    if (!parsed || typeof parsed !== "object") return [];
    const scripts = (parsed as { scripts?: unknown }).scripts;
    if (!scripts || typeof scripts !== "object" || Array.isArray(scripts)) {
      return [];
    }
    return Object.keys(scripts as Record<string, unknown>).sort((a, b) =>
      a.localeCompare(b),
    );
  } catch {
    return [];
  }
}

/**
 * Resolve package.json nearest to `cwd`, walking up to the project root.
 * Falls back to root package.json when cwd has none.
 */
export function resolvePackageJson(
  files: PackageScriptFile[],
  cwd: string,
): PackageScriptFile | null {
  const byPath = new Map(
    files
      .filter((f) => f.kind === "file" && f.path.endsWith("package.json"))
      .map((f) => [f.path, f]),
  );

  if (byPath.size === 0) return null;

  const base = cwd === "/" ? "" : cwd.replace(/^\//, "").replace(/\/$/, "");
  const segments = base ? base.split("/") : [];

  for (let i = segments.length; i >= 0; i--) {
    const dir = segments.slice(0, i).join("/");
    const candidate = dir ? `${dir}/package.json` : "package.json";
    const file = byPath.get(candidate);
    if (file) return file;
  }

  return byPath.get("package.json") ?? [...byPath.values()][0] ?? null;
}

/** Script names for the package.json nearest to `cwd`. */
export function getPackageScripts(
  files: PackageScriptFile[],
  cwd: string,
): string[] {
  const pkg = resolvePackageJson(files, cwd);
  if (!pkg?.content) return [];
  return parsePackageScripts(pkg.content);
}
