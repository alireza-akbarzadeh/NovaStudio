import type { Id } from "@/convex/_generated/dataModel";

import type { VisibleTreeItem } from "../components/file-tree/types";

export type TreeSelectModifiers = {
  shiftKey?: boolean;
  modKey?: boolean;
};

export function computeTreeSelection(
  clickedId: Id<"projectFiles">,
  visibleItems: VisibleTreeItem[],
  currentSelected: Set<Id<"projectFiles">>,
  anchorId: Id<"projectFiles"> | null,
  modifiers: TreeSelectModifiers,
): {
  selectedIds: Set<Id<"projectFiles">>;
  anchorId: Id<"projectFiles">;
  focusedId: Id<"projectFiles">;
} {
  if (modifiers.shiftKey && anchorId) {
    const from = visibleItems.findIndex((item) => item.node.id === anchorId);
    const to = visibleItems.findIndex((item) => item.node.id === clickedId);
    if (from >= 0 && to >= 0) {
      const start = Math.min(from, to);
      const end = Math.max(from, to);
      const next = new Set<Id<"projectFiles">>();
      for (let i = start; i <= end; i++) {
        next.add(visibleItems[i]!.node.id);
      }
      return {
        selectedIds: next,
        anchorId,
        focusedId: clickedId,
      };
    }
  }

  if (modifiers.modKey) {
    const next = new Set(currentSelected);
    if (next.has(clickedId)) {
      next.delete(clickedId);
    } else {
      next.add(clickedId);
    }
    if (next.size === 0) {
      next.add(clickedId);
    }
    return {
      selectedIds: next,
      anchorId: clickedId,
      focusedId: clickedId,
    };
  }

  return {
    selectedIds: new Set([clickedId]),
    anchorId: clickedId,
    focusedId: clickedId,
  };
}

export function extendTreeSelection(
  direction: "up" | "down",
  visibleItems: VisibleTreeItem[],
  focusedId: Id<"projectFiles"> | null,
  currentSelected: Set<Id<"projectFiles">>,
  anchorId: Id<"projectFiles"> | null,
): {
  selectedIds: Set<Id<"projectFiles">>;
  anchorId: Id<"projectFiles">;
  focusedId: Id<"projectFiles">;
} | null {
  if (visibleItems.length === 0) return null;

  const currentIndex = focusedId
    ? visibleItems.findIndex((item) => item.node.id === focusedId)
    : -1;
  const nextIndex =
    direction === "down"
      ? Math.min(
          currentIndex < 0 ? 0 : currentIndex + 1,
          visibleItems.length - 1,
        )
      : Math.max(currentIndex < 0 ? visibleItems.length - 1 : currentIndex - 1, 0);

  const nextId = visibleItems[nextIndex]!.node.id;
  const rangeAnchor = anchorId ?? focusedId ?? nextId;
  const from = visibleItems.findIndex((item) => item.node.id === rangeAnchor);
  const to = nextIndex;
  if (from < 0) {
    return {
      selectedIds: new Set([nextId]),
      anchorId: nextId,
      focusedId: nextId,
    };
  }

  const start = Math.min(from, to);
  const end = Math.max(from, to);
  const next = new Set(currentSelected);
  // Replace with contiguous range from anchor (VS Code behavior for shift+arrow)
  next.clear();
  for (let i = start; i <= end; i++) {
    next.add(visibleItems[i]!.node.id);
  }

  return {
    selectedIds: next,
    anchorId: rangeAnchor,
    focusedId: nextId,
  };
}

/** Paths in selection that are not under another selected folder. */
export function pruneNestedSelectedPaths(
  selected: Array<{ path: string; kind: "file" | "folder" }>,
): string[] {
  const folderPaths = selected
    .filter((item) => item.kind === "folder")
    .map((item) => item.path)
    .sort((a, b) => a.length - b.length);

  const roots: string[] = [];
  for (const item of selected) {
    const coveredByFolder = folderPaths.some(
      (folderPath) =>
        item.path !== folderPath && item.path.startsWith(`${folderPath}/`),
    );
    if (!coveredByFolder) {
      roots.push(item.path);
    }
  }
  return roots;
}
