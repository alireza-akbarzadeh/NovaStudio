"use client";

import { Loader2Icon, ServerIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { UserMcpServerRow } from "@/features/customize/hooks/use-user-mcp-servers";

type CustomMcpServerRowProps = {
  server: UserMcpServerRow;
  onRemove: (id: UserMcpServerRow["_id"]) => Promise<void>;
  onToggleEnabled: (id: UserMcpServerRow["_id"], enabled: boolean) => Promise<void>;
};

export function CustomMcpServerRow({
  server,
  onRemove,
  onToggleEnabled,
}: CustomMcpServerRowProps) {
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-ws-hover text-ws-text-muted">
        <ServerIcon className="size-4" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-medium text-ws-text">
            {server.name}
          </p>
          <span className="rounded-full bg-ws-accent/15 px-1.5 py-0.5 text-[9px] font-medium uppercase text-ws-accent">
            {server.transport}
          </span>
          {server.verified ? (
            <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400">
              Connected
            </span>
          ) : null}
        </div>
        <p className="truncate font-mono text-[10px] text-ws-text-muted">
          {server.urlHost}
        </p>
      </div>

      <Switch
        checked={server.enabled}
        disabled={busy}
        onCheckedChange={(checked) => {
          setBusy(true);
          void onToggleEnabled(server._id, checked).finally(() => setBusy(false));
        }}
        aria-label={`Enable ${server.name}`}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="size-7 text-ws-text-muted hover:text-red-400"
        disabled={busy}
        aria-label={`Remove ${server.name}`}
        onClick={() => {
          setBusy(true);
          void onRemove(server._id)
            .then(() => toast.success(`Removed “${server.name}”`))
            .catch((error: unknown) =>
              toast.error(
                error instanceof Error ? error.message : "Could not remove server",
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

export function CustomMcpServersSection({
  servers,
  ready,
  onRemove,
  onToggleEnabled,
  onAdd,
}: {
  servers: UserMcpServerRow[];
  ready: boolean;
  onRemove: (id: UserMcpServerRow["_id"]) => Promise<void>;
  onToggleEnabled: (id: UserMcpServerRow["_id"], enabled: boolean) => Promise<void>;
  onAdd: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-ws-border-subtle bg-ws-panel/40">
      <div className="flex items-center justify-between border-b border-ws-border-subtle px-4 py-3">
        <p className="text-[12px] text-ws-text-muted">
          Your MCP servers{" "}
          {!ready ? (
            <Loader2Icon className="ml-1 inline size-3 animate-spin" />
          ) : (
            <span className="text-ws-text">{servers.length}</span>
          )}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 rounded-full border-ws-border-subtle bg-transparent px-3 text-[11px]"
          onClick={onAdd}
        >
          Add MCP server
        </Button>
      </div>

      {servers.length === 0 ? (
        <div className="px-4 py-8 text-center text-[12px] text-ws-text-muted">
          {ready
            ? "Connect a remote MCP server by URL — useful for team tools and custom agents."
            : "Loading MCP servers…"}
        </div>
      ) : (
        <ul className="divide-y divide-ws-border-subtle/70">
          {servers.map((server) => (
            <li key={server._id}>
              <CustomMcpServerRow
                server={server}
                onRemove={onRemove}
                onToggleEnabled={onToggleEnabled}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
