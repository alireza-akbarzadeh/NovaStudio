"use client";

import { FileIcon } from "@react-symbols/icons/utils";
import {
  BoxIcon,
  BracesIcon,
  ClockIcon,
  CornerDownLeftIcon,
  FileIcon as FileLucideIcon,
  FunctionSquareIcon,
  Loader2Icon,
  TerminalIcon,
  TypeIcon,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { HighlightedText } from "@/features/workspace/components/highlighted-text";
import {
  runCommand,
  type CommandId,
} from "@/features/workspace/commands/registry";
import { useEditorTabs } from "@/features/workspace/hooks/use-editor-tabs";
import type { OutlineSymbolKind } from "@/features/workspace/hooks/use-monaco-outline";
import {
  useProjectAllFileContents,
  useProjectFileMetadata,
} from "@/features/workspace/hooks/use-project-files";
import { useProjectTextSearch } from "@/features/workspace/hooks/use-project-text-search";
import { useWorkspaceSymbolSearch } from "@/features/workspace/hooks/use-workspace-symbol-search";
import { visiblePaletteCommands } from "@/features/workspace/lib/command-palette-items";
import {
  filterPaletteCommands,
  filterPaletteSymbols,
  normalizeCommandQuery,
  paletteItemFooter,
  paletteItemSupportsSplit,
  paletteItemValue,
  searchPaletteFiles,
  SEARCH_EVERYWHERE_TABS,
  shouldSearchText,
  tabFromQueryPrefix,
  toPaletteCommandItems,
  toPaletteSymbolItems,
  toPaletteTextItems,
  type PaletteItem,
  type SearchEverywhereTab,
} from "@/features/workspace/lib/command-palette-search";
import { createEditorTab } from "@/features/workspace/lib/editor-tabs";
import {
  loadRecentFilePaths,
  pushRecentFilePath,
} from "@/features/workspace/lib/recent-files";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import { useIsApplePlatform } from "@/lib/use-is-apple-platform";
import { cn } from "@/lib/utils";

type WorkspaceCommandPaletteProps = {
  projectId: string;
};

function fileName(path: string) {
  return path.split("/").filter(Boolean).pop() || path;
}

function parentDir(path: string) {
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 1) return "";
  return parts.slice(0, -1).join("/");
}

function SymbolKindIcon({ kind }: { kind: OutlineSymbolKind }) {
  const className = "size-3.5 shrink-0 text-ws-text-muted";
  switch (kind) {
    case "class":
    case "struct":
      return <BoxIcon className={className} strokeWidth={1.75} />;
    case "interface":
    case "type":
      return <TypeIcon className={className} strokeWidth={1.75} />;
    case "enum":
      return <BracesIcon className={className} strokeWidth={1.75} />;
    default:
      return <FunctionSquareIcon className={className} strokeWidth={1.75} />;
  }
}

