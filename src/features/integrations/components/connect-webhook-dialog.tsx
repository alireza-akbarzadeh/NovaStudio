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
import type { WebhookIntegrationProvider } from "@/features/integrations/hooks/use-integration-connection";

type ConnectWebhookDialogProps = {
  provider: WebhookIntegrationProvider;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (webhookUrl: string) => Promise<unknown>;
  isConnecting: boolean;
};

const COPY: Record<
  WebhookIntegrationProvider,
  { title: string; description: string; docsUrl: string; placeholder: string }
> = {
  slack: {
    title: "Connect Slack",
    description:
      "Paste an Incoming Webhook URL. NovaStudio sends a test message, then posts deploy success and failure alerts to that channel.",
    docsUrl:
      "https://api.slack.com/messaging/webhooks#create_a_webhook",
    placeholder: "https://hooks.slack.com/services/…",
  },
  discord: {
    title: "Connect Discord",
    description:
      "Paste a channel webhook URL. NovaStudio sends a test message, then posts deploy success and failure alerts to that channel.",
    docsUrl:
      "https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks",
    placeholder: "https://discord.com/api/webhooks/…",
  },
};

export function ConnectWebhookDialog({
  provider,
  open,
  onOpenChange,
  onConnect,
  isConnecting,
}: ConnectWebhookDialogProps) {
  const [webhookUrl, setWebhookUrl] = useState("");
  const copy = COPY[provider];

  const submit = async () => {
    await onConnect(webhookUrl);
    setWebhookUrl("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor={`${provider}-webhook`}>Webhook URL</Label>
            <Input
              id={`${provider}-webhook`}
              type="password"
              autoComplete="off"
              placeholder={copy.placeholder}
              value={webhookUrl}
              onChange={(event) => setWebhookUrl(event.target.value)}
            />
            <a
              href={copy.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-primary underline-offset-2 hover:underline"
            >
              How to create a webhook →
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
            disabled={!webhookUrl.trim() || isConnecting}
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
