import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { toast } from "sonner";

import type { Doc, Id } from "@/convex/_generated/dataModel";

type TreeClipboard = {
  mode: "cut" | "copy";
  projectId: string;
  path: string;
};

type PasteDeps = {
  projectId: string;
  pathname: string;
  router: AppRouterInstance;
  files: Doc<"projectFiles">[] | undefined;
  treeClipboard: TreeClipboard;
  moveFile: (args: {
    projectId: Id<"projects">;
    path: string;
    newParentId?: Id<"projectFiles">;
  }) => Promise<string>;
  duplicateFile: (args: {
    projectId: Id<"projects">;
    path: string;
    targetParentId?: Id<"projectFiles"> | null;
  }) => Promise<{ path: string }>;
  clearTreeClipboard: () => void;
  setOpenFolderIds: React.Dispatch<
    React.SetStateAction<Set<Id<"projectFiles">>>
  >;
};

export async function pasteIntoFolder(
  targetParentId: Id<"projectFiles"> | undefined,
  deps: PasteDeps,
) {
  const {
    projectId,
    pathname,
    router,
    files,
    treeClipboard,
    moveFile,
    duplicateFile,
    clearTreeClipboard,
    setOpenFolderIds,
  } = deps;

  try {
    if (treeClipboard.mode === "cut") {
      const newPath = await moveFile({
        projectId: projectId as Id<"projects">,
        path: treeClipboard.path,
        newParentId: targetParentId,
      });
      clearTreeClipboard();

      const activePath = pathname.match(/\/files\/(.+)$/)?.[1];
      if (
        activePath &&
        (decodeURIComponent(activePath) === treeClipboard.path ||
          decodeURIComponent(activePath).startsWith(`${treeClipboard.path}/`))
      ) {
        const suffix = decodeURIComponent(activePath).slice(
          treeClipboard.path.length,
        );
        router.push(`/projects/${projectId}/files/${newPath}${suffix}`);
      }

      toast.success("Moved");
    } else {
      const sourceKind = files?.find(
        (file) => file.path === treeClipboard.path,
      )?.kind;
      const result = await duplicateFile({
        projectId: projectId as Id<"projects">,
        path: treeClipboard.path,
        targetParentId: targetParentId ?? null,
      });
      toast.success("Pasted");
      if (sourceKind === "file") {
        router.push(`/projects/${projectId}/files/${result.path}`);
      }
    }

    if (targetParentId) {
      setOpenFolderIds((current) => {
        if (current.has(targetParentId)) return current;
        const next = new Set(current);
        next.add(targetParentId);
        return next;
      });
    }
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Failed to paste");
  }
}

export async function duplicateTreeItem(
  path: string,
  projectId: string,
  files: Doc<"projectFiles">[] | undefined,
  duplicateFile: (args: {
    projectId: Id<"projects">;
    path: string;
  }) => Promise<{ path: string }>,
  router: AppRouterInstance,
) {
  try {
    const sourceKind = files?.find((file) => file.path === path)?.kind;
    const result = await duplicateFile({
      projectId: projectId as Id<"projects">,
      path,
    });
    toast.success("Duplicated");
    if (sourceKind === "file") {
      router.push(`/projects/${projectId}/files/${result.path}`);
    }
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Failed to duplicate",
    );
  }
}
