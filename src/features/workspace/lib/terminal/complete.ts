import { GIT_SUBCOMMANDS, SHELL_COMMANDS } from "./commands";
import type { CommandHistory } from "./history";
import {
  getPackageScripts,
  isPackageManager,
  type PackageScriptFile,
} from "./package-scripts";

export type CompleteFile = {
  path: string;
  kind: "file" | "folder";
  content?: string;
};

export type CompleteContext = {
  cwd: string;
  files: CompleteFile[];
  history: CommandHistory;
  /** Optional override; otherwise derived from files + cwd */
  scripts?: string[];
};

export type Suggestion = {
  /** Full line after accepting the suggestion */
  line: string;
  /** Ghost suffix to show after the typed prefix (may be empty) */
  ghost: string;
};

function prefixMatch(candidates: readonly string[], token: string): string | null {
  const lower = token.toLowerCase();
  const matches = candidates.filter((c) => c.toLowerCase().startsWith(lower));
  if (matches.length === 0) return null;

  // Prefer exact case-insensitive match, else shortest unique prefix expansion
  const exact = matches.find((c) => c.toLowerCase() === lower);
  if (exact && matches.length === 1) return exact;

  return longestCommonPrefix(matches);
}

function longestCommonPrefix(values: string[]): string {
  if (values.length === 0) return "";
  let prefix = values[0];
  for (let i = 1; i < values.length; i++) {
    while (!values[i].toLowerCase().startsWith(prefix.toLowerCase())) {
      prefix = prefix.slice(0, -1);
      if (!prefix) return values[0];
    }
  }
  return prefix;
}

function firstPrefix(candidates: readonly string[], token: string): string | null {
  const lower = token.toLowerCase();
  return (
    candidates.find((c) => c.toLowerCase().startsWith(lower)) ?? null
  );
}

