"use client";

import {
  BoxIcon,
  BracesIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CircleDotIcon,
  ComponentIcon,
  FunctionSquareIcon,
  HashIcon,
  Loader2Icon,
  SquareIcon,
  TypeIcon,
  VariableIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  useMonacoOutline,
  type OutlineSymbol,
  type OutlineSymbolKind,
} from "@/features/workspace/hooks/use-monaco-outline";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";

function SymbolIcon({ kind }: { kind: OutlineSymbolKind }) {
  const className = "size-3.5 shrink-0 text-ws-text-muted";
  switch (kind) {
    case "class":
    case "struct":
      return <BoxIcon className={className} strokeWidth={1.75} />;
    case "interface":
    case "type":
    case "typeParameter":
      return <TypeIcon className={className} strokeWidth={1.75} />;
    case "function":
    case "method":
    case "constructor":
      return <FunctionSquareIcon className={className} strokeWidth={1.75} />;
    case "constant":
      return <CircleDotIcon className={className} strokeWidth={1.75} />;
    case "variable":
    case "field":
      return <VariableIcon className={className} strokeWidth={1.75} />;
    case "property":
    case "key":
      return <HashIcon className={className} strokeWidth={1.75} />;
    case "enum":
    case "enumMember":
      return <BracesIcon className={className} strokeWidth={1.75} />;
    case "module":
    case "namespace":
    case "file":
      return <ComponentIcon className={className} strokeWidth={1.75} />;
    default:
      return <SquareIcon className={className} strokeWidth={1.75} />;
  }
}

function filterTree(
  symbols: OutlineSymbol[],
  query: string,
): OutlineSymbol[] {
  const q = query.trim().toLowerCase();
  if (!q) return symbols;

  const filterNode = (node: OutlineSymbol): OutlineSymbol | null => {
    const children = node.children
      .map(filterNode)
      .filter((c): c is OutlineSymbol => c != null);
    if (node.name.toLowerCase().includes(q) || children.length > 0) {
      return { ...node, children };
    }
    return null;
  };

  return symbols
    .map(filterNode)
    .filter((s): s is OutlineSymbol => s != null);
}

function collectExpandIds(symbols: OutlineSymbol[]): Set<string> {
  const ids = new Set<string>();
  const walk = (nodes: OutlineSymbol[]) => {
    for (const node of nodes) {
      if (node.children.length > 0) {
        ids.add(node.id);
        walk(node.children);
      }
    }
  };
  walk(symbols);
  return ids;
}

function OutlineRow({
  symbol,
  depth,
  activeId,
  expanded,
  onToggle,
  onSelect,
}: {
  symbol: OutlineSymbol;
  depth: number;
  activeId: string | null;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (symbol: OutlineSymbol) => void;
}) {
  const hasChildren = symbol.children.length > 0;
  const isExpanded = expanded.has(symbol.id);
  const isActive = activeId === symbol.id;

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(symbol)}
        className={cn(
          "flex w-full items-center gap-1 py-0.5 pr-2 text-left text-[11px]",
          "text-ws-text-secondary hover:bg-ws-hover hover:text-ws-text",
          isActive && "bg-ws-hover text-ws-text",
        )}
        style={{ paddingLeft: 8 + depth * 12 }}
      >
        {hasChildren ? (
          <span
            role="presentation"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(symbol.id);
            }}
            className="inline-flex size-3.5 shrink-0 items-center justify-center text-ws-text-muted"
          >
            {isExpanded ? (
              <ChevronDownIcon className="size-3" strokeWidth={2} />
            ) : (
              <ChevronRightIcon className="size-3" strokeWidth={2} />
            )}
          </span>
        ) : (
          <span className="inline-block size-3.5 shrink-0" />
        )}
        <SymbolIcon kind={symbol.kind} />
        <span className="min-w-0 flex-1 truncate">{symbol.name}</span>
        <span className="shrink-0 tabular-nums text-[10px] text-ws-text-muted">
          {symbol.line}
        </span>
      </button>
      {hasChildren && isExpanded ? (
        <ul>
          {symbol.children.map((child) => (
            <OutlineRow
              key={child.id}
              symbol={child}
              depth={depth + 1}
              activeId={activeId}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function WorkspaceOutlinePanel() {
  const currentFilePath = useWorkspaceStore((s) => s.currentFilePath);
  const setPendingEditorReveal = useWorkspaceStore(
    (s) => s.setPendingEditorReveal,
  );
  const { symbols, loading, activeSymbolId } =
    useMonacoOutline(currentFilePath);

  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const expandAllRef = useRef(true);
  const knownIdsRef = useRef<Set<string>>(new Set());

  const fileName = currentFilePath
    ? currentFilePath.split("/").filter(Boolean).pop()
    : null;

  const filtered = useMemo(
    () => filterTree(symbols, query),
    [symbols, query],
  );

  useEffect(() => {
    setQuery("");
    expandAllRef.current = true;
    knownIdsRef.current = new Set();
  }, [currentFilePath]);

  useEffect(() => {
    const all = collectExpandIds(symbols);
    setExpanded((prev) => {
      if (expandAllRef.current) {
        expandAllRef.current = false;
        knownIdsRef.current = all;
        return all;
      }

      const next = new Set<string>();
      for (const id of all) {
        if (prev.has(id)) {
          next.add(id);
        } else if (!knownIdsRef.current.has(id)) {
          // Brand-new node after an edit — start expanded.
          next.add(id);
        }
        // else: existed before but user collapsed it — stay collapsed
      }
      knownIdsRef.current = all;
      return next;
    });
  }, [symbols]);

  const displayExpanded = useMemo(() => {
    if (!query.trim()) return expanded;
    return collectExpandIds(filtered);
  }, [expanded, filtered, query]);

  const onToggle = (id: string) => {
    if (query.trim()) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSelect = (symbol: OutlineSymbol) => {
    if (!currentFilePath) return;
    setPendingEditorReveal({
      path: currentFilePath,
      line: symbol.line,
      column: symbol.column,
      matchLength: Math.max(1, symbol.name.length),
    });
  };

  if (!currentFilePath) {
    return (
      <div className="flex h-full flex-col items-start gap-1 overflow-auto px-3 py-5">
        <p className="text-[12px] font-medium text-ws-text">No file open</p>
        <p className="max-w-sm text-[11px] leading-relaxed text-ws-text-muted">
          Open a file to see its functions, classes, and components here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-1.5 border-b border-ws-border-subtle p-2">
        <p className="truncate px-0.5 text-[10px] text-ws-text-muted">
          {fileName}
        </p>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter symbols"
          className="h-7 border-ws-border-subtle bg-ws-bg text-[11px] shadow-none"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-auto py-1">
        {loading && symbols.length === 0 ? (
          <div className="flex items-center gap-2 px-3 py-4 text-[11px] text-ws-text-muted">
            <Loader2Icon className="size-3.5 animate-spin" />
            Loading symbols…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-start gap-1 px-3 py-5">
            <p className="text-[12px] font-medium text-ws-text">
              {query.trim()
                ? "No matching symbols"
                : "No symbols in this file"}
            </p>
            <p className="max-w-sm text-[11px] leading-relaxed text-ws-text-muted">
              {query.trim()
                ? "Try a different filter."
                : "Symbols appear for TypeScript, JavaScript, CSS, and HTML files."}
            </p>
          </div>
        ) : (
          <ul>
            {filtered.map((symbol) => (
              <OutlineRow
                key={symbol.id}
                symbol={symbol}
                depth={0}
                activeId={activeSymbolId}
                expanded={displayExpanded}
                onToggle={onToggle}
                onSelect={onSelect}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
