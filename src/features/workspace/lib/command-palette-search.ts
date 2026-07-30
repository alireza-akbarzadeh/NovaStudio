import type { CommandId } from "@/features/workspace/commands/registry";
import type { OutlineSymbolKind } from "@/features/workspace/hooks/use-monaco-outline";
import type { PaletteCommandMeta } from "@/features/workspace/lib/command-palette-items";
import {
  getFuzzyMatchIndices,
  searchFilesByName,
  type FileNameMatch,
  type SearchMatch,
} from "@/features/workspace/lib/search";
import { SEARCH_FILE_NAME_LIMIT } from "@/features/workspace/lib/search-limits";
import type { WorkspaceSymbolHit } from "@/features/workspace/lib/workspace-symbol-index";

export type SearchEverywhereTab =
  | "all"
  | "types"
  | "files"
  | "symbols"
  | "actions"
  | "text";

export const SEARCH_EVERYWHERE_TABS: Array<{
  id: SearchEverywhereTab;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "types", label: "Types" },
  { id: "files", label: "Files" },
  { id: "symbols", label: "Symbols" },
  { id: "actions", label: "Actions" },
  { id: "text", label: "Text" },
];

const TYPE_SYMBOL_KINDS = new Set<OutlineSymbolKind>([
  "class",
  "struct",
  "interface",
  "type",
  "enum",
]);

export type PaletteFileItem = {
  kind: "file";
  path: string;
  name: string;
  indices: number[];
};

export type PaletteSymbolItem = {
  kind: "symbol";
  hit: WorkspaceSymbolHit;
};

export type PaletteCommandItem = {
  kind: "command";
  command: PaletteCommandMeta;
};

export type PaletteTextItem = {
  kind: "text";
  match: SearchMatch;
};

export type PaletteItem =
  | PaletteFileItem
  | PaletteSymbolItem
  | PaletteCommandItem
  | PaletteTextItem;

export function paletteItemValue(item: PaletteItem): string {
  switch (item.kind) {
    case "file":
      return `file:${item.path}`;
    case "symbol":
      return `symbol:${item.hit.path}:${item.hit.line}:${item.hit.name}`;
    case "command":
      return `command:${item.command.id}`;
    case "text":
      return `text:${item.match.path}:${item.match.line}:${item.match.column}`;
  }
}

export function paletteItemFooter(item: PaletteItem | null): string {
  if (!item) return "";
  switch (item.kind) {
    case "file":
      return item.path;
    case "symbol":
      return `${item.hit.path}:${item.hit.line}`;
    case "command":
      return item.command.label;
    case "text":
      return `${item.match.path}:${item.match.line}:${item.match.column}`;
  }
}

export function paletteItemSupportsSplit(item: PaletteItem | null): boolean {
  return item?.kind === "file";
}

export function filterPaletteCommands(
  commands: PaletteCommandMeta[],
  query: string,
): PaletteCommandMeta[] {
  let trimmed = query.trim();
  if (trimmed.startsWith("/")) {
    trimmed = trimmed.slice(1).trim();
  }
  if (!trimmed) return commands;

  return commands.filter((command) => {
    const haystack = `${command.label} ${command.keywords ?? ""} ${command.id}`;
    return getFuzzyMatchIndices(trimmed, haystack) !== null;
  });
}

export function searchPaletteFiles(
  files: Array<{ path: string; kind: string; name?: string }> | undefined,
  query: string,
  options?: { maxResults?: number },
): { items: PaletteFileItem[]; truncated: boolean } {
  const maxResults = options?.maxResults ?? SEARCH_FILE_NAME_LIMIT;
  if (!files) return { items: [], truncated: false };

  const trimmed = query.trim();
  if (!trimmed) return { items: [], truncated: false };

  const { matches, truncated } = searchFilesByName(files, trimmed, {
    maxResults,
  });

  return {
    items: matches.map((match) => toPaletteFileItem(match)),
    truncated,
  };
}

function toPaletteFileItem(match: FileNameMatch): PaletteFileItem {
  return {
    kind: "file",
    path: match.path,
    name: match.name,
    indices: match.indices,
  };
}

export function filterPaletteSymbols(
  hits: WorkspaceSymbolHit[],
  tab: SearchEverywhereTab,
): WorkspaceSymbolHit[] {
  const limit = tab === "all" ? 40 : 80;
  if (tab === "types") {
    return hits
      .filter((hit) => TYPE_SYMBOL_KINDS.has(hit.kind))
      .slice(0, limit);
  }
  return hits.slice(0, limit);
}

export function toPaletteSymbolItems(
  hits: WorkspaceSymbolHit[],
): PaletteSymbolItem[] {
  return hits.map((hit) => ({ kind: "symbol", hit }));
}

export function toPaletteCommandItems(
  commands: PaletteCommandMeta[],
): PaletteCommandItem[] {
  return commands.map((command) => ({ kind: "command", command }));
}

export function toPaletteTextItems(matches: SearchMatch[]): PaletteTextItem[] {
  return matches.map((match) => ({ kind: "text", match }));
}

export function shouldSearchText(query: string): boolean {
  return query.trim().length >= 2;
}

export function tabFromQueryPrefix(query: string): SearchEverywhereTab | null {
  const trimmed = query.trim();
  if (trimmed.startsWith("/")) return "actions";
  return null;
}

export function normalizeCommandQuery(query: string): string {
  return query.trim().startsWith("/") ? query.trim().slice(1).trim() : query;
}
