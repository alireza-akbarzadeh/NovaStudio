"use client";

import { Loader2Icon } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { CustomizeUserItemDialog } from "@/features/customize/components/customize-user-item-dialog";
import { CustomizeUserItemRow } from "@/features/customize/components/customize-user-item-row";
import { useUserCustomizeItems } from "@/features/customize/hooks/use-user-customize-items";
import {
  CUSTOMIZE_USER_ITEM_META,
  type CustomizeUserItem,
  type CustomizeUserItemKind,
} from "@/features/customize/lib/customize-user-items";
import { useEditorTabs } from "@/features/workspace/hooks/use-editor-tabs";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";

type CustomizeUserItemsPanelProps = {
  projectId: string;
  kind: CustomizeUserItemKind;
  query: string;
};

export function CustomizeUserItemsPanel({
  projectId,
  kind,
  query,
}: CustomizeUserItemsPanelProps) {
  const meta = CUSTOMIZE_USER_ITEM_META[kind];
  const { byKind, ready, upsert, remove, setEnabled } = useUserCustomizeItems();
  const { openTab } = useEditorTabs(projectId);
  const insertAiComposerText = useWorkspaceStore((s) => s.insertAiComposerText);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CustomizeUserItem | null>(null);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = byKind[kind];
    if (!q) return rows;
    return rows.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q),
    );
  }, [byKind, kind, query]);

  const openCreate = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };

  const openEdit = (item: CustomizeUserItem) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const insertInChat = (content: string) => {
    openTab({ kind: "welcome" });
    insertAiComposerText(content);
  };

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-ws-border-subtle bg-ws-panel/40">
        <div className="flex items-center justify-between border-b border-ws-border-subtle px-4 py-3">
          <p className="text-[12px] text-ws-text-muted">
            Your {meta.label.toLowerCase()}{" "}
            {!ready ? (
              <Loader2Icon className="ml-1 inline size-3 animate-spin" />
            ) : (
              <span className="text-ws-text">{items.length}</span>
            )}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 rounded-full border-ws-border-subtle bg-transparent px-3 text-[11px]"
            onClick={openCreate}
          >
            {meta.addLabel}
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="px-4 py-10 text-center text-[12px] text-ws-text-muted">
            {ready
              ? `Create ${meta.label.toLowerCase()} to extend NovaStudio AI. Enabled items are injected into chat automatically${
                  kind === "command" ? ", or insert commands manually." : "."
                }`
              : `Loading ${meta.label.toLowerCase()}…`}
          </div>
        ) : (
          <ul className="divide-y divide-ws-border-subtle/70">
            {items.map((item) => (
              <li key={item._id}>
                <CustomizeUserItemRow
                  item={item}
                  onEdit={openEdit}
                  onRemove={remove}
                  onToggleEnabled={setEnabled}
                  onInsertInChat={kind === "command" ? insertInChat : undefined}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <CustomizeUserItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        kind={kind}
        item={editingItem}
        onSave={upsert}
      />
    </>
  );
}
