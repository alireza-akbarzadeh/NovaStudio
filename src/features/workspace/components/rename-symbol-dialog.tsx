"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Loader2Icon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useUpdateProjectFileContent,
} from "@/features/workspace/hooks/use-project-files";
import {
  loadFileContentDraft,
  saveFileContentDraft,
} from "@/features/workspace/lib/file-content-drafts";
import { applyRenameToFiles } from "@/features/workspace/lib/symbol-refactor";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";

type RenameSymbolDialogProps = {
  projectId: string;
};

export function RenameSymbolDialog({ projectId }: RenameSymbolDialogProps) {
  const request = useWorkspaceStore((s) => s.renameSymbolRequest);
  const closeRenameSymbolDialog = useWorkspaceStore(
    (s) => s.closeRenameSymbolDialog,
  );
  const updateContent = useUpdateProjectFileContent();
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const paths = useMemo(() => {
    if (!request) return [];
    return [...new Set(request.references.map((ref) => ref.path))];
  }, [request]);

  const contents = useQuery(
    api.projectFiles.getContentsByPaths,
    request && paths.length > 0
      ? {
          projectId: projectId as Id<"projects">,
          paths,
        }
      : "skip",
  );

  useEffect(() => {
    if (request) {
      setNewName(request.symbolName);
    }
  }, [request]);

  const onOpenChange = (open: boolean) => {
    if (!open && !saving) {
      closeRenameSymbolDialog();
    }
  };

  const onRename = async () => {
    if (!request) return;
    const trimmed = newName.trim();
    if (!trimmed || trimmed === request.symbolName) {
      closeRenameSymbolDialog();
      return;
    }

    setSaving(true);
    try {
      const files = paths.map((path) => {
        const draft = loadFileContentDraft(projectId, path);
        const loaded = contents?.find((row) => row.path === path);
        const serverContent = loaded?.content ?? "";
        const content = draft?.content ?? serverContent;
        return { path, content };
      });

      const updates = applyRenameToFiles(
        files,
        request.references,
        trimmed,
      );

      await Promise.all(
        [...updates.entries()].map(async ([path, content]) => {
          saveFileContentDraft(projectId, path, content);
          await updateContent({
            projectId: projectId as Id<"projects">,
            path,
            content,
          });
        }),
      );

      toast.success(`Renamed to ${trimmed}`, {
        description: `Updated ${updates.size} file${updates.size === 1 ? "" : "s"}.`,
      });
      closeRenameSymbolDialog();
    } catch (error) {
      toast.error("Rename failed", {
        description:
          error instanceof Error ? error.message : "Could not rename symbol.",
      });
    } finally {
      setSaving(false);
    }
  };

  const loadingContents =
    Boolean(request) && paths.length > 0 && contents === undefined;

  return (
    <Dialog open={request !== null} onOpenChange={onOpenChange}>
      <DialogContent className="border-ws-border-subtle bg-ws-panel sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-ws-text">Rename symbol</DialogTitle>
          <DialogDescription className="text-ws-text-muted">
            Rename{" "}
            <code className="rounded bg-ws-hover px-1 py-0.5 font-mono text-[11px] text-ws-text">
              {request?.symbolName}
            </code>{" "}
            across {paths.length} file{paths.length === 1 ? "" : "s"}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 py-1">
          <Label htmlFor="rename-symbol-input" className="text-ws-text">
            New name
          </Label>
          <Input
            id="rename-symbol-input"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            disabled={saving || loadingContents}
            autoFocus
            className="border-ws-border-subtle bg-ws-bg font-mono text-[12px] text-ws-text"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void onRename();
              }
            }}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            disabled={saving}
            onClick={() => closeRenameSymbolDialog()}
            className="text-ws-text-muted"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={saving || loadingContents || !newName.trim()}
            onClick={() => void onRename()}
            className="gap-1.5"
          >
            {saving || loadingContents ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : null}
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
