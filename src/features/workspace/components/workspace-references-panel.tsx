"use client";

import { CircleDotIcon, Link2Icon } from "lucide-react";

import { useEditorTabs } from "@/features/workspace/hooks/use-editor-tabs";
import type { SymbolReference } from "@/features/workspace/lib/symbol-refactor";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";

type WorkspaceReferencesPanelProps = {
  projectId: string;
};

function groupByFile(references: SymbolReference[]) {
  const groups = new Map<string, SymbolReference[]>();
  for (const ref of references) {
    const list = groups.get(ref.path) ?? [];
    list.push(ref);
    groups.set(ref.path, list);
  }
  return [...groups.entries()];
}

function fileNameFromPath(path: string) {
  return path.split("/").filter(Boolean).pop() ?? path;
}

export function WorkspaceReferencesPanel({
  projectId,
}: WorkspaceReferencesPanelProps) {
  const symbolReferences = useWorkspaceStore((s) => s.symbolReferences);
  const { openTab } = useEditorTabs(projectId);
  const setPendingEditorReveal = useWorkspaceStore(
    (s) => s.setPendingEditorReveal,
  );

  const onOpenReference = (ref: SymbolReference) => {
    setPendingEditorReveal({
      path: ref.path,
      line: ref.line,
      column: ref.column,
      matchLength: Math.max(1, ref.endColumn - ref.column),
    });
    openTab({ kind: "file", path: ref.path }, { mode: "preview" });
  };

  if (!symbolReferences || symbolReferences.references.length === 0) {
    return (
      <div className="flex h-full flex-col items-start gap-1 overflow-auto px-3 py-5">
        <p className="text-[12px] font-medium text-ws-text">No references</p>
        <p className="max-w-sm text-[11px] leading-relaxed text-ws-text-muted">
          Place the cursor on a symbol and press{" "}
          <kbd className="rounded bg-ws-hover px-1 py-0.5 font-mono text-[10px]">
            Shift+F12
          </kbd>{" "}
          or run <strong className="font-medium">Find All References</strong>{" "}
          from the command palette.
        </p>
      </div>
    );
  }

  const groups = groupByFile(symbolReferences.references);
  const refCount = symbolReferences.references.filter(
    (ref) => ref.kind === "reference",
  ).length;

  return (
    <div className="h-full min-h-0 overflow-auto py-1">
      <div className="border-b border-ws-border-subtle px-3 py-2">
        <p className="text-[11px] font-medium text-ws-text">
          {symbolReferences.symbolName}
        </p>
        <p className="text-[10px] text-ws-text-muted">
          {refCount} reference{refCount === 1 ? "" : "s"}
          {symbolReferences.references.some((ref) => ref.kind === "definition")
            ? " · 1 definition"
            : ""}
        </p>
      </div>
      <ul>
        {groups.map(([path, items]) => (
          <li key={path} className="mb-1">
            <div className="flex items-center gap-2 px-3 py-1 text-[11px]">
              <span className="truncate font-medium text-ws-text">
                {fileNameFromPath(path)}
              </span>
              <span className="min-w-0 truncate text-[10px] text-ws-text-muted">
                {path}
              </span>
              <span className="ml-auto shrink-0 tabular-nums text-[10px] text-ws-text-muted">
                {items.length}
              </span>
            </div>
            <ul>
              {items.map((ref, index) => (
                <li key={`${path}:${ref.line}:${ref.column}:${index}`}>
                  <button
                    type="button"
                    onClick={() => onOpenReference(ref)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-1 text-left text-[11px]",
                      "text-ws-text-muted hover:bg-ws-hover hover:text-ws-text",
                    )}
                  >
                    {ref.kind === "definition" ? (
                      <CircleDotIcon className="size-3.5 shrink-0 text-ws-link" />
                    ) : (
                      <Link2Icon className="size-3.5 shrink-0 text-ws-text-muted" />
                    )}
                    <span className="min-w-0 flex-1 truncate">
                      {ref.kind === "definition" ? "Definition" : "Reference"}
                    </span>
                    <span className="shrink-0 tabular-nums text-[10px] text-ws-text-muted">
                      [{ref.line}, {ref.column}]
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