export function WorkspaceCommandPalette({
  projectId,
}: WorkspaceCommandPaletteProps) {
  const open = useWorkspaceStore((s) => s.commandPaletteOpen);
  const commandPaletteInitialTab = useWorkspaceStore(
    (s) => s.commandPaletteInitialTab,
  );
  const closeCommandPalette = useWorkspaceStore((s) => s.closeCommandPalette);
  const editorTabs = useWorkspaceStore((s) => s.editorTabs);
  const openEditorSplit = useWorkspaceStore((s) => s.openEditorSplit);
  const syncEditorTabFromRoute = useWorkspaceStore(
    (s) => s.syncEditorTabFromRoute,
  );
  const setPendingEditorReveal = useWorkspaceStore(
    (s) => s.setPendingEditorReveal,
  );

  const files = useProjectFileMetadata(projectId);
  const { openTab } = useEditorTabs(projectId);
  const isApple = useIsApplePlatform();

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<SearchEverywhereTab>("all");
  const [recentPaths, setRecentPaths] = useState<string[]>([]);
  const [selectedValue, setSelectedValue] = useState("");
  const itemsByValueRef = useRef(new Map<string, PaletteItem>());

  useEffect(() => {
    if (!open) {
      setQuery("");
      setTab("all");
      setSelectedValue("");
      return;
    }
    setRecentPaths(loadRecentFilePaths(projectId));
    if (commandPaletteInitialTab) {
      setTab(commandPaletteInitialTab);
    }
  }, [commandPaletteInitialTab, open, projectId]);

  useEffect(() => {
    for (const editorTab of editorTabs) {
      if (editorTab.kind === "file" && editorTab.path) {
        pushRecentFilePath(projectId, editorTab.path);
      }
    }
  }, [editorTabs, projectId]);

  useEffect(() => {
    const prefixTab = tabFromQueryPrefix(query);
    if (prefixTab && tab !== prefixTab) {
      setTab(prefixTab);
    }
  }, [query, tab]);

  const trimmedQuery = query.trim();
  const commandQuery = normalizeCommandQuery(query);
  const isSearching = trimmedQuery.length > 0;

  const filePaths = useMemo(
    () =>
      (files ?? [])
        .filter((file) => file.kind === "file")
        .map((file) => file.path),
    [files],
  );
  const fileSet = useMemo(() => new Set(filePaths), [filePaths]);

  const recent = useMemo(
    () => recentPaths.filter((path) => fileSet.has(path)).slice(0, 8),
    [recentPaths, fileSet],
  );

  const openFilePaths = useMemo(
    () =>
      editorTabs
        .filter(
          (editorTab): editorTab is typeof editorTab & { kind: "file"; path: string } =>
            editorTab.kind === "file" && Boolean(editorTab.path),
        )
        .map((editorTab) => editorTab.path),
    [editorTabs],
  );

  const commands = useMemo(
    () => visiblePaletteCommands(isApple),
    [isApple],
  );

  const filteredCommands = useMemo(
    () => filterPaletteCommands(commands, commandQuery),
    [commandQuery, commands],
  );

  const showFiles = tab === "all" || tab === "files";
  const showSymbols =
    tab === "all" || tab === "symbols" || tab === "types";
  const showActions = tab === "all" || tab === "actions";
  const showText = tab === "all" || tab === "text";

  const fileSearch = useMemo(() => {
    if (!showFiles || !isSearching) {
      return { items: [] as PaletteItem[], truncated: false };
    }
    const result = searchPaletteFiles(files, trimmedQuery, {
      maxResults: tab === "files" ? 80 : 40,
    });
    return result;
  }, [files, isSearching, showFiles, tab, trimmedQuery]);

  const symbolSearchEnabled =
    open && showSymbols && (isSearching || tab === "symbols" || tab === "types");
  const { hits: symbolHits, loading: symbolsLoading } = useWorkspaceSymbolSearch(
    projectId,
    trimmedQuery,
    symbolSearchEnabled,
  );

  const filteredSymbols = useMemo(
    () => filterPaletteSymbols(symbolHits, tab),
    [symbolHits, tab],
  );

  const textSearchEnabled =
    open && showText && shouldSearchText(trimmedQuery);
  const { files: contentFiles, loading: contentsLoading } =
    useProjectAllFileContents(projectId, textSearchEnabled);
  const {
    matches: textMatches,
    searching: textSearching,
    truncated: textTruncated,
  } = useProjectTextSearch(contentFiles, trimmedQuery, {
    enabled: textSearchEnabled,
    maxMatches: tab === "text" ? 80 : 25,
  });

  const paletteItems = useMemo(() => {
    const items: PaletteItem[] = [];
    const seen = new Set<string>();

    const push = (item: PaletteItem) => {
      const value = paletteItemValue(item);
      if (seen.has(value)) return;
      seen.add(value);
      items.push(item);
    };

    if (!isSearching && (tab === "all" || tab === "files")) {
      for (const path of recent) {
        push({
          kind: "file",
          path,
          name: fileName(path),
          indices: [],
        });
      }
      for (const path of openFilePaths) {
        if (recent.includes(path)) continue;
        push({
          kind: "file",
          path,
          name: fileName(path),
          indices: [],
        });
      }
    }

    if (showFiles && isSearching) {
      for (const item of fileSearch.items) {
        push(item);
      }
    }

    if (showSymbols && (isSearching || tab === "symbols" || tab === "types")) {
      for (const item of toPaletteSymbolItems(filteredSymbols)) {
        push(item);
      }
    }

    if (showActions) {
      const commandItems = isSearching
        ? toPaletteCommandItems(filteredCommands)
        : toPaletteCommandItems(commands.slice(0, 12));
      for (const item of commandItems) {
        push(item);
      }
    }

    if (showText && shouldSearchText(trimmedQuery)) {
      for (const item of toPaletteTextItems(textMatches)) {
        push(item);
      }
    }

    return items;
  }, [
    commands,
    filteredCommands,
    filteredSymbols,
    fileSearch.items,
    isSearching,
    openFilePaths,
    recent,
    showActions,
    showFiles,
    showSymbols,
    showText,
    tab,
    textMatches,
    trimmedQuery,
  ]);

  useEffect(() => {
    const map = new Map<string, PaletteItem>();
    for (const item of paletteItems) {
      map.set(paletteItemValue(item), item);
    }
    itemsByValueRef.current = map;
  }, [paletteItems]);

  const selectedItem = selectedValue
    ? (itemsByValueRef.current.get(selectedValue) ?? null)
    : null;

  const groupedItems = useMemo(() => {
    const recentItems: PaletteItem[] = [];
    const openItems: PaletteItem[] = [];
    const fileItems: PaletteItem[] = [];
    const symbolItems: PaletteItem[] = [];
    const commandItems: PaletteItem[] = [];
    const textItems: PaletteItem[] = [];

    for (const item of paletteItems) {
      switch (item.kind) {
        case "file":
          if (!isSearching && recent.includes(item.path)) {
            recentItems.push(item);
          } else if (!isSearching && openFilePaths.includes(item.path)) {
            openItems.push(item);
          } else {
            fileItems.push(item);
          }
          break;
        case "symbol":
          symbolItems.push(item);
          break;
        case "command":
          commandItems.push(item);
          break;
        case "text":
          textItems.push(item);
          break;
      }
    }

    return {
      recentItems,
      openItems,
      fileItems,
      symbolItems,
      commandItems,
      textItems,
    };
  }, [isSearching, openFilePaths, paletteItems, recent]);

  const isLoading =
    (symbolSearchEnabled && symbolsLoading) ||
    (textSearchEnabled && (contentsLoading || textSearching));

  const onOpenChange = (next: boolean) => {
    if (!next) closeCommandPalette();
  };

  const close = useCallback(() => {
    closeCommandPalette();
  }, [closeCommandPalette]);

  const openFile = useCallback(
    (path: string) => {
      pushRecentFilePath(projectId, path);
      openTab({ kind: "file", path });
      close();
    },
    [close, openTab, projectId],
  );

  const openFileInSplit = useCallback(
    (path: string) => {
      pushRecentFilePath(projectId, path);
      const existing = editorTabs.find(
        (editorTab) => editorTab.kind === "file" && editorTab.path === path,
      );
      if (existing) {
        openEditorSplit(existing.id);
        close();
        return;
      }

      const tabInput = createEditorTab({ kind: "file", path });
      syncEditorTabFromRoute(projectId, tabInput, { mode: "preview" });
      openEditorSplit(tabInput.id);
      close();
    },
    [
      close,
      editorTabs,
      openEditorSplit,
      projectId,
      syncEditorTabFromRoute,
    ],
  );

  const openSymbol = useCallback(
    (path: string, line: number, column: number, name: string) => {
      setPendingEditorReveal({
        path,
        line,
        column,
        matchLength: Math.max(1, name.length),
      });
      openTab({ kind: "file", path }, { mode: "preview" });
      close();
    },
    [close, openTab, setPendingEditorReveal],
  );

  const openTextMatch = useCallback(
    (path: string, line: number, column: number, matchLength: number) => {
      setPendingEditorReveal({ path, line, column, matchLength });
      openTab({ kind: "file", path }, { mode: "preview" });
      close();
    },
    [close, openTab, setPendingEditorReveal],
  );

  const runPaletteCommand = useCallback(
    (id: CommandId) => {
      close();
      queueMicrotask(() => runCommand(id));
    },
    [close],
  );

  const activateItem = useCallback(
    (item: PaletteItem, split = false) => {
      switch (item.kind) {
        case "file":
          if (split) openFileInSplit(item.path);
          else openFile(item.path);
          break;
        case "symbol":
          openSymbol(
            item.hit.path,
            item.hit.line,
            item.hit.column,
            item.hit.name,
          );
          break;
        case "command":
          runPaletteCommand(item.command.id);
          break;
        case "text":
          openTextMatch(
            item.match.path,
            item.match.line,
            item.match.column,
            item.match.matchEnd - item.match.matchStart,
          );
          break;
      }
    },
    [openFile, openFileInSplit, openSymbol, openTextMatch, runPaletteCommand],
  );

  const handleSelect = (value: string) => {
    const item = itemsByValueRef.current.get(value);
    if (item) activateItem(item);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && event.shiftKey) {
      const item = itemsByValueRef.current.get(selectedValue);
      if (item && paletteItemSupportsSplit(item)) {
        event.preventDefault();
        activateItem(item, true);
      }
    }

    if (event.key === "Tab" && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      const index = SEARCH_EVERYWHERE_TABS.findIndex((entry) => entry.id === tab);
      const next = SEARCH_EVERYWHERE_TABS[(index + 1) % SEARCH_EVERYWHERE_TABS.length];
      setTab(next.id);
    }
  };

  const showEmpty =
    !isLoading &&
    paletteItems.length === 0 &&
    (isSearching || tab !== "all");

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search Everywhere"
      description="Search files, symbols, commands, and text across the project"
      showCloseButton={false}
      className="top-[12%] translate-y-0 border-ws-border bg-ws-panel sm:max-w-2xl [&_[cmdk-group-heading]]:text-ws-text-muted [&_[cmdk-input]]:text-ws-text"
      header={<SearchEverywhereTabs active={tab} onChange={setTab} />}
      commandProps={{
        shouldFilter: false,
        value: selectedValue,
        onValueChange: setSelectedValue,
      }}
      contentProps={{ onKeyDown: handleKeyDown }}
      footer={
        <div className="flex items-center gap-3 border-t border-ws-border-subtle px-3 py-1.5 text-[10px] text-ws-text-muted">
          <span className="min-w-0 flex-1 truncate">
            {paletteItemFooter(selectedItem) || "Search everywhere"}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1">
            <CornerDownLeftIcon className="size-3" />
            Open
          </span>
          {paletteItemSupportsSplit(selectedItem) ? (
            <span className="shrink-0">⇧↵ Split</span>
          ) : null}
          <span className="shrink-0">Tab Scope</span>
          <span className="shrink-0">Esc Close</span>
        </div>
      }
    >
        <CommandInput
          placeholder="Search everywhere — type / for commands"
          value={query}
          onValueChange={setQuery}
          className="text-[13px]"
        />
        <CommandList className="max-h-[min(60vh,480px)]">
          {isLoading ? (
            <div className="flex items-center gap-2 px-3 py-6 text-[12px] text-ws-text-muted">
              <Loader2Icon className="size-3.5 animate-spin" />
              Searching…
            </div>
          ) : null}

          {showEmpty ? (
            <CommandEmpty className="py-6 text-[12px] text-ws-text-muted">
              No matching results.
            </CommandEmpty>
          ) : null}

          {!isLoading && groupedItems.recentItems.length > 0 ? (
            <CommandGroup heading="Recent">
              {groupedItems.recentItems.map((item) =>
                item.kind === "file" ? (
                  <FilePaletteRow
                    key={paletteItemValue(item)}
                    item={item}
                    query={trimmedQuery}
                    icon={<ClockIcon className="size-3.5 shrink-0 opacity-60" />}
                    onSelect={handleSelect}
                  />
                ) : null,
              )}
            </CommandGroup>
          ) : null}

          {!isLoading && groupedItems.openItems.length > 0 ? (
            <CommandGroup heading="Open editors">
              {groupedItems.openItems.map((item) =>
                item.kind === "file" ? (
                  <FilePaletteRow
                    key={paletteItemValue(item)}
                    item={item}
                    query={trimmedQuery}
                    icon={
                      <FileLucideIcon className="size-3.5 shrink-0 opacity-60" />
                    }
                    onSelect={handleSelect}
                  />
                ) : null,
              )}
            </CommandGroup>
          ) : null}

          {!isLoading &&
          (groupedItems.recentItems.length > 0 ||
            groupedItems.openItems.length > 0) &&
          (groupedItems.fileItems.length > 0 ||
            groupedItems.symbolItems.length > 0 ||
            groupedItems.commandItems.length > 0 ||
            groupedItems.textItems.length > 0) ? (
            <CommandSeparator className="bg-ws-border" />
          ) : null}

          {!isLoading && groupedItems.fileItems.length > 0 ? (
            <CommandGroup
              heading={
                fileSearch.truncated
                  ? `Files (${groupedItems.fileItems.length}+)`
                  : `Files (${groupedItems.fileItems.length})`
              }
            >
              {groupedItems.fileItems.map((item) =>
                item.kind === "file" ? (
                  <FilePaletteRow
                    key={paletteItemValue(item)}
                    item={item}
                    query={trimmedQuery}
                    onSelect={handleSelect}
                  />
                ) : null,
              )}
            </CommandGroup>
          ) : null}

          {!isLoading && groupedItems.symbolItems.length > 0 ? (
            <CommandGroup heading={`Symbols (${groupedItems.symbolItems.length})`}>
              {groupedItems.symbolItems.map((item) =>
                item.kind === "symbol" ? (
                  <CommandItem
                    key={paletteItemValue(item)}
                    value={paletteItemValue(item)}
                    onSelect={handleSelect}
                    className="gap-2 py-2 text-ws-text-secondary data-[selected=true]:bg-ws-hover data-[selected=true]:text-ws-text"
                  >
                    <SymbolKindIcon kind={item.hit.kind} />
                    <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-ws-text">
                      <HighlightedText text={item.hit.name} query={trimmedQuery} />
                    </span>
                    <span className="hidden max-w-[160px] shrink-0 truncate text-[10px] text-ws-text-muted sm:inline">
                      {parentDir(item.hit.path)}
                    </span>
                    <span className="shrink-0 tabular-nums text-[10px] text-ws-text-muted">
                      {item.hit.line}
                    </span>
                  </CommandItem>
                ) : null,
              )}
            </CommandGroup>
          ) : null}

          {!isLoading && groupedItems.commandItems.length > 0 ? (
            <CommandGroup heading="Actions">
              {groupedItems.commandItems.map((item) =>
                item.kind === "command" ? (
                  <CommandItem
                    key={paletteItemValue(item)}
                    value={paletteItemValue(item)}
                    onSelect={handleSelect}
                    className="gap-2 py-2 text-ws-text-secondary data-[selected=true]:bg-ws-hover data-[selected=true]:text-ws-text"
                  >
                    <TerminalIcon className="size-3.5 shrink-0 opacity-60" />
                    <span className="min-w-0 flex-1 truncate text-[12px]">
                      <HighlightedText
                        text={item.command.label}
                        query={commandQuery}
                      />
                    </span>
                    {item.command.shortcut ? (
                      <CommandShortcut className="text-[10px] text-ws-text-muted">
                        {item.command.shortcut}
                      </CommandShortcut>
                    ) : null}
                  </CommandItem>
                ) : null,
              )}
            </CommandGroup>
          ) : null}

          {!isLoading && groupedItems.textItems.length > 0 ? (
            <CommandGroup
              heading={
                textTruncated
                  ? `Text (${groupedItems.textItems.length}+)`
                  : `Text (${groupedItems.textItems.length})`
              }
            >
              {groupedItems.textItems.map((item) =>
                item.kind === "text" ? (
                  <CommandItem
                    key={paletteItemValue(item)}
                    value={paletteItemValue(item)}
                    onSelect={handleSelect}
                    className="gap-2 py-2 text-ws-text-secondary data-[selected=true]:bg-ws-hover data-[selected=true]:text-ws-text"
                  >
                    <span className="size-3.5 shrink-0 [&_svg]:size-full">
                      <FileIcon
                        fileName={fileName(item.match.path)}
                        autoAssign
                      />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden">
                      <span className="flex items-baseline gap-1.5 overflow-hidden">
                        <span className="shrink-0 text-[12px] font-medium text-ws-text">
                          {fileName(item.match.path)}
                        </span>
                        <span className="truncate text-[10px] text-ws-text-muted">
                          {item.match.line}:{item.match.column}
                        </span>
                      </span>
                      <span className="truncate text-[10px] text-ws-text-muted">
                        {item.match.lineText.trim()}
                      </span>
                    </span>
                  </CommandItem>
                ) : null,
              )}
            </CommandGroup>
          ) : null}
        </CommandList>
    </CommandDialog>
  );
}

