"use client";

import { AtSignIcon } from "lucide-react";
import { useCallback, useMemo, useState, type KeyboardEvent } from "react";
import { toast } from "sonner";

import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
  usePromptInputController,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { ChatAttachmentsPreview } from "@/features/workspace/components/workspace-chat/chat-attachments-preview";
import { ChatMentionPicker } from "@/features/workspace/components/workspace-chat/chat-mention-picker";
import { extractMentionedPaths } from "@/features/workspace/components/file-mention-text";
import {
  MAX_CHAT_FILES,
  MAX_CHAT_FILE_SIZE,
  type ChatSubmitMessage,
} from "@/features/workspace/components/workspace-chat/types";
import { filterMentionFiles } from "@/features/workspace/components/workspace-chat/utils";
import { VoiceNoteButton } from "@/features/workspace/components/workspace-chat/voice-note-button";
import { useProjectFiles } from "@/features/workspace/hooks/use-project-files";

export type ChatComposerProps = {
  projectId: string;
  sending: boolean;
  onSubmit: (message: ChatSubmitMessage) => void | Promise<void>;
};

export function ChatComposer({
  projectId,
  sending,
  onSubmit,
}: ChatComposerProps) {
  const controller = usePromptInputController();
  const attachments = usePromptInputAttachments();
  const files = useProjectFiles(projectId);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);

  const projectFilePaths = useMemo(
    () =>
      new Set(
        (files ?? [])
          .filter((file) => file.kind === "file")
          .map((file) => file.path),
      ),
    [files],
  );

  const mentionQuery = useMemo(() => {
    const match = controller.textInput.value.match(/@([\w./-]*)$/);
    return match?.[1] ?? "";
  }, [controller.textInput.value]);

  const fileOptions = useMemo(
    () => filterMentionFiles(files, mentionQuery),
    [files, mentionQuery],
  );

  const safeMentionIndex =
    fileOptions.length === 0
      ? 0
      : Math.min(mentionIndex, fileOptions.length - 1);
  const selectedValue = fileOptions[safeMentionIndex]?.value ?? "";

  const insertMention = useCallback(
    (path: string) => {
      const current = controller.textInput.value;
      const atIndex = current.lastIndexOf("@");
      const prefix = atIndex >= 0 ? current.slice(0, atIndex) : current;
      const needsSpace =
        prefix.length > 0 && !prefix.endsWith(" ") && !prefix.endsWith("\n");
      controller.textInput.setInput(
        `${prefix}${needsSpace && atIndex < 0 ? " " : ""}@${path} `,
      );
      setMentionOpen(false);
      setMentionIndex(0);
    },
    [controller.textInput],
  );

  const handleTextChange = useCallback(
    (value: string) => {
      controller.textInput.setInput(value);
      const open = /@[\w./-]*$/.test(value) || value.endsWith("@");
      setMentionOpen(open);
      setMentionIndex(0);
    },
    [controller.textInput],
  );

  const handleMentionKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (!mentionOpen) return;

      if (event.key === "Escape") {
        event.preventDefault();
        setMentionOpen(false);
        return;
      }

      if (fileOptions.length === 0) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setMentionIndex((index) => (index + 1) % fileOptions.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setMentionIndex(
          (index) => (index - 1 + fileOptions.length) % fileOptions.length,
        );
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        const selected =
          fileOptions[
            fileOptions.length === 0
              ? 0
              : Math.min(mentionIndex, fileOptions.length - 1)
          ] ?? fileOptions[0];
        if (!selected) return;
        event.preventDefault();
        insertMention(selected.path);
      }
    },
    [fileOptions, insertMention, mentionIndex, mentionOpen],
  );

  const submitWithMentions = useCallback(
    async (message: PromptInputMessage) => {
      const text = message.text.trim();
      if (!text && message.files.length === 0) return;
      await onSubmit({
        ...message,
        text,
        mentionedPaths: text
          ? extractMentionedPaths(text, projectFilePaths)
          : [],
      });
    },
    [onSubmit, projectFilePaths],
  );

  const canSubmit =
    controller.textInput.value.trim().length > 0 ||
    attachments.files.length > 0;

  return (
    <PromptInput
      className="relative rounded-lg border border-ws-border-subtle bg-ws-hover/30 shadow-none"
      accept="image/*,audio/*,application/pdf,text/plain,text/markdown,application/json,text/csv,application/zip,text/css,text/html,application/javascript,text/javascript"
      multiple
      maxFiles={MAX_CHAT_FILES}
      maxFileSize={MAX_CHAT_FILE_SIZE}
      onError={(error) => toast.error(error.message)}
      onSubmit={submitWithMentions}
    >
      <ChatMentionPicker
        open={mentionOpen}
        query={mentionQuery}
        fileOptions={fileOptions}
        selectedValue={selectedValue}
        onSelectedValueChange={(value) => {
          const index = fileOptions.findIndex((file) => file.value === value);
          if (index >= 0) setMentionIndex(index);
        }}
        onSelect={insertMention}
        isLoading={files === undefined}
      />
      <PromptInputHeader>
        <ChatAttachmentsPreview />
      </PromptInputHeader>
      <PromptInputBody>
        <PromptInputTextarea
          value={controller.textInput.value}
          onChange={(event) => handleTextChange(event.target.value)}
          onKeyDown={handleMentionKeyDown}
          placeholder="Message the team… (@ file, attach, or voice)"
          className="min-h-12 text-[12px] text-ws-text placeholder:text-ws-text-muted"
          disabled={sending}
        />
      </PromptInputBody>
      <PromptInputFooter className="px-2 pb-2">
        <PromptInputTools>
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger
              className="size-7 text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
              tooltip="Add attachments"
              disabled={sending}
            />
            <PromptInputActionMenuContent className="border-ws-border bg-ws-panel">
              <PromptInputActionAddAttachments label="Upload files or images" />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>

          <PromptInputButton
            type="button"
            className="size-7 text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
            tooltip="Mention file"
            disabled={sending}
            onClick={() => {
              const current = controller.textInput.value;
              const next = current.endsWith("@")
                ? current
                : `${current}${current && !current.endsWith(" ") ? " " : ""}@`;
              controller.textInput.setInput(next);
              setMentionOpen(true);
              setMentionIndex(0);
            }}
          >
            <AtSignIcon className="size-3.5" />
          </PromptInputButton>

          <VoiceNoteButton disabled={sending} />
        </PromptInputTools>
        <PromptInputSubmit disabled={sending || !canSubmit} />
      </PromptInputFooter>
    </PromptInput>
  );
}
