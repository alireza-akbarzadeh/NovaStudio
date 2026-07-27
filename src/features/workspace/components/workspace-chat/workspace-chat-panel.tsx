"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { FileTextIcon, MessageSquareIcon, MinusIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
} from "@/components/ai-elements/message";
import { PromptInputProvider } from "@/components/ai-elements/prompt-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { FileMentionText } from "@/features/workspace/components/file-mention-text";
import { ChatComposer } from "@/features/workspace/components/workspace-chat/chat-composer";
import { ChatMessageAttachments } from "@/features/workspace/components/workspace-chat/chat-message-attachments";
import type {
  ChatAttachment,
  ChatSubmitMessage,
  WorkspaceChatPanelProps,
} from "@/features/workspace/components/workspace-chat/types";
import { filePartToBlob } from "@/features/workspace/components/workspace-chat/utils";
import { parseConvexErrorMessage } from "@/features/github/lib/github-errors";
import { useEditorTabs } from "@/features/workspace/hooks/use-editor-tabs";
import { useProjectFileMetadata } from "@/features/workspace/hooks/use-project-files";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";

export function WorkspaceChatPanel({ projectId }: WorkspaceChatPanelProps) {
  const { userId } = useAuth();
  const open = useWorkspaceStore((s) => s.chatPanelOpen);
  const closeChatPanel = useWorkspaceStore((s) => s.closeChatPanel);
  const currentFilePath = useWorkspaceStore((s) => s.currentFilePath);
  const { openTab } = useEditorTabs(projectId);
  const files = useProjectFileMetadata(projectId);
  const [sending, setSending] = useState(false);

  const projectFilePaths = useMemo(
    () =>
      new Set(
        (files ?? [])
          .filter((file) => file.kind === "file")
          .map((file) => file.path),
      ),
    [files],
  );

  const messages = useQuery(api.chat.listMessages, {
    projectId: projectId as Id<"projects">,
    limit: 100,
  });
  const sendMessage = useMutation(api.chat.sendMessage);
  const generateUploadUrl = useMutation(api.chat.generateUploadUrl);

  const openFile = useCallback(
    (path: string) => {
      openTab({ kind: "file", path });
    },
    [openTab],
  );

  const onSubmit = useCallback(
    async (message: ChatSubmitMessage) => {
      const text = message.text.trim();
      if ((!text && message.files.length === 0) || sending) return;
      setSending(true);
      try {
        const uploaded = await Promise.all(
          message.files.map(async (file) => {
            const blob = await filePartToBlob(file);
            const uploadUrl = await generateUploadUrl({
              projectId: projectId as Id<"projects">,
            });
            const result = await fetch(uploadUrl, {
              method: "POST",
              headers: {
                "Content-Type":
                  file.mediaType || blob.type || "application/octet-stream",
              },
              body: blob,
            });
            if (!result.ok) {
              throw new Error("Upload failed");
            }
            const { storageId } = (await result.json()) as {
              storageId: Id<"_storage">;
            };
            const mediaType =
              file.mediaType || blob.type || "application/octet-stream";
            const filename = file.filename || "attachment";
            const kind: "file" | "voice" = filename.startsWith("voice-note-")
              ? "voice"
              : "file";
            return {
              storageId,
              filename,
              mediaType,
              kind,
            };
          }),
        );

        await sendMessage({
          projectId: projectId as Id<"projects">,
          body: text,
          filePath: currentFilePath ?? undefined,
          mentionedPaths: message.mentionedPaths,
          attachments: uploaded.length > 0 ? uploaded : undefined,
        });
      } catch (error) {
        const message = parseConvexErrorMessage(error, "Could not send message");
        toast.error(message);
        throw new Error(message);
      } finally {
        setSending(false);
      }
    },
    [currentFilePath, generateUploadUrl, projectId, sendMessage, sending],
  );

  if (!open) return null;

  return (
    <aside
      aria-label="Team chat"
      className="flex h-full w-[min(420px,42vw)] shrink-0 flex-col overflow-hidden rounded-[10px] border border-ws-border-subtle bg-ws-panel shadow-[0_1px_0_color-mix(in_oklab,var(--ws-text)_4%,transparent)]"
    >
      <header className="flex h-10 shrink-0 items-center gap-2 border-b border-ws-border-subtle px-3">
        <MessageSquareIcon
          className="size-3.5 text-ws-text-muted"
          strokeWidth={1.75}
        />
        <h2 className="flex-1 truncate text-[13px] font-semibold tracking-tight text-ws-text">
          Team chat
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 rounded-md text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
          aria-label="Hide chat"
          onClick={closeChatPanel}
        >
          <MinusIcon className="size-3.5" strokeWidth={1.75} />
        </Button>
      </header>

      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="gap-4 p-3">
          {messages === undefined ? (
            <p className="py-8 text-center text-[12px] text-ws-text-muted">
              Loading…
            </p>
          ) : messages.length === 0 ? (
            <ConversationEmptyState
              icon={
                <MessageSquareIcon
                  className="size-8 text-ws-text-muted"
                  strokeWidth={1.5}
                />
              }
              title="No messages yet"
              description="Chat with collaborators. Attach files, record voice, or type @ to mention a project file."
              className="min-h-55 text-ws-text"
            />
          ) : (
            messages.map((item) => {
              const isSelf = item.author.userId === userId;
              return (
                <Message
                  key={item.id}
                  from={isSelf ? "user" : "assistant"}
                  className="max-w-full"
                >
                  {!isSelf ? (
                    <div className="mb-1 flex items-center gap-2">
                      <Avatar size="sm" className="size-5">
                        {item.author.imageUrl ? (
                          <AvatarImage src={item.author.imageUrl} alt="" />
                        ) : null}
                        <AvatarFallback
                          className="text-[8px] text-white"
                          style={{ backgroundColor: item.author.color }}
                        >
                          {item.author.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-[11px] font-medium text-ws-text">
                        {item.author.name}
                      </span>
                      <span className="shrink-0 text-[10px] text-ws-text-muted">
                        {item.time}
                      </span>
                    </div>
                  ) : null}
                  <MessageContent
                    className={cn(
                      "text-ws-text",
                      isSelf
                        ? "group-[.is-user]:bg-ws-accent/20 group-[.is-user]:text-ws-text"
                        : "rounded-lg bg-ws-hover/70 px-3 py-2",
                    )}
                  >
                    {item.body ? (
                      <FileMentionText
                        body={item.body}
                        mentionedPaths={item.mentionedPaths ?? []}
                        projectFilePaths={projectFilePaths}
                        onOpenFile={openFile}
                      />
                    ) : null}
                    <ChatMessageAttachments
                      attachments={(item.attachments ?? []) as ChatAttachment[]}
                    />
                    {item.filePath ? (
                      <button
                        type="button"
                        className="mt-1.5 flex max-w-full items-center gap-1 truncate text-[10px] text-ws-text-muted hover:text-ws-accent"
                        onClick={() => openFile(item.filePath!)}
                        title={`Open ${item.filePath}`}
                      >
                        <FileTextIcon className="size-3 shrink-0" />
                        <span className="truncate">{item.filePath}</span>
                      </button>
                    ) : null}
                  </MessageContent>
                  {isSelf ? (
                    <p className="mt-0.5 text-right text-[10px] text-ws-text-muted">
                      {item.time}
                    </p>
                  ) : null}
                </Message>
              );
            })
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="shrink-0 border-t border-ws-border-subtle p-3">
        {currentFilePath ? (
          <button
            type="button"
            className="mb-2 flex max-w-full items-center gap-1 truncate text-[10px] text-ws-text-muted hover:text-ws-accent"
            onClick={() => openFile(currentFilePath)}
            title={`Open ${currentFilePath}`}
          >
            <FileTextIcon className="size-3 shrink-0" />
            <span className="truncate">Context: {currentFilePath}</span>
          </button>
        ) : null}
        <TooltipProvider delayDuration={200}>
          <PromptInputProvider>
            <ChatComposer
              projectId={projectId}
              sending={sending}
              onSubmit={onSubmit}
            />
          </PromptInputProvider>
        </TooltipProvider>
      </div>
    </aside>
  );
}
