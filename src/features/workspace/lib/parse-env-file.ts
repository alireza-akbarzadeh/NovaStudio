/** Parse and serialize `.env` style files. */

export type EnvEntry = {
  key: string;
  value: string;
  /** 1-based line of the KEY= row (for jump-to-line). */
  line: number;
  filePath: string;
};

const ENV_FILE_PATTERN =
  /^\.env(?:\.(?:local|development|production|test|example))?$/;

/** Matches KEY=VALUE pairs in bulk paste (Vercel-style). */
const ENV_PAIR_RE =
  /(?:^|[\n\r\s])(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^\s#]+)/g;

export function isEnvFilePath(path: string): boolean {
  const name = path.split("/").filter(Boolean).pop() ?? path;
  return ENV_FILE_PATTERN.test(name);
}

export function listEnvFilePaths(paths: Iterable<string>): string[] {
  return [...paths]
    .filter(isEnvFilePath)
    .sort((a, b) => a.localeCompare(b));
}

function unquoteEnvValue(raw: string): string {
  const value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value
      .slice(1, -1)
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, "\\");
  }
  return value;
}

/** Strip `# comment` outside quoted strings. */
export function stripInlineEnvComment(line: string): string {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    const prev = line[i - 1];
    if (ch === "'" && !inDouble && prev !== "\\") {
      inSingle = !inSingle;
      continue;
    }
    if (ch === '"' && !inSingle && prev !== "\\") {
      inDouble = !inDouble;
      continue;
    }
    if (ch === "#" && !inSingle && !inDouble) {
      return line.slice(0, i).trimEnd();
    }
  }
  return line;
}

/**
 * Parse bulk `.env` paste — newline-separated or space-separated (Vercel import).
 * Handles `export KEY=`, quoted values, and inline `#` comments.
 */
export function parseEnvBulk(content: string, filePath: string): EnvEntry[] {
  const entries: EnvEntry[] = [];
  const seen = new Set<string>();

  const lines = content.split(/\r?\n/);
  const normalized = lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return "";
      return stripInlineEnvComment(line);
    })
    .filter(Boolean)
    .join("\n");

  if (!normalized.trim()) return entries;

  let match: RegExpExecArray | null;
  ENV_PAIR_RE.lastIndex = 0;
  while ((match = ENV_PAIR_RE.exec(normalized)) !== null) {
    const key = match[1];
    if (!key || seen.has(key)) continue;
    seen.add(key);

    const lineIndex = normalized.slice(0, match.index).split("\n").length;

    entries.push({
      key,
      value: unquoteEnvValue(match[2] ?? ""),
      line: lineIndex,
      filePath,
    });
  }

  return entries;
}

export function parseEnvFile(content: string, filePath: string): EnvEntry[] {
  return parseEnvBulk(content, filePath);
}

export function serializeEnvEntries(
  entries: Array<Pick<EnvEntry, "key" | "value">>,
): string {
  return entries
    .map((entry) => {
      const needsQuotes = /[\s#"'=\n\r]/.test(entry.value);
      const value = needsQuotes
        ? `"${entry.value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
        : entry.value;
      return `${entry.key}=${value}`;
    })
    .join("\n");
}

/** Merge imported entries into existing rows (import wins on duplicate keys). */
export function mergeEnvEntries(
  existing: Array<Pick<EnvEntry, "key" | "value">>,
  imported: Array<Pick<EnvEntry, "key" | "value">>,
): Array<Pick<EnvEntry, "key" | "value">> {
  const byKey = new Map(existing.map((entry) => [entry.key, entry.value]));
  for (const entry of imported) {
    const key = entry.key.trim();
    if (!key) continue;
    byKey.set(key, entry.value);
  }
  return [...byKey.entries()].map(([key, value]) => ({ key, value }));
}

export function upsertEnvEntry(
  content: string,
  filePath: string,
  key: string,
  value: string,
): string {
  const entries = parseEnvFile(content, filePath);
  const index = entries.findIndex((entry) => entry.key === key);
  if (index >= 0) {
    entries[index] = { ...entries[index]!, value };
  } else {
    entries.push({ key, value, line: entries.length + 1, filePath });
  }
  return serializeEnvEntries(entries);
}

export function removeEnvKey(
  content: string,
  filePath: string,
  key: string,
): string {
  const entries = parseEnvFile(content, filePath).filter(
    (entry) => entry.key !== key,
  );
  return serializeEnvEntries(entries);
}
