"use client";

import { FileTextIcon } from "lucide-react";

import {
  PromptInputCommand,
  PromptInputCommandEmpty,
  PromptInputCommandGroup,
  PromptInputCommandInput,
  PromptInputCommandItem,
  PromptInputCommandList,
} from "@/components/ai-elements/prompt-input";
import type { MentionFileOption } from "@/features/workspace/components/workspace-chat/types";

export type ChatMentionPickerProps = {
  open: boolean;
  query?: string;
  fileOptions: MentionFileOption[];
  selectedValue: string;
  onSelectedValueChange: (value: string) => void;
  onSelect: (path: string) => void;
  isLoading: boolean;
};

export function ChatMentionPicker({
  open,
  query = "",
  fileOptions,
  selectedValue,
  onSelectedValueChange,
  onSelect,
  isLoading,
}: ChatMentionPickerProps) {
  if (!open) return null;

  return (
    <div className="absolute right-2 bottom-full left-2 z-50 mb-1 max-h-56 overflow-hidden rounded-lg border border-ws-border bg-ws-panel shadow-lg">
      <PromptInputCommand
        shouldFilter={false}
        value={selectedValue}
        onValueChange={onSelectedValueChange}
      >
        <PromptInputCommandInput
          placeholder="Mention a file…"
          value={query}
          onValueChange={() => {}}
        />
        <PromptInputCommandList>
          <PromptInputCommandEmpty>
            {isLoading ? "Loading files…" : "No files found."}
          </PromptInputCommandEmpty>
          <PromptInputCommandGroup heading="Project files">
            {fileOptions.map((file) => (
              <PromptInputCommandItem
                key={file.path}
                value={file.value}
                onSelect={() => onSelect(file.path)}
              >
                <FileTextIcon className="size-3.5 shrink-0 text-ws-accent-soft" />
                <span className="truncate">{file.path}</span>
              </PromptInputCommandItem>
            ))}
          </PromptInputCommandGroup>
        </PromptInputCommandList>
      </PromptInputCommand>
    </div>
  );
}
