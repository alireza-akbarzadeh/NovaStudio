"use client";

import {
  BoxIcon,
  BracesIcon,
  FunctionSquareIcon,
  Loader2Icon,
  TypeIcon,
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
import { useWorkspaceSymbolSearch } from "@/features/workspace/hooks/use-workspace-symbol-search";
import type { OutlineSymbolKind } from "@/features/workspace/hooks/use-monaco-outline";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";

type WorkspaceGoToSymbolDialogProps = {
  projectId: string;
};

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

function fileNameFromPath(path: string) {
  return path.split("/").filter(Boolean).pop() ?? path;
}

export function WorkspaceGoToSymbolDialog({
  projectId,
}: WorkspaceGoToSymbolDialogProps) {
  const open = useWorkspaceStore((s) => s.goToSymbolOpen);
  const closeGoToSymbol = useWorkspaceStore((s) => s.closeGoToSymbol);
  const setPendingEditorReveal = useWorkspaceStore(
    (s) => s.setPendingEditorReveal,
  );
  const { openTab } = useEditorTabs(projectId);

  const [query, setQuery] = useState("");
  const { hits, loading, totalSymbols } = useWorkspaceSymbolSearch(
    projectId,
    query,
    open,
  );

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const onOpenChange = (next: boolean) => {
    if (!next) closeGoToSymbol();
  };

  const onSelect = (path: string, line: number, column: number, name: string) => {
    setPendingEditorReveal({
      path,
      line,
      column,
      matchLength: Math.max(1, name.length),
    });
    openTab({ kind: "file", path }, { mode: "preview" });
    closeGoToSymbol();
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Go to Symbol in Workspace"
      description="Search functions, classes, and types across the project"
      className="border-ws-border-subtle bg-ws-panel"
    >
      <CommandInput
        placeholder="Search symbols (e.g. Button, useAuth, App)"
        value={query}
        onValueChange={setQuery}
        className="border-ws-border-subtle"
      />
      <CommandList className="max-h-[min(420px,50vh)]">
        {loading ? (
          <div className="flex items-center gap-2 px-3 py-6 text-[11px] text-ws-text-muted">
            <Loader2Icon className="size-3.5 animate-spin" />
            Indexing symbols…
          </div>
        ) : hits.length === 0 ? (
          <CommandEmpty className="py-6 text-[11px] text-ws-text-muted">
            {totalSymbols === 0
              ? "No symbols found in this project yet."
              : "No matching symbols."}
          </CommandEmpty>
        ) : (
          <CommandGroup
            heading={`${hits.length} symbol${hits.length === 1 ? "" : "s"}`}
          >
            {hits.map((hit) => (
              <CommandItem
                key={`${hit.path}:${hit.line}:${hit.column}:${hit.name}`}
                value={`${hit.name} ${hit.path}`}
                onSelect={() =>
                  onSelect(hit.path, hit.line, hit.column, hit.name)
                }
                className="gap-2 text-[12px]"
              >
                <SymbolKindIcon kind={hit.kind} />
                <span className="min-w-0 flex-1 truncate font-medium text-ws-text">
                  {hit.name}
                </span>
                <span
                  className={cn(
                    "hidden shrink-0 truncate text-[10px] text-ws-text-muted sm:inline",
                    "max-w-[140px]",
                  )}
                >
                  {fileNameFromPath(hit.path)}
                </span>
                <span className="shrink-0 tabular-nums text-[10px] text-ws-text-muted">
                  {hit.line}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
