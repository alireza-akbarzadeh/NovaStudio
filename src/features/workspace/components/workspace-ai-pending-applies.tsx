"use client";

import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FileIcon,
  FilePlusIcon,
  Loader2Icon,
  XIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { WorkspaceDiffEditor } from "@/features/workspace/components/workspace-diff-editor";
import { useEditorTabs } from "@/features/workspace/hooks/use-editor-tabs";
import { countLineDiffStats } from "@/features/workspace/lib/line-diff-stats";
import { saveFileContentDraft } from "@/features/workspace/lib/file-content-drafts";
import {
  useAiPendingAppliesStore,
  type AiPendingApply,
} from "@/features/workspace/store/ai-pending-applies-store";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { cn } from "@/lib/utils";

type WorkspaceAiPendingAppliesProps = {
  projectId: string;
};

function fileName(path: string) {
  return path.split("/").pop() || path;
}

function PendingApplyCard({
  item,
  expanded,
  onToggle,
  onApply,
  onReject,
  applying,
}: {
  item: AiPendingApply;
  expanded: boolean;
  onToggle: () => void;
  onApply: () => void;
  onReject: () => void;
  applying: boolean;
}) {
  const stats = useMemo(
    () => countLineDiffStats(item.previousContent, item.nextContent),
    [item.previousContent, item.nextContent],
  );

  return (
    <div className="overflow-hidden rounded-lg border border-ws-border bg-ws-panel/90">
      <div className="flex items-center gap-1 px-2 py-1.5">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1 py-0.5 text-left hover:bg-ws-hover"
        >
          {expanded ? (
            <ChevronDownIcon className="size-3.5 shrink-0 text-ws-text-muted" />
          ) : (
            <ChevronRightIcon className="size-3.5 shrink-0 text-ws-text-muted" />
          )}
          {item.isNew ? (
            <FilePlusIcon className="size-3.5 shrink-0 text-emerald-400" />
          ) : (
            <FileIcon className="size-3.5 shrink-0 text-ws-text-muted" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-ws-text">
              {fileName(item.path)}
            </p>
            <p className="truncate text-[10px] text-ws-text-muted">
              {item.path}
              {item.isNew ? " · new file" : ""}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 text-[10px] tabular-nums">
            {stats.added > 0 ? (
              <span className="text-ws-success">+{stats.added}</span>
            ) : null}
            {stats.removed > 0 ? (
              <span className="text-ws-danger-soft">−{stats.removed}</span>
            ) : null}
          </span>
        </button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={applying}
          className="h-7 gap-1 px-2 text-[11px] text-emerald-400 hover:bg-emerald-500/15 hover:text-emerald-300"
          onClick={onApply}
        >
          {applying ? (
            <Loader2Icon className="size-3 animate-spin" />
          ) : (
            <CheckIcon className="size-3" />
          )}
          Apply
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={applying}
          className="h-7 gap-1 px-2 text-[11px] text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
          onClick={onReject}
        >
          <XIcon className="size-3" />
          Reject
        </Button>
      </div>

      {expanded ? (
        <div className="border-t border-ws-border-subtle">
          <div className="flex h-6 items-center border-b border-ws-border-subtle bg-ws-bg/40 text-[10px] font-medium tracking-wide text-ws-text-muted uppercase">
            <div className="flex h-full min-w-0 flex-1 items-center border-r border-ws-border-subtle px-2">
              Current
            </div>
            <div className="flex h-full min-w-0 flex-1 items-center px-2">
              Proposed
            </div>
          </div>
          <div className="h-44 min-h-0">
            <WorkspaceDiffEditor
              filePath={item.path}
              original={item.previousContent}
              modified={item.nextContent}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function WorkspaceAiPendingApplies({
  projectId,
}: WorkspaceAiPendingAppliesProps) {
  const allPending = useAiPendingAppliesStore((s) => s.pending);
  const pending = useMemo(
    () => allPending.filter((p) => p.projectId === projectId),
    [allPending, projectId],
  );
  const remove = useAiPendingAppliesStore((s) => s.remove);
  const removeMany = useAiPendingAppliesStore((s) => s.removeMany);
  const writeFileAtPath = useMutation(api.projectFiles.writeFileAtPath);
  const { openTab } = useEditorTabs(projectId);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [batchBusy, setBatchBusy] = useState(false);

  const applyOne = async (item: AiPendingApply) => {
    setBusyIds((prev) => new Set(prev).add(item.id));
    try {
      const result = await writeFileAtPath({
        projectId: projectId as Id<"projects">,
        path: item.path,
        content: item.nextContent,
      });
      saveFileContentDraft(projectId, result.path, item.nextContent);
      openTab({ kind: "file", path: result.path });
      remove(item.id);
      toast.success(
        result.created ? `Created ${result.path}` : `Applied ${result.path}`,
      );
    } catch (error) {
      toast.error("Could not apply change", {
        description:
          error instanceof Error ? error.message : "Write failed",
      });
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const rejectOne = (item: AiPendingApply) => {
    remove(item.id);
    toast.message(`Rejected ${item.path}`);
  };

  const applyAll = async () => {
    if (pending.length === 0 || batchBusy) return;
    setBatchBusy(true);
    const ids: string[] = [];
    let ok = 0;
    try {
      for (const item of pending) {
        try {
          const result = await writeFileAtPath({
            projectId: projectId as Id<"projects">,
            path: item.path,
            content: item.nextContent,
          });
          saveFileContentDraft(projectId, result.path, item.nextContent);
          ids.push(item.id);
          ok += 1;
        } catch {
          // continue remaining
        }
      }
      removeMany(ids);
      if (ok > 0) {
        const last = pending.find((p) => ids.includes(p.id));
        if (last) openTab({ kind: "file", path: last.path });
        toast.success(
          ok === 1 ? "Applied 1 file" : `Applied ${ok} files`,
        );
      }
      if (ok < pending.length) {
        toast.error(`Failed to apply ${pending.length - ok} file(s)`);
      }
    } finally {
      setBatchBusy(false);
    }
  };

  const rejectAll = () => {
    removeMany(pending.map((p) => p.id));
    toast.message(
      pending.length === 1
        ? "Rejected 1 change"
        : `Rejected ${pending.length} changes`,
    );
  };

  if (pending.length === 0) return null;

  return (
    <div className="shrink-0 border-t border-ws-border-subtle bg-ws-bg/60">
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium text-ws-text">
            Review AI changes
          </p>
          <p className="text-[10px] text-ws-text-muted">
            {pending.length} file{pending.length === 1 ? "" : "s"} waiting to
            apply
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={batchBusy}
          className="h-7 px-2 text-[11px] text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
          onClick={rejectAll}
        >
          Reject all
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={batchBusy}
          className={cn(
            "h-7 gap-1.5 bg-ws-accent px-2.5 text-[11px] text-white hover:bg-ws-accent-hover",
          )}
          onClick={() => void applyAll()}
        >
          {batchBusy ? (
            <Loader2Icon className="size-3 animate-spin" />
          ) : (
            <CheckIcon className="size-3" />
          )}
          Apply all
        </Button>
      </div>
      <div className="max-h-72 space-y-2 overflow-y-auto px-3 pb-3">
        {pending.map((item) => (
          <PendingApplyCard
            key={item.id}
            item={item}
            expanded={expandedId === item.id}
            onToggle={() =>
              setExpandedId((id) => (id === item.id ? null : item.id))
            }
            onApply={() => void applyOne(item)}
            onReject={() => rejectOne(item)}
            applying={batchBusy || busyIds.has(item.id)}
          />
        ))}
      </div>
    </div>
  );
}
