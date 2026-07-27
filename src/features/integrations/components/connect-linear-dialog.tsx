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

type ConnectLinearDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (apiKey: string) => Promise<unknown>;
  isConnecting: boolean;
};

export function ConnectLinearDialog({
  open,
  onOpenChange,
  onConnect,
  isConnecting,
}: ConnectLinearDialogProps) {
  const [apiKey, setApiKey] = useState("");

  const submit = async () => {
    await onConnect(apiKey);
    setApiKey("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Linear</DialogTitle>
          <DialogDescription>
            Paste a personal API key from Linear settings. NovaStudio uses it to
            link issues and sync status when you push or deploy.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="linear-api-key">Personal API key</Label>
            <Input
              id="linear-api-key"
              type="password"
              autoComplete="off"
              placeholder="lin_api_…"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
            />
            <a
              href="https://linear.app/settings/account/security"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-primary underline-offset-2 hover:underline"
            >
              Create an API key in Linear →
            </a>
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
            disabled={!apiKey.trim() || isConnecting}
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
