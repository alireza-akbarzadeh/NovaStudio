import {
  scanFileSymbols,
  type WorkspaceSymbolHit,
} from "@/features/workspace/lib/workspace-symbol-index";

export type SemanticSearchChunk = {
  id: string;
  path: string;
  startLine: number;
  endLine: number;
  headline: string;
  excerpt: string;
  symbols: string[];
};

export type SemanticSearchResult = {
  path: string;
  startLine: number;
  endLine: number;
  snippet: string;
  summary: string;
};

const IGNORED_PATH_RE =
  /(?:^|\/)(node_modules|\.git|dist|build|\.next|coverage|\.turbo)(?:\/|$)/i;
const SCANNABLE = /\.(tsx?|jsx?|css|scss|json|md|mdx|html|vue|yaml|yml)$/i;

const MAX_FILES = 120;
const MAX_CHUNKS = 60;
const MAX_EXCERPT_LINES = 36;
const MAX_EXCERPT_CHARS = 1400;
const MAX_FILE_BYTES = 512_000;

function fileNameFromPath(path: string) {
  return path.split("/").filter(Boolean).pop() ?? path;
}

function isIgnoredPath(path: string) {
  return IGNORED_PATH_RE.test(path);
}

function isScannablePath(path: string) {
  return SCANNABLE.test(path);
}

function pathPriority(path: string) {
  if (path.startsWith("src/")) return 0;
  if (path.startsWith("convex/")) return 1;
  if (path.startsWith("app/")) return 2;
  if (path.includes("/")) return 3;
  return 4;
}

function chunkFromRange(
  path: string,
  lines: string[],
  startLine: number,
  endLine: number,
  headline: string,
  symbols: string[],
): SemanticSearchChunk {
  const safeStart = Math.max(1, startLine);
  const safeEnd = Math.min(lines.length, Math.max(safeStart, endLine));
  const excerpt = lines
    .slice(safeStart - 1, safeEnd)
    .join("\n")
    .slice(0, MAX_EXCERPT_CHARS);
  return {
    id: `${path}:${safeStart}:${safeEnd}`,
    path,
    startLine: safeStart,
    endLine: safeEnd,
    headline,
    excerpt,
    symbols,
  };
}

function chunkFile(path: string, content: string): SemanticSearchChunk[] {
  const lines = content.split(/\r?\n/);
  const symbols = scanFileSymbols(path, content);

  if (lines.length <= MAX_EXCERPT_LINES) {
    return [
      chunkFromRange(
        path,
        lines,
        1,
        lines.length,
        symbols[0]?.name ?? fileNameFromPath(path),
        symbols.map((s) => s.name),
      ),
    ];
  }

  if (symbols.length === 0) {
    return [
      chunkFromRange(
        path,
        lines,
        1,
        MAX_EXCERPT_LINES,
        fileNameFromPath(path),
        [],
      ),
    ];
  }

  const chunks: SemanticSearchChunk[] = [];
  for (let i = 0; i < symbols.length; i++) {
    const sym = symbols[i]!;
    const nextStart = symbols[i + 1]?.line ?? lines.length + 1;
    const endLine = Math.min(
      lines.length,
      Math.max(sym.line, nextStart - 1, sym.line + MAX_EXCERPT_LINES - 1),
    );
    const related = symbols
      .slice(i, i + 4)
      .filter((s) => s.line <= endLine)
      .map((s) => s.name);
    chunks.push(
      chunkFromRange(path, lines, sym.line, endLine, sym.name, related),
    );
    if (chunks.length >= 8) break;
  }

  return chunks;
}

