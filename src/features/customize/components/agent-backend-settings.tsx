"use client";

import { useMutation, useQuery } from "convex/react";
import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import {
  AGENT_BACKEND_LABELS,
  AGENT_BACKENDS,
  isAgentBackend,
  type AgentBackend,
} from "@/lib/ai/agent-backends";
import { cn } from "@/lib/utils";

export function AgentBackendSettingsPanel({ className }: { className?: string }) {
  const prefs = useQuery(api.userPreferences.get, {});
  const upsert = useMutation(api.userPreferences.upsertAgentBackend);
  const [gatewayUrl, setGatewayUrl] = useState("");
  const [agentId, setAgentId] = useState("");
  const [saving, setSaving] = useState(false);

  const backend: AgentBackend =
    prefs?.agentBackend && isAgentBackend(prefs.agentBackend)
      ? prefs.agentBackend
      : "novastudio";

  useEffect(() => {
    setGatewayUrl(prefs?.agentBackendConfig?.openclawGatewayUrl ?? "");
    setAgentId(prefs?.agentBackendConfig?.openclawAgentId ?? "");
  }, [prefs?.agentBackendConfig?.openclawAgentId, prefs?.agentBackendConfig?.openclawGatewayUrl]);

  const saveOpenClawConfig = async () => {
    setSaving(true);
    try {
      await upsert({
        agentBackend: backend,
        agentBackendConfig: {
          openclawGatewayUrl: gatewayUrl.trim() || undefined,
          openclawAgentId: agentId.trim() || undefined,
        },
      });
      toast.success("Agent backend settings saved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save settings",
      );
    } finally {
      setSaving(false);
    }
  };

  const selectBackend = async (next: AgentBackend) => {
    try {
      await upsert({
        agentBackend: next,
        agentBackendConfig: prefs?.agentBackendConfig,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update backend",
      );
    }
  };

  if (prefs === undefined) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-ws-text-muted", className)}>
        <Loader2Icon className="size-4 animate-spin" />
        Loading agent settings…
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-sm font-semibold text-ws-text">Agent backends</h3>
        <p className="mt-1 text-xs text-ws-text-muted">
          Choose which engine runs background agents from the AI sidebar. External
          CLIs run on the Inngest worker — install Cursor CLI or OpenClaw there,
          or point OpenClaw at your Gateway URL.
        </p>
      </div>

      <div className="grid gap-2">
        {AGENT_BACKENDS.map((item) => {
          const meta = AGENT_BACKEND_LABELS[item];
          const active = backend === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => void selectBackend(item)}
              className={cn(
                "rounded-lg border px-3 py-2 text-left transition-colors",
                active
                  ? "border-ws-accent/40 bg-ws-accent/10"
                  : "border-ws-border-subtle bg-ws-panel/40 hover:bg-ws-hover",
              )}
            >
              <p className="text-sm font-medium text-ws-text">{meta.label}</p>
              <p className="text-xs text-ws-text-muted">{meta.description}</p>
            </button>
          );
        })}
      </div>

      {(backend === "openclaw" || backend === "cursor-cli" || backend === "cursor-cloud") && (
        <div className="space-y-3 rounded-lg border border-ws-border-subtle bg-ws-panel/40 p-3">
          {backend === "openclaw" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="openclaw-gateway" className="text-ws-text-secondary">
                  OpenClaw Gateway URL
                </Label>
                <Input
                  id="openclaw-gateway"
                  value={gatewayUrl}
                  onChange={(event) => setGatewayUrl(event.target.value)}
                  placeholder="http://127.0.0.1:18789"
                  className="border-ws-border bg-ws-bg"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="openclaw-agent" className="text-ws-text-secondary">
                  Agent id (optional)
                </Label>
                <Input
                  id="openclaw-agent"
                  value={agentId}
                  onChange={(event) => setAgentId(event.target.value)}
                  placeholder="coding"
                  className="border-ws-border bg-ws-bg"
                />
              </div>
            </>
          ) : (
            <p className="text-xs text-ws-text-muted">
              Set <code className="rounded bg-ws-bg px-1">CURSOR_API_KEY</code> on
              the worker. Install with{" "}
              <code className="rounded bg-ws-bg px-1">
                curl https://cursor.com/install -fsS | bash
              </code>
              .
            </p>
          )}

          <Button
            type="button"
            size="sm"
            disabled={saving}
            onClick={() => void saveOpenClawConfig()}
          >
            {saving ? "Saving…" : "Save backend config"}
          </Button>
        </div>
      )}

      <div className="rounded-lg border border-ws-border-subtle bg-ws-panel/40 p-3 text-xs text-ws-text-muted">
        <p className="font-medium text-ws-text">Connect local CLI</p>
        <p className="mt-1">
          Start a background run from the AI sidebar, then click{" "}
          <strong className="font-medium text-ws-text">Connect CLI</strong> on the
          active run card. The wizard copies{" "}
          <code className="rounded bg-ws-bg px-1">mcp.json</code>, curl tests, and
          Cursor / OpenClaw commands for your machine.
        </p>
      </div>
    </div>
  );
}
