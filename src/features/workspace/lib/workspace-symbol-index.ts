import type { OutlineSymbolKind } from "@/features/workspace/hooks/use-monaco-outline";

export type WorkspaceSymbolHit = {
  path: string;
  name: string;
  kind: OutlineSymbolKind;
  line: number;
  column: number;
};

const SCANNABLE_EXT = /\.(tsx?|jsx?|css|scss|less|html)$/i;

export function isSymbolScannablePath(path: string): boolean {
  return SCANNABLE_EXT.test(path);
}

type LinePattern = {
  kind: OutlineSymbolKind;
  re: RegExp;
};

const LINE_PATTERNS: LinePattern[] = [
  {
    kind: "function",
    re: /^\s*export\s+(?:default\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/,
  },
  {
    kind: "class",
    re: /^\s*export\s+(?:default\s+)?class\s+([A-Za-z_$][\w$]*)/,
  },
  {
    kind: "interface",
    re: /^\s*export\s+(?:default\s+)?interface\s+([A-Za-z_$][\w$]*)/,
  },
  {
    kind: "type",
    re: /^\s*export\s+(?:default\s+)?type\s+([A-Za-z_$][\w$]*)/,
  },
  {
    kind: "enum",
    re: /^\s*export\s+(?:default\s+)?enum\s+([A-Za-z_$][\w$]*)/,
  },
  {
    kind: "constant",
    re: /^\s*export\s+(?:default\s+)?const\s+([A-Za-z_$][\w$]*)/,
  },
  {
    kind: "function",
    re: /^\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*[<(]/,
  },
  {
    kind: "class",
    re: /^\s*class\s+([A-Za-z_$][\w$]*)/,
  },
  {
    kind: "interface",
    re: /^\s*interface\s+([A-Za-z_$][\w$]*)/,
  },
  {
    kind: "type",
    re: /^\s*type\s+([A-Za-z_$][\w$]*)\s*[=<]/,
  },
  {
    kind: "enum",
    re: /^\s*enum\s+([A-Za-z_$][\w$]*)/,
  },
  {
    kind: "constant",
    re: /^\s*const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(/,
  },
];

function scanCssLine(line: string, lineNum: number, path: string): WorkspaceSymbolHit[] {
  const ruleRe =
    /^(\s*)(@[\w-]+|[.#]?[\w-]+(?:\s*[>+~]\s*[\w.#-]+)*(?:\s*,\s*[.#]?[\w-]+)*)\s*\{/;
  const match = ruleRe.exec(line);
  if (!match?.[2]) return [];
  const name = match[2].trim();
  const column = (match[1]?.length ?? 0) + 1;
  return [
    {
      path,
      name,
      kind: name.startsWith("@") ? "module" : "class",
      line: lineNum,
      column,
    },
  ];
}

export function scanFileSymbols(path: string, content: string): WorkspaceSymbolHit[] {
  if (!isSymbolScannablePath(path)) return [];

  const hits: WorkspaceSymbolHit[] = [];
  const seen = new Set<string>();
  const lines = content.split(/\r?\n/);
  const isCss = /\.(css|scss|less)$/i.test(path);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("*")) continue;

    if (isCss) {
      for (const hit of scanCssLine(line, i + 1, path)) {
        const key = `${hit.name}:${hit.line}`;
        if (seen.has(key)) continue;
        seen.add(key);
        hits.push(hit);
      }
      continue;
    }

    for (const pattern of LINE_PATTERNS) {
      const match = pattern.re.exec(line);
      const name = match?.[1];
      if (!name) continue;
      const key = `${name}:${i + 1}`;
      if (seen.has(key)) continue;
      seen.add(key);
      hits.push({
        path,
        name,
        kind: pattern.kind,
        line: i + 1,
        column: (match.index ?? 0) + 1,
      });
      break;
    }
  }

  return hits;
}

export function buildWorkspaceSymbolIndex(
  files: Array<{ path: string; content?: string }>,
): WorkspaceSymbolHit[] {
  const all: WorkspaceSymbolHit[] = [];
  for (const file of files) {
    if (!file.content?.trim()) continue;
    if (!isSymbolScannablePath(file.path)) continue;
    all.push(...scanFileSymbols(file.path, file.content));
  }
  return all.sort((a, b) => a.name.localeCompare(b.name));
}

export function filterSymbolHits(
  hits: WorkspaceSymbolHit[],
  query: string,
): WorkspaceSymbolHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return hits.slice(0, 200);

  const scored = hits
    .map((hit) => {
      const name = hit.name.toLowerCase();
      const path = hit.path.toLowerCase();
      let score = 0;
      if (name === q) score += 100;
      else if (name.startsWith(q)) score += 60;
      else if (name.includes(q)) score += 30;
      if (path.includes(q)) score += 10;
      return { hit, score };
    })
    .filter((row) => row.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || a.hit.name.localeCompare(b.hit.name),
    );

  return scored.slice(0, 200).map((row) => row.hit);
}
