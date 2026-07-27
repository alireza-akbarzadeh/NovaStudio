"use client";

import { Loader2Icon } from "lucide-react";
import { useState } from "react";

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

type ConnectNotionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (apiKey: string, parentPageId: string) => Promise<unknown>;
  isConnecting: boolean;
};

export function ConnectNotionDialog({
  open,
  onOpenChange,
  onConnect,
  isConnecting,
}: ConnectNotionDialogProps) {
  const [apiKey, setApiKey] = useState("");
  const [parentPageId, setParentPageId] = useState("");

  const submit = async () => {
    await onConnect(apiKey, parentPageId);
    setApiKey("");
    setParentPageId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Notion</DialogTitle>
          <DialogDescription>
            Create an internal integration, share a parent page with it, then
            paste the secret and page URL. NovaStudio exports AI plans and docs
            as child pages there.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="notion-api-key">Integration secret</Label>
            <Input
              id="notion-api-key"
              type="password"
              autoComplete="off"
              placeholder="secret_…"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
            />
            <a
              href="https://www.notion.so/profile/integrations"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-primary underline-offset-2 hover:underline"
            >
              Create an internal integration →
            </a>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notion-parent-page">Parent page URL or ID</Label>
            <Input
              id="notion-parent-page"
              autoComplete="off"
              placeholder="https://www.notion.so/…"
              value={parentPageId}
              onChange={(event) => setParentPageId(event.target.value)}
            />
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              Open the Notion page → Share → invite your integration with edit
              access. Exports appear as child pages under this page.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isConnecting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!apiKey.trim() || !parentPageId.trim() || isConnecting}
            onClick={() => void submit()}
          >
            {isConnecting ? (
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