function SearchEverywhereTabs({
  active,
  onChange,
}: {
  active: SearchEverywhereTab;
  onChange: (tab: SearchEverywhereTab) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 border-b border-ws-border-subtle px-2 py-1.5">
      {SEARCH_EVERYWHERE_TABS.map((entry) => (
        <button
          key={entry.id}
          type="button"
          onClick={() => onChange(entry.id)}
          className={cn(
            "rounded px-2 py-1 text-[11px] font-medium transition-colors",
            active === entry.id
              ? "bg-ws-hover text-ws-text"
              : "text-ws-text-muted hover:bg-ws-hover/60 hover:text-ws-text-secondary",
          )}
        >
          {entry.label}
        </button>
      ))}
    </div>
  );
}

function FilePaletteRow({
  item,
  query,
  icon,
  onSelect,
}: {
  item: Extract<PaletteItem, { kind: "file" }>;
  query: string;
  icon?: ReactNode;
  onSelect: (value: string) => void;
}) {
  const dir = parentDir(item.path);
  const value = paletteItemValue(item);

  return (
    <CommandItem
      value={value}
      onSelect={onSelect}
      className="gap-2 py-2 text-ws-text-secondary data-[selected=true]:bg-ws-hover data-[selected=true]:text-ws-text"
    >
      {icon ?? (
        <span className="size-3.5 shrink-0 [&_svg]:size-full">
          <FileIcon fileName={item.name} autoAssign />
        </span>
      )}
      <span className="flex min-w-0 flex-1 items-baseline gap-1.5 overflow-hidden">
        <span className="shrink-0 text-[12px] font-medium text-ws-text">
          <HighlightedText text={item.name} query={query} />
        </span>
        {dir ? (
          <span className="min-w-0 truncate text-[10px] text-ws-text-muted">
            {dir}
          </span>
        ) : null}
      </span>
    </CommandItem>
  );
}
