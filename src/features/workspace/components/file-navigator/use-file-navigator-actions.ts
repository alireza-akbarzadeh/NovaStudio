"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useProjectAccess } from "@/features/projects/hooks/use-project-access";
import {
  useCreateProjectFile,
  useRenameProjectFile,
} from "@/features/workspace/hooks/use-project-files";
import { pushRecentFilePath } from "@/features/workspace/lib/recent-files";

import { fileBaseName, normalizeNavigatorPath } from "./file-navigator-utils";

function resolveParentId(
  metadata: Doc<"projectFiles">[] | undefined,
  parentPath: string,
) {
  const normalized = normalizeNavigatorPath(parentPath);
  if (!normalized) return undefined;
  return metadata?.find(
    (item) => item.kind === "folder" && item.path === normalized,
  )?._id;
}

export function useFileNavigatorActions(projectId: string) {
  const access = useProjectAccess(projectId);
  const canEdit = access?.canEdit ?? false;
  const createFileMutation = useCreateProjectFile();
  const renameFileMutation = useRenameProjectFile();
  const router = useRouter();
  const pathname = usePathname();

  const createItem = useCallback(
    async (
      metadata: Doc<"projectFiles">[] | undefined,
      options: {
        name: string;
        kind: "file" | "folder";
        parentPath: string;
      },
    ) => {
      const trimmed = options.name.trim();
      if (!trimmed) return null;

      const parentId = resolveParentId(metadata, options.parentPath);
      const usesNestedPath = trimmed.includes("/");

      const created = await createFileMutation({
        projectId: projectId as Id<"projects">,
        name: trimmed,
        parentId: usesNestedPath ? undefined : parentId,
        kind: options.kind,
        content: options.kind === "file" ? "" : undefined,
      });

      if (options.kind === "file") {
        pushRecentFilePath(projectId, created.path);
      }

      return created;
    },
    [createFileMutation, projectId],
  );

  const renameItem = useCallback(
    async (
      options: {
        path: string;
        newName: string;
        kind: "file" | "folder";
      },
    ) => {
      const name = options.newName.trim();
      const currentName = fileBaseName(options.path);
      if (!name || name === currentName) return null;

      const newPath = await renameFileMutation({
        projectId: projectId as Id<"projects">,
        path: options.path,
        name,
      });

      if (options.kind === "file") {
        const oldHref = `/projects/${projectId}/files/${options.path}`;
        if (pathname === oldHref) {
          router.push(`/projects/${projectId}/files/${newPath}`);
        }
        pushRecentFilePath(projectId, newPath);
      }

      return newPath;
    },
    [pathname, projectId, renameFileMutation, router],
  );

  return {
    canEdit,
    createItem,
    renameItem,
  };
}

export async function runNavigatorCreate(
  createItem: ReturnType<typeof useFileNavigatorActions>["createItem"],
  metadata: Doc<"projectFiles">[] | undefined,
  options: {
    name: string;
    kind: "file" | "folder";
    parentPath: string;
  },
  onFileCreated?: (path: string) => void,
) {
  try {
    const created = await createItem(metadata, options);
    if (!created) return false;

    if (options.kind === "file") {
      toast.success(`Created ${fileBaseName(created.path)}`);
      onFileCreated?.(created.path);
    } else {
      toast.success(`Created folder ${fileBaseName(created.path)}`);
    }
    return true;
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Failed to create item",
    );
    return false;
  }
}

export async function runNavigatorRename(
  renameItem: ReturnType<typeof useFileNavigatorActions>["renameItem"],
  options: {
    path: string;
    newName: string;
    kind: "file" | "folder";
  },
) {
  try {
    const newPath = await renameItem(options);
    if (!newPath) return false;
    toast.success("Renamed");
    return true;
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Failed to rename",
    );
    return false;
  }
}

/** Parse cmdk item value back to a project path + kind. */
export function parseNavigatorSelection(value: string): {
  path: string;
  kind: "file" | "folder";
} | null {
  if (!value) return null;

  const rules: Array<[RegExp, "file" | "folder"]> = [
    [/^file:(.+)$/, "file"],
    [/^browse-file (.+)$/, "file"],
    [/^recent:(.+)$/, "file"],
    [/^open (.+)$/, "file"],
    [/^folder:(.+)$/, "folder"],
  ];

  for (const [pattern, kind] of rules) {
    const match = value.match(pattern);
    if (match?.[1]) {
      return { path: match[1], kind };
    }
  }

  return null;
}

export function resolveCreatePath(
  query: string,
  browsePath: string,
  metadata: Doc<"projectFiles">[] | undefined,
) {
  const trimmed = normalizeNavigatorPath(query.trim());
  if (!trimmed) return null;

  const fullPath = browsePath ? `${browsePath}/${trimmed}` : trimmed;
  const exists = metadata?.some((item) => item.path === fullPath);
  if (exists) return null;

  if (trimmed.includes("/") || trimmed.includes(".")) {
    return fullPath;
  }

  return browsePath ? fullPath : null;
}

export function resolveCreateFolderPath(
  query: string,
  browsePath: string,
  metadata: Doc<"projectFiles">[] | undefined,
) {
  const trimmed = normalizeNavigatorPath(query.trim().replace(/\/+$/, ""));
  if (!trimmed) return null;

  const fullPath = browsePath ? `${browsePath}/${trimmed}` : trimmed;
  if (metadata?.some((item) => item.path === fullPath)) return null;

  return fullPath;
}