export function buildSemanticSearchIndex(
  files: Array<{ path: string; content?: string }>,
): SemanticSearchChunk[] {
  const candidates = files
    .filter(
      (file) =>
        file.path &&
        file.content?.trim() &&
        !isIgnoredPath(file.path) &&
        isScannablePath(file.path) &&
        file.content.length <= MAX_FILE_BYTES,
    )
    .sort(
      (a, b) =>
        pathPriority(a.path) - pathPriority(b.path) ||
        a.path.localeCompare(b.path),
    )
    .slice(0, MAX_FILES);

  const chunks: SemanticSearchChunk[] = [];
  for (const file of candidates) {
    chunks.push(...chunkFile(file.path, file.content!));
    if (chunks.length >= MAX_CHUNKS) break;
  }

  return chunks.slice(0, MAX_CHUNKS);
}

function queryTerms(query: string) {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

function scoreChunk(chunk: SemanticSearchChunk, terms: string[]): number {
  if (terms.length === 0) return 0;
  const haystack = [
    chunk.path,
    chunk.headline,
    chunk.excerpt,
    ...chunk.symbols,
  ]
    .join("\n")
    .toLowerCase();

  let score = 0;
  for (const term of terms) {
    if (chunk.headline.toLowerCase() === term) score += 80;
    else if (chunk.headline.toLowerCase().includes(term)) score += 40;
    if (chunk.path.toLowerCase().includes(term)) score += 25;
    if (chunk.symbols.some((s) => s.toLowerCase().includes(term))) score += 30;
    if (haystack.includes(term)) score += 12;
  }
  return score;
}

export function filterSemanticChunksLocally(
  chunks: SemanticSearchChunk[],
  query: string,
  limit = 12,
): SemanticSearchResult[] {
  const terms = queryTerms(query);
  if (terms.length === 0) return [];

  return chunks
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, terms) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.chunk.path.localeCompare(b.chunk.path))
    .slice(0, limit)
    .map(({ chunk }) => ({
      path: chunk.path,
      startLine: chunk.startLine,
      endLine: chunk.endLine,
      snippet: chunk.excerpt.split("\n").slice(0, 4).join("\n").trim(),
      summary: `Matches in ${chunk.headline}`,
    }));
}

export function pickChunksForAi(
  chunks: SemanticSearchChunk[],
  query: string,
  limit = 32,
): SemanticSearchChunk[] {
  const terms = queryTerms(query);
  if (terms.length === 0) return chunks.slice(0, limit);

  return chunks
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, terms) }))
    .sort((a, b) => b.score - a.score || a.chunk.path.localeCompare(b.chunk.path))
    .slice(0, limit)
    .map((row) => row.chunk);
}

export function formatChunksForPrompt(chunks: SemanticSearchChunk[]): string {
  return chunks
    .map((chunk) => {
      const symbolList =
        chunk.symbols.length > 0 ? chunk.symbols.join(", ") : chunk.headline;
      return [
        `### ${chunk.path} (lines ${chunk.startLine}-${chunk.endLine})`,
        `symbols: ${symbolList}`,
        "```",
        chunk.excerpt,
        "```",
      ].join("\n");
    })
    .join("\n\n");
}

/** Map AI result lines back to a validated snippet from the index. */
export function normalizeAiResults(
  raw: SemanticSearchResult[],
  chunks: SemanticSearchChunk[],
  allowedPaths: Set<string>,
): SemanticSearchResult[] {
  const byPath = new Map<string, SemanticSearchChunk[]>();
  for (const chunk of chunks) {
    const list = byPath.get(chunk.path) ?? [];
    list.push(chunk);
    byPath.set(chunk.path, list);
  }

  const seen = new Set<string>();
  const out: SemanticSearchResult[] = [];

  for (const row of raw) {
    if (!allowedPaths.has(row.path)) continue;
    const key = `${row.path}:${row.startLine}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const snippet = row.snippet?.trim().slice(0, 600);
    const summary = row.summary?.trim().slice(0, 280);
    if (!snippet || !summary) continue;

    const startLine = Math.max(1, Math.floor(row.startLine));
    const endLine = Math.max(startLine, Math.floor(row.endLine || startLine));

    out.push({
      path: row.path,
      startLine,
      endLine,
      snippet,
      summary,
    });
    if (out.length >= 12) break;
  }

  return out;
}

export type { WorkspaceSymbolHit };
