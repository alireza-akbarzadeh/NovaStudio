"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
  siblingNames,
  suggestUniqueName,
} from "@/features/workspace/lib/unique-name";

import { PendingCreateRow } from "./pending-create-row";
import type { PendingCreate } from "./types";

export function createPendingCreateRenderer(
  pendingCreate: PendingCreate | null,
  files: Doc<"projectFiles">[] | undefined,
  commitCreate: (name: string) => void,
  cancelCreate: () => void,
) {
  function PendingCreateSlot(
    parentId: Id<"projectFiles"> | undefined,
    depth: number,
  ) {
    if (!pendingCreate || pendingCreate.parentId !== parentId) {
      return null;
    }

    const defaultName = suggestUniqueName(
      siblingNames(files ?? [], parentId),
      pendingCreate.kind === "file" ? "untitled.ts" : "new-folder",
    );

    return (
      <PendingCreateRow
        key="pending-create"
        depth={depth}
        kind={pendingCreate.kind}
        defaultName={defaultName}
        onCommit={(name) => void commitCreate(name)}
        onCancel={cancelCreate}
      />
    );
  }

  return PendingCreateSlot;
}
