"use client";

import { Loader2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LinearConnectFormProps = {
  onConnect: (apiKey: string) => Promise<unknown>;
  isConnecting: boolean;
  compact?: boolean;
  className?: string;
  autoFocus?: boolean;
};

export function LinearConnectForm({
  onConnect,
  isConnecting,
  compact = false,
  autoFocus = false,
}: LinearConnectFormProps) {
  const [apiKey, setApiKey] = useState("");

  const submit = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) return;
    await onConnect(trimmed);
    setApiKey("");
  };

  return (
    <div className="space-y-2">
      <Input
        type="password"
        autoComplete="new-password"
        autoFocus={autoFocus}
        placeholder="lin_api_…"
        value={apiKey}
        onChange={(event) => setApiKey(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") void submit();
        }}
        className={
          compact
            ? "h-7 border-ws-border bg-ws-bg text-[11px] text-ws-text"
            : "h-8 border-ws-border bg-ws-bg text-[12px] text-ws-text"
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!apiKey.trim() || isConnecting}
          onClick={() => void submit()}
          className={
            compact
              ? "h-7 bg-ws-accent px-2.5 text-[11px] text-white hover:bg-ws-accent-hover"
              : "h-8 bg-ws-accent text-[12px] text-white hover:bg-ws-accent-hover"
          }
        >
          {isConnecting ? (
            <>
              <Loader2Icon className="size-3.5 animate-spin" />
              Connecting…
            </>
          ) : (
            "Connect Linear"
          )}
        </Button>
        <a
          href="https://linear.app/settings/account/security"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-ws-link underline-offset-2 hover:underline"
        >
          Create API key →
        </a>
      </div>
    </div>
  );
}
