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
import type { DeployProvider } from "@/features/deploy/hooks/use-deploy-connection";

type ConnectDeployDialogProps = {
  provider: DeployProvider;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (token: string, teamId?: string) => Promise<unknown>;
  isConnecting: boolean;
};

const COPY: Record<
  DeployProvider,
  { title: string; description: string; tokenUrl: string; teamHint?: string }
> = {
  vercel: {
    title: "Connect Vercel",
    description:
      "Paste a Vercel personal access token. Tokens stay on the server and are never shown again.",
    tokenUrl: "https://vercel.com/account/tokens",
    teamHint: "Optional team id if you deploy under a Vercel team.",
  },
  netlify: {
    title: "Connect Netlify",
    description:
      "Paste a Netlify personal access token from User settings → Applications.",
    tokenUrl: "https://app.netlify.com/user/applications#personal-access-tokens",
  },
};

export function ConnectDeployDialog({
  provider,
  open,
  onOpenChange,
  onConnect,
  isConnecting,
}: ConnectDeployDialogProps) {
  const [token, setToken] = useState("");
  const [teamId, setTeamId] = useState("");
  const copy = COPY[provider];

  const submit = async () => {
    await onConnect(token, teamId || undefined);
    setToken("");
    setTeamId("");
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
            <Label htmlFor={`${provider}-token`}>Access token</Label>
            <Input
              id={`${provider}-token`}
              type="password"
              autoComplete="off"
              placeholder="Paste token"
              value={token}
              onChange={(event) => setToken(event.target.value)}
            />
            <a
              href={copy.tokenUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-primary underline-offset-2 hover:underline"
            >
              Create a token →
            </a>
          </div>

          {provider === "vercel" ? (
            <div className="space-y-2">
              <Label htmlFor="vercel-team">Team id (optional)</Label>
              <Input
                id="vercel-team"
                placeholder="team_…"
                value={teamId}
                onChange={(event) => setTeamId(event.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">{copy.teamHint}</p>
            </div>
          ) : null}
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
            disabled={!token.trim() || isConnecting}
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
