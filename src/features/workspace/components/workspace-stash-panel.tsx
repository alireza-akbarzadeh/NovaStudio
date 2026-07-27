"use client";

import { ArchiveIcon, Loader2Icon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useConfirm } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Id } from "@/convex/_generated/dataModel";
import {
  useApplyProjectStash,
  useChangedFiles,
  useCreateProjectStash,
  useProjectStashes,
  useRemoveProjectStash,
} from "@/features/workspace/hooks/use-project-files";

type WorkspaceStashPanelProps = {
  projectId: string;
};

function formatCreatedAt(value: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function WorkspaceStashPanel({ projectId }: WorkspaceStashPanelProps) {
  const stashes = useProjectStashes(projectId);
  const changedFiles = useChangedFiles(projectId);
  const createStash = useCreateProjectStash();
  const applyStash = useApplyProjectStash();
  const removeStash = useRemoveProjectStash();
  const confirm = useConfirm();

  const [name, setName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { totalChanges, stagedChanges } = useMemo(() => {
    const total = changedFiles?.length ?? 0;
    const staged = changedFiles?.filter((file) => file.staged).length ?? 0;
    return { totalChanges: total, stagedChanges: staged };
  }, [changedFiles]);

  const create = async (onlyStaged: boolean) => {
    setCreating(true);
    try {
      await createStash({
        projectId: projectId as Id<"projects">,
        name: name.trim() || undefined,
        onlyStaged,
      });
      setName("");
      toast.success(
        onlyStaged ? "Stashed staged changes" : "Stashed working changes",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to stash");
    } finally {
      setCreating(false);
    }
  };

  const onApply = async (stashId: string) => {
    setBusyId(stashId);
    try {
      await applyStash({
        projectId: projectId as Id<"projects">,
        stashId: stashId as Id<"projectStashes">,
        deleteAfterApply: true,
      });
      toast.success("Stash restored");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Apply failed");
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (stashId: string, stashName: string) => {
    const ok = await confirm({
      title: "Delete stash?",
      description: `This removes “${stashName}” permanently.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      tone: "danger",
    });
    if (!ok) return;

    setBusyId(stashId);
    try {
      await removeStash({
        projectId: projectId as Id<"projects">,
        stashId: stashId as Id<"projectStashes">,
      });
      toast.success("Stash deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  if (stashes === undefined || changedFiles === undefined) {
    return (
      <div className="flex items-center gap-2 px-3 py-4 text-[11px] text-ws-text-muted">
        <Loader2Icon className="size-3.5 animate-spin" />
        Loading stashes…
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-2 border-b border-ws-border-subtle bg-ws-panel p-2.5">
        <div className="rounded-md border border-ws-border-subtle bg-ws-bg/80 p-2.5">
          <p className="text-[11px] font-medium text-ws-text">Stash changes</p>
          <p className="mt-1 text-[10px] text-ws-text-muted">
            {totalChanges} changed · {stagedChanges} staged
          </p>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Optional stash name"
            className="mt-2 h-7 border-ws-border bg-ws-bg text-[11px]"
          />
          <div className="mt-2 flex gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={creating || totalChanges === 0}
              onClick={() => void create(false)}
              className="h-7 border-ws-border bg-ws-bg px-2 text-[11px] hover:bg-ws-hover"
            >
              {creating ? (
                <Loader2Icon className="size-3 animate-spin" />
              ) : (
                <ArchiveIcon className="size-3" />
              )}
              Stash all
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={creating || stagedChanges === 0}
              onClick={() => void create(true)}
              className="h-7 bg-ws-accent px-2 text-[11px] text-white hover:bg-ws-accent-hover"
            >
              Stash staged
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-2.5">
        {stashes.length === 0 ? (
          <div className="rounded-md border border-dashed border-ws-border-subtle bg-ws-bg/50 p-4 text-center">
            <p className="text-[12px] font-medium text-ws-text">No stashes yet</p>
            <p className="mt-1 text-[11px] text-ws-text-muted">
              Save your in-progress edits here and restore them anytime.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {stashes.map((stash) => {
              const busy = busyId === stash._id;
              return (
                <li
                  key={stash._id}
                  className="rounded-md border border-ws-border-subtle bg-ws-bg/70 p-2.5"
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium text-ws-text">
                        {stash.name}
                      </p>
                      <p className="mt-0.5 text-[10px] text-ws-text-muted">
                        {stash.fileCount} files · {formatCreatedAt(stash.createdAt)}
                      </p>
                    </div>
                    {busy ? (
                      <Loader2Icon className="mt-0.5 size-3.5 animate-spin text-ws-text-muted" />
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          title="Apply stash"
                          className="size-6 rounded-sm text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
                          onClick={() => void onApply(stash._id)}
                        >
                          <RotateCcwIcon className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          title="Delete stash"
                          className="size-6 rounded-sm text-ws-text-muted hover:bg-ws-hover hover:text-ws-danger-soft"
                          onClick={() => void onDelete(stash._id, stash.name)}
                        >
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
