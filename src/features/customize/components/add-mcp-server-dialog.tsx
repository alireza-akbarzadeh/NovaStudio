"use client";

import { Loader2Icon } from "lucide-react";
import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";

type AddMcpServerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddMcpServerDialog({
  open,
  onOpenChange,
}: AddMcpServerDialogProps) {
  const connect = useAction(api.mcpServerActions.connect);
  const [name, setName] = useState("");
  const [transport, setTransport] = useState<"sse" | "http">("sse");
  const [url, setUrl] = useState("");
  const [authHeader, setAuthHeader] = useState("");
  const [connecting, setConnecting] = useState(false);

  const reset = () => {
    setName("");
    setTransport("sse");
    setUrl("");
    setAuthHeader("");
  };

  const onOpenChangeInternal = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const onSubmit = async () => {
    setConnecting(true);
    try {
      await connect({
        name,
        transport,
        url,
        authHeader: authHeader.trim() || undefined,
      });
      toast.success(`Connected MCP server “${name.trim()}”`);
      onOpenChangeInternal(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not connect MCP server",
      );
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChangeInternal}>
      <DialogContent className="border-ws-border-subtle bg-ws-panel text-ws-text sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add MCP server</DialogTitle>
          <DialogDescription className="text-ws-text-muted">
            Connect a remote MCP endpoint (SSE or streamable HTTP). Stdio servers
            are not supported in the cloud IDE.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="mcp-name" className="text-ws-text-secondary">
              Display name
            </Label>
            <Input
              id="mcp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My MCP server"
              className="border-ws-border-subtle bg-ws-bg"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-ws-text-secondary">Transport</Label>
            <Select
              value={transport}
              onValueChange={(value) =>
                setTransport(value as "sse" | "http")
              }
            >
              <SelectTrigger className="border-ws-border-subtle bg-ws-bg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-ws-border-subtle bg-ws-panel">
                <SelectItem value="sse">SSE (Server-Sent Events)</SelectItem>
                <SelectItem value="http">HTTP (streamable)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mcp-url" className="text-ws-text-secondary">
              Server URL
            </Label>
            <Input
              id="mcp-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://mcp.example.com/sse"
              className="border-ws-border-subtle bg-ws-bg font-mono text-[12px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mcp-auth" className="text-ws-text-secondary">
              Authorization header (optional)
            </Label>
            <Input
              id="mcp-auth"
              type="password"
              value={authHeader}
              onChange={(e) => setAuthHeader(e.target.value)}
              placeholder="Bearer sk-…"
              className="border-ws-border-subtle bg-ws-bg font-mono text-[12px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChangeInternal(false)}
            disabled={connecting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void onSubmit()}
            disabled={connecting || !name.trim() || !url.trim()}
            className="bg-ws-accent text-white hover:bg-ws-accent-hover"
          >
            {connecting ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Connecting…
              </>
            ) : (
              "Connect"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
