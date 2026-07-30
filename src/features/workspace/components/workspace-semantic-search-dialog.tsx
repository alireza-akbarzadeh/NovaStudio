"use client";

import {
  FileSearchIcon,
  Loader2Icon,
  SparklesIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useEditorTabs } from "@/features/workspace/hooks/use-editor-tabs";
import { useSemanticCodebaseSearch } from "@/features/workspace/hooks/use-semantic-codebase-search";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";

type WorkspaceSemanticSearchDialogProps = {
  projectId: string;
};

function fileNameFromPath(path: string) {
  return path.split("/").filter(Boolean).pop() ?? path;
}

export function WorkspaceSemanticSearchDialog({
  projectId,
}: WorkspaceSemanticSearchDialogProps) {
  const open = useWorkspaceStore((s) => s.semanticSearchOpen);
  const closeSemanticSearch = useWorkspaceStore((s) => s.closeSemanticSearch);
  const setPendingEditorReveal = useWorkspaceStore(
    (s) => s.setPendingEditorReveal,
  );
  const { openTab } = useEditorTabs(projectId);

  const [query, setQuery] = useState("");
  const { results, loading, searching, error, totalChunks } =
    useSemanticCodebaseSearch(projectId, query, open);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const onOpenChange = (next: boolean) => {
    if (!next) closeSemanticSearch();
  };

  const onSelect = (
    path: string,
    startLine: number,
    snippet: string,
  ) => {
    const matchLength = snippet.split("\n")[0]?.length ?? 1;
    setPendingEditorReveal({
      path,
      line: startLine,
      column: 1,
      matchLength: Math.max(1, matchLength),
    });
    openTab({ kind: "file", path }, { mode: "preview" });
    closeSemanticSearch();
  };

  const showHint = query.trim().length > 0 && query.trim().length < 3;
  const isBusy = loading || searching;

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Semantic Codebase Search"
      description="Ask where something lives in natural language"
      className="border-ws-border-subtle bg-ws-panel sm:max-w-2xl"
    >
      <CommandInput
        placeholder="Where is auth handled? How does preview start?"
        value={query}
        onValueChange={setQuery}
        className="border-ws-border-subtle"
      />
      <CommandList className="max-h-[min(480px,55vh)]">
        {loading ? (
          <div className="flex items-center gap-2 px-3 py-6 text-[11px] text-ws-text-muted">
            <Loader2Icon className="size-3.5 animate-spin" />
            Indexing project files…
          </div>
        ) : showHint ? (
          <CommandEmpty className="py-6 text-[11px] text-ws-text-muted">
            Type at least 3 characters to search {totalChunks} indexed regions.
          </CommandEmpty>
        ) : error ? (
          <CommandEmpty className="space-y-1 py-6 text-[11px] text-ws-text-muted">
            <p className="text-amber-400/90">{error}</p>
            <p>Showing keyword matches when available.</p>
          </CommandEmpty>
        ) : results.length === 0 ? (
          <CommandEmpty className="py-6 text-[11px] text-ws-text-muted">
            {query.trim()
              ? isBusy
                ? "Searching…"
                : "No matches. Try different words or a shorter question."
              : `Search across ${totalChunks} code regions with natural language.`}
          </CommandEmpty>
        ) : (
          <CommandGroup
            heading={
              searching
                ? "Refining with AI…"
                : `${results.length} result${results.length === 1 ? "" : "s"}`
            }
          >
            {results.map((hit) => (
              <CommandItem
                key={`${hit.path}:${hit.startLine}:${hit.summary}`}
                value={`${hit.summary} ${hit.path} ${hit.snippet}`}
                onSelect={() => onSelect(hit.path, hit.startLine, hit.snippet)}
                className="items-start gap-2 py-2.5 text-[12px]"
              >
                <SparklesIcon
                  className="mt-0.5 size-3.5 shrink-0 text-violet-400/80"
                  strokeWidth={1.75}
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-medium text-ws-text">{hit.summary}</p>
                  <pre
                    className={cn(
                      "max-h-16 overflow-hidden whitespace-pre-wrap font-mono text-[10px] leading-relaxed",
                      "text-ws-text-secondary/90",
                    )}
                  >
                    {hit.snippet}
                  </pre>
                  <div className="flex items-center gap-2 text-[10px] text-ws-text-muted">
                    <FileSearchIcon className="size-3 shrink-0" />
                    <span className="truncate">{fileNameFromPath(hit.path)}</span>
                    <span className="shrink-0 tabular-nums">
                      {hit.startLine}
                      {hit.endLine > hit.startLine ? `–${hit.endLine}` : ""}
                    </span>
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {searching && results.length > 0 ? (
          <div className="flex items-center gap-2 border-t border-ws-border-subtle px-3 py-2 text-[10px] text-ws-text-muted">
            <Loader2Icon className="size-3 animate-spin" />
            Updating results…
          </div>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