function normalizeCwd(cwd: string): string {
  return cwd === "/" ? "" : cwd.replace(/^\//, "").replace(/\/$/, "");
}

/** Entries directly under `dir` (project-relative, no leading slash). */
function listEntries(
  files: CompleteFile[],
  dir: string,
): Array<{ name: string; kind: "file" | "folder" }> {
  const prefix = dir ? `${dir}/` : "";
  const seen = new Map<string, "file" | "folder">();

  for (const file of files) {
    if (prefix && !file.path.startsWith(prefix) && file.path !== dir) {
      continue;
    }
    if (!prefix && file.path.includes("/")) {
      const top = file.path.split("/")[0];
      if (top) seen.set(top, "folder");
      continue;
    }

    const remainder = prefix ? file.path.slice(prefix.length) : file.path;
    if (!remainder) continue;

    const slash = remainder.indexOf("/");
    if (slash === -1) {
      seen.set(remainder, file.kind);
    } else {
      seen.set(remainder.slice(0, slash), "folder");
    }
  }

  return [...seen.entries()].map(([name, kind]) => ({ name, kind }));
}

function completePath(
  token: string,
  cwd: string,
  files: CompleteFile[],
): string | null {
  const baseDir = normalizeCwd(cwd);
  const hasSlash = token.includes("/");

  let dir: string;
  let namePrefix: string;

  if (token.startsWith("/")) {
    const trimmed = token.slice(1);
    if (trimmed.includes("/")) {
      const parts = trimmed.split("/");
      namePrefix = parts.pop() ?? "";
      dir = parts.join("/");
    } else {
      dir = "";
      namePrefix = trimmed;
    }
  } else if (hasSlash) {
    const parts = token.split("/");
    namePrefix = parts.pop() ?? "";
    const relative = parts.join("/");
    dir = baseDir ? `${baseDir}/${relative}` : relative;
  } else {
    dir = baseDir;
    namePrefix = token;
  }

  const entries = listEntries(files, dir);
  const matches = entries.filter((e) =>
    e.name.toLowerCase().startsWith(namePrefix.toLowerCase()),
  );
  if (matches.length === 0) return null;

  const best =
    matches.length === 1
      ? matches[0]
      : {
          name: longestCommonPrefix(matches.map((m) => m.name)),
          kind: "file" as const,
        };

  if (!best.name || best.name === namePrefix) {
    // Single exact match: append / for folders so Tab can continue
    if (matches.length === 1 && matches[0].kind === "folder") {
      const completed = rebuildPathToken(token, namePrefix, `${matches[0].name}/`);
      return completed === token ? null : completed;
    }
    return null;
  }

  const suffix =
    matches.length === 1 && matches[0].kind === "folder" ? "/" : "";
  return rebuildPathToken(token, namePrefix, `${best.name}${suffix}`);
}

function rebuildPathToken(
  original: string,
  namePrefix: string,
  replacement: string,
): string {
  if (!namePrefix) {
    if (original.endsWith("/")) return `${original}${replacement}`;
    if (original === "/" || original === "")
      return replacement.startsWith("/")
        ? replacement
        : original.startsWith("/")
          ? `/${replacement}`
          : replacement;
    return original + replacement;
  }
  return original.slice(0, original.length - namePrefix.length) + replacement;
}

function scriptsFor(ctx: CompleteContext): string[] {
  if (ctx.scripts) return ctx.scripts;
  return getPackageScripts(ctx.files as PackageScriptFile[], ctx.cwd);
}

function parseTokens(line: string): {
  parts: string[];
  token: string;
  endsWithSpace: boolean;
} {
  const endsWithSpace = /\s$/.test(line);
  const parts = line.trimEnd().split(/\s+/).filter(Boolean);
  const token = endsWithSpace ? "" : (parts[parts.length - 1] ?? "");
  return { parts, token, endsWithSpace };
}

/**
 * Complete npm/pnpm/yarn/bun script invocations.
 *   npm|pnpm|bun run <script>
 *   yarn [run] <script>
 */
function completePackageManager(
  parts: string[],
  endsWithSpace: boolean,
  token: string,
  scripts: string[],
): string | null {
  const command = parts[0] ?? "";
  if (!isPackageManager(command)) return null;

  // Finished tokens before the one being typed
  const finished = endsWithSpace ? parts : parts.slice(0, -1);
  const argIndex = finished.length; // 1 = first arg after binary

  if (argIndex === 1) {
    if (command === "yarn") {
      return prefixMatch(["run", ...scripts], token);
    }
    return prefixMatch(["run"], token);
  }

  // `npm run <script>` or `yarn run <script>`
  if (finished[1] === "run" && argIndex === 2) {
    return prefixMatch(scripts, token);
  }

  return null;
}

/**
 * Tab completion for the current token.
 * Returns a new full line, or null if nothing to complete.
 */
export function completeLine(
  line: string,
  ctx: CompleteContext,
): string | null {
  const { parts, token, endsWithSpace } = parseTokens(line);
  const command = parts[0] ?? "";
  const isFirst = parts.length <= 1 && !endsWithSpace;

  let completed: string | null = null;
  const scripts = scriptsFor(ctx);

  if (isFirst) {
    completed = prefixMatch(SHELL_COMMANDS, token);
  } else if (command === "git" && parts.length === 2 && !endsWithSpace) {
    completed = prefixMatch(GIT_SUBCOMMANDS, token);
  } else if (isPackageManager(command)) {
    completed = completePackageManager(parts, endsWithSpace, token, scripts);
  } else if (
    command === "cd" ||
    command === "ls" ||
    command === "cat" ||
    (command === "git" && parts[1] === "init")
  ) {
    completed = completePath(token, ctx.cwd, ctx.files);
  }

  if (!completed || completed === token) return null;

  if (endsWithSpace) {
    return `${line}${completed}`;
  }

  const before = line.slice(0, line.length - token.length);
  return `${before}${completed}`;
}

/**
 * Fish-style inline suggestion while typing.
 * Prefers history matches; falls back to script / command / path completion.
 */
export function suggestLine(
  line: string,
  ctx: CompleteContext,
): Suggestion | null {
  if (!line) return null;

  const fromHistory = ctx.history.suggest(line);
  if (fromHistory) {
    return { line: fromHistory, ghost: fromHistory.slice(line.length) };
  }

  const packageSuggestion = suggestPackageManager(line, ctx);
  if (packageSuggestion) return packageSuggestion;

  const completed = completeLine(line, ctx);
  if (!completed || completed === line) return null;

  return { line: completed, ghost: completed.slice(line.length) };
}

function suggestPackageManager(
  line: string,
  ctx: CompleteContext,
): Suggestion | null {
  const { parts, endsWithSpace } = parseTokens(line);
  const command = parts[0] ?? "";
  if (!isPackageManager(command)) return null;

  const scripts = scriptsFor(ctx);
  if (scripts.length === 0) return null;

  const asSuggestion = (full: string): Suggestion | null => {
    if (full === line || !full.startsWith(line)) return null;
    return { line: full, ghost: full.slice(line.length) };
  };

  // `npm ` → `npm run <first-script>`
  if (parts.length === 1 && endsWithSpace) {
    const script = scripts[0]!;
    const full =
      command === "yarn" ? `yarn ${script}` : `${command} run ${script}`;
    return asSuggestion(full);
  }

  // `npm r` / `npm ru` → `npm run <script>`
  if (
    parts.length === 2 &&
    !endsWithSpace &&
    command !== "yarn" &&
    "run".startsWith(parts[1]!.toLowerCase())
  ) {
    return asSuggestion(`${command} run ${scripts[0]!}`);
  }

  // `npm run` → `npm run <script>`
  if (parts.length === 2 && parts[1] === "run" && !endsWithSpace) {
    return asSuggestion(`${command} run ${scripts[0]!}`);
  }

  // `npm run ` / `npm run st`
  if (parts[1] === "run") {
    const scriptToken = endsWithSpace
      ? ""
      : parts.length >= 3
        ? (parts[2] ?? "")
        : "";
    if (parts.length === 2 && endsWithSpace) {
      return asSuggestion(`${command} run ${scripts[0]!}`);
    }
    if (parts.length >= 3 || (parts.length === 2 && endsWithSpace)) {
      const match = firstPrefix(scripts, scriptToken);
      if (!match) return null;
      return asSuggestion(`${command} run ${match}`);
    }
  }

  // `yarn st` / `yarn ` shorthand
  if (command === "yarn") {
    if (parts.length === 1 && endsWithSpace) {
      return asSuggestion(`yarn ${scripts[0]!}`);
    }
    if (parts.length === 2 && parts[1] !== "run") {
      const token = endsWithSpace ? "" : (parts[1] ?? "");
      const match = firstPrefix(scripts, token);
      if (!match) return null;
      return asSuggestion(`yarn ${match}`);
    }
    if (parts.length === 2 && parts[1] === "run" && endsWithSpace) {
      return asSuggestion(`yarn run ${scripts[0]!}`);
    }
  }

  return null;
}
