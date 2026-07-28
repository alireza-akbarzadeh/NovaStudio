"use client";

import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AGENT_BACKEND_LABELS,
  AGENT_BACKENDS,
  type AgentBackend,
} from "@/lib/ai/agent-backends";
import { cn } from "@/lib/utils";

type WorkspaceAiBackendPickerProps = {
  value: AgentBackend;
  onChange: (backend: AgentBackend) => void;
  disabled?: boolean;
  className?: string;
};

export function WorkspaceAiBackendPicker({
  value,
  onChange,
  disabled,
  className,
}: WorkspaceAiBackendPickerProps) {
  const label = AGENT_BACKEND_LABELS[value]?.label ?? "NovaStudio";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={cn(
            "h-7 gap-1 px-2 text-[11px] text-ws-text-muted hover:bg-ws-hover hover:text-ws-text",
            className,
          )}
          title="Agent backend for background runs"
        >
          <span className="max-w-[88px] truncate">{label}</span>
          <ChevronDownIcon className="size-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-64 border-ws-border bg-ws-panel"
      >
        {AGENT_BACKENDS.map((backend) => {
          const meta = AGENT_BACKEND_LABELS[backend];
          return (
            <DropdownMenuItem
              key={backend}
              className={cn(
                "flex flex-col items-start gap-0.5 py-2",
                value === backend && "bg-ws-hover",
              )}
              onSelect={() => onChange(backend)}
            >
              <span className="text-[12px] font-medium text-ws-text">
                {meta.label}
              </span>
              <span className="text-[10px] leading-snug text-ws-text-muted">
                {meta.description}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
