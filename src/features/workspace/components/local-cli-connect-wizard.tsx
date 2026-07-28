"use client";

import { CheckIcon, CopyIcon, Loader2Icon, PlugIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  buildBridgeEnvSnippet,
  buildBridgeReadme,
  buildCursorCliSnippet,
  buildCurlTestSnippet,
  buildMcpJson,
  buildOpenClawSnippet,
  type LocalCliBridgeConfig,
} from "@/lib/ai/agent-bridge/local-cli-config";
import { cn } from "@/lib/utils";

type LocalCliConnectWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: LocalCliBridgeConfig | null;
  className?: string;
};

function CopyBlock({
  label,
  value,
  language = "bash",
}: {
  label: string;
  value: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`Copied ${label}`);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }, [label, value]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-ws-text-secondary">{label}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 gap-1 px-2 text-[10px] text-ws-text-muted"
          onClick={() => void copy()}
        >
          {copied ? (
            <CheckIcon className="size-3 text-emerald-400" />
          ) : (
            <CopyIcon className="size-3" />
          )}
          Copy
        </Button>
      </div>
      <pre
        className="max-h-48 overflow-auto rounded-lg border border-ws-border-subtle bg-ws-bg p-3 text-[10px] leading-relaxed text-ws-text"
        data-language={language}
      >
        <code>{value}</code>
      </pre>
    </div>
  );
}

export function LocalCliConnectWizard({
  open,
  onOpenChange,
  config,
}: LocalCliConnectWizardProps) {
  const [testing, setTesting] = useState(false);
  const [testOk, setTestOk] = useState<boolean | null>(null);

  const snippets = useMemo(() => {
    if (!config) return null;
    return {
      readme: buildBridgeReadme(config),
      env: buildBridgeEnvSnippet(config),
      mcpJson: buildMcpJson(config),
      curl: buildCurlTestSnippet(config),
      cursor: buildCursorCliSnippet(config),
      openclaw: buildOpenClawSnippet(config),
    };
  }, [config]);

  const testConnection = useCallback(async () => {
    if (!config) return;
    setTesting(true);
    setTestOk(null);
    try {
      const url = `${config.origin.replace(/\/$/, "")}/api/mcp/workspace/${config.runId}`;
      const response = await fetch(url, {
        headers: { "x-agent-job-token": config.jobToken },
      });
      const payload = (await response.json()) as { tools?: unknown[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? `HTTP ${response.status}`);
      }
      if (!Array.isArray(payload.tools) || payload.tools.length === 0) {
        throw new Error("Bridge responded but no tools were returned");
      }
      setTestOk(true);
      toast.success("Bridge connection OK", {
        description: `${payload.tools.length} tools available`,
      });
    } catch (error) {
      setTestOk(false);
      toast.error(
        error instanceof Error ? error.message : "Bridge test failed",
      );
    } finally {
      setTesting(false);
    }
  }, [config]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto border-ws-border bg-ws-panel">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-ws-text">
            <PlugIcon className="size-4 text-ws-accent-soft" />
            Connect local CLI
          </DialogTitle>
          <DialogDescription className="text-ws-text-muted">
            Wire Cursor CLI, OpenClaw, or any HTTP client to this cloud project
            while the background run is active. File writes are queued for review
            in NovaStudio.
          </DialogDescription>
        </DialogHeader>

        {!config || !snippets ? (
          <p className="text-sm text-ws-text-muted">
            Start a background run first, then open this wizard from the runs
            panel.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-ws-border-subtle bg-ws-bg/60 p-3 text-[11px] text-ws-text-muted">
              <p>
                <span className="font-medium text-ws-text">Run:</span>{" "}
                {config.projectName ?? config.runId}
              </p>
              <p className="mt-1 break-all">
                <span className="font-medium text-ws-text">Endpoint:</span>{" "}
                {config.origin}/api/mcp/workspace/{config.runId}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-ws-border-subtle"
                disabled={testing}
                onClick={() => void testConnection()}
              >
                {testing ? (
                  <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <PlugIcon className="mr-1.5 size-3.5" />
                )}
                Test connection
              </Button>
              {testOk === true ? (
                <span className="text-[11px] text-emerald-400">Connected</span>
              ) : null}
              {testOk === false ? (
                <span className="text-[11px] text-orange-400">Failed — check token & run status</span>
              ) : null}
            </div>

            <Tabs defaultValue="cursor">
              <TabsList className="bg-ws-bg">
                <TabsTrigger value="cursor" className="text-xs">
                  Cursor CLI
                </TabsTrigger>
                <TabsTrigger value="openclaw" className="text-xs">
                  OpenClaw
                </TabsTrigger>
                <TabsTrigger value="curl" className="text-xs">
                  curl test
                </TabsTrigger>
                <TabsTrigger value="mcp" className="text-xs">
                  mcp.json
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cursor" className="mt-3 space-y-3">
                <CopyBlock label="Cursor CLI setup" value={snippets.cursor} />
              </TabsContent>
              <TabsContent value="openclaw" className="mt-3 space-y-3">
                <CopyBlock label="OpenClaw command" value={snippets.openclaw} />
              </TabsContent>
              <TabsContent value="curl" className="mt-3 space-y-3">
                <CopyBlock label="curl — test bridge" value={snippets.curl} />
                <CopyBlock label="Shell env vars" value={snippets.env} />
              </TabsContent>
              <TabsContent value="mcp" className="mt-3 space-y-3">
                <CopyBlock
                  label="mcp.json"
                  value={snippets.mcpJson}
                  language="json"
                />
                <p className="text-[10px] text-ws-text-muted">
                  Save to <code className="rounded bg-ws-bg px-1">.cursor/mcp.json</code>{" "}
                  if your Cursor build supports HTTP MCP servers with custom headers.
                </p>
              </TabsContent>
            </Tabs>

            <CopyBlock label="Quick reference" value={snippets.readme} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

type LocalCliConnectButtonProps = {
  onClick: () => void;
  className?: string;
  size?: "sm" | "default";
};

export function LocalCliConnectButton({
  onClick,
  className,
  size = "sm",
}: LocalCliConnectButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      className={cn(
        "h-6 gap-1 px-2 text-[10px] text-ws-text-muted hover:text-ws-text",
        className,
      )}
      onClick={onClick}
    >
      <PlugIcon className="size-3" />
      Connect CLI
    </Button>
  );
}
