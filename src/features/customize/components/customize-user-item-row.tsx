"use client";

import {
  BotIcon,
  ClipboardListIcon,
  Loader2Icon,
  MessageSquarePlusIcon,
  PencilIcon,
  Trash2Icon,
  WebhookIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { Id } from "@/convex/_generated/dataModel";
import type {
  CustomizeUserItem,
  CustomizeUserItemKind,
} from "@/features/customize/lib/customize-user-items";

const KIND_ICONS: Record<
  CustomizeUserItemKind,
  typeof BotIcon
> = {
  subagent: BotIcon,
  hook: WebhookIcon,
  command: MessageSquarePlusIcon,
  rule: ClipboardListIcon,
};

type CustomizeUserItemRowProps = {
  item: CustomizeUserItem;
  onEdit: (item: CustomizeUserItem) => void;
  onRemove: (id: Id<"userCustomizeItems">) => Promise<void>;
  onToggleEnabled: (id: Id<"userCustomizeItems">, enabled: boolean) => Promise<void>;
  onInsertInChat?: (content: string) => void;
};

export function CustomizeUserItemRow({
  item,
  onEdit,
  onRemove,
  onToggleEnabled,
  onInsertInChat,
}: CustomizeUserItemRowProps) {
  const [busy, setBusy] = useState(false);
  const Icon = KIND_ICONS[item.kind];

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-ws-hover text-ws-text-muted">
        <Icon className="size-4" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-mono text-[12px] font-medium text-ws-text">
            {item.name}
          </p>
          {item.kind === "hook" && item.hookPhase ? (
            <span className="rounded-full bg-ws-accent/15 px-1.5 py-0.5 text-[9px] font-medium uppercase text-ws-accent">
              {item.hookPhase}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-ws-text-muted">
          {item.description}
        </p>
      </div>

      {item.kind === "command" && onInsertInChat ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 shrink-0 rounded-full border-ws-border-subtle bg-transparent px-2.5 text-[10px]"
          disabled={busy}
          onClick={() => onInsertInChat(item.content)}
        >
          Insert in chat
        </Button>
      ) : null}

      <Switch
        checked={item.enabled}
        disabled={busy}
        onCheckedChange={(checked) => {
          setBusy(true);
          void onToggleEnabled(item._id as Id<"userCustomizeItems">, checked).finally(
            () => setBusy(false),
          );
        }}
        aria-label={`Enable ${item.name}`}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="size-7 text-ws-text-muted hover:text-ws-text"
        disabled={busy}
        aria-label={`Edit ${item.name}`}
        onClick={() => onEdit(item)}
      >
        <PencilIcon className="size-3.5" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="size-7 text-ws-text-muted hover:text-red-400"
        disabled={busy}
        aria-label={`Remove ${item.name}`}
        onClick={() => {
          setBusy(true);
          void onRemove(item._id as Id<"userCustomizeItems">)
            .then(() => toast.success(`Removed “${item.name}”`))
            .catch((error: unknown) =>
              toast.error(
                error instanceof Error ? error.message : "Could not remove item",
              ),
            )
            .finally(() => setBusy(false));
        }}
      >
        {busy ? (
          <Loader2Icon className="size-3.5 animate-spin" />
        ) : (
          <Trash2Icon className="size-3.5" />
        )}
      </Button>
    </div>
  );
}
