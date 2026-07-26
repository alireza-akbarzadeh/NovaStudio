"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import {
  AtSignIcon,
  FileTextIcon,
  MessageSquareIcon,
  MinusIcon,
} from "lucide-react";
import {
  useCallback,
  useMemo,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
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
import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputCommand,
  PromptInputCommandEmpty,
  PromptInputCommandGroup,
  PromptInputCommandInput,
  PromptInputCommandItem,
  PromptInputCommandList,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputController,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useEditorTabs } from "@/features/workspace/hooks/use-editor-tabs";
import { useProjectFiles } from "@/features/workspace/hooks/use-project-files";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";

type WorkspaceChatPanelProps = {
  projectId: string;
};

type ChatSubmitMessage = PromptInputMessage & {
  mentionedPaths?: string[];
};

const MENTION_TOKEN = /@([\w./-]+)/g;

function fileBasename(path: string) {
  return path.split("/").pop() || path;
}

function resolveMentionPath(
  token: string,
  mentionedPaths: string[],
): string | null {
  if (mentionedPaths.includes(token)) return token;
  const byBasename = mentionedPaths.find(
    (path) => fileBasename(path) === token,
  );
  if (byBasename) return byBasename;
  if (token.includes("/") || token.includes(".")) return token;
  return null;
}

function extractMentionedPaths(
  text: string,
  projectFilePaths: Set<string>,
): string[] {
  const mentionedPaths: string[] = [];
  const regex = new RegExp(MENTION_TOKEN.source, "g");
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const token = match[1] ?? "";
    if (projectFilePaths.has(token)) {
      mentionedPaths.push(token);
      continue;
    }
    for (const path of projectFilePaths) {
      if (fileBasename(path) === token) {
        mentionedPaths.push(path);
        break;
      }
    }
  }
  return [...new Set(mentionedPaths)];
}

function ChatMessageBody({
  body,
  mentionedPaths,
  onOpenFile,
}: {
  body: string;
  mentionedPaths: string[];
  onOpenFile: (path: string) => void;
}) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  const regex = new RegExp(MENTION_TOKEN.source, "g");
  let match: RegExpExecArray | null;

  while ((match = regex.exec(body)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(body.slice(lastIndex, match.index));
    }
    const token = match[1] ?? "";
    const path = resolveMentionPath(token, mentionedPaths);
    if (path) {
      nodes.push(
        <button
          key={`${match.index}-${path}`}
          type="button"
          className="inline font-medium text-sky-400 underline decoration-sky-400/50 underline-offset-2 hover:text-sky-300 hover:decoration-sky-300"
          onClick={() => onOpenFile(path)}
          title={`Open ${path}`}
        >
          @{fileBasename(path)}
        </button>,
      );
    } else {
      nodes.push(match[0]);
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < body.length) {
    nodes.push(body.slice(lastIndex));
  }

  return (
    <p className="whitespace-pre-wrap break-words text-[12px] leading-relaxed">
      {nodes}
    </p>
  );
}

type MentionFileOption = {
  path: string;
  name: string;
  value: string;
};

function filterMentionFiles(
  files: ReturnType<typeof useProjectFiles>,
  query: string,
): MentionFileOption[] {
  const all = (files ?? [])
    .filter((file) => file.kind === "file")
    .map((file) => ({
      path: file.path,
      name: file.name,
      value: `${file.path} ${file.name}`,
    }));
  const q = query.trim().toLowerCase();
  if (!q) return all.slice(0, 40);
  return all
    .filter(
      (file) =>
        file.path.toLowerCase().includes(q) ||
        file.name.toLowerCase().includes(q),
    )
    .slice(0, 40);
}

function ChatMentionPicker({
  open,
  query = "",
  fileOptions,
  selectedValue,
  onSelectedValueChange,
  onSelect,
  isLoading,
}: {
  open: boolean;
  query?: string;
  fileOptions: MentionFileOption[];
  selectedValue: string;
  onSelectedValueChange: (value: string) => void;
  onSelect: (path: string) => void;
  isLoading: boolean;
}) {
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

function ChatComposer({
  projectId,
  sending,
  onSubmit,
}: {
  projectId: string;
  sending: boolean;
  onSubmit: (message: ChatSubmitMessage) => void | Promise<void>;
}) {
  const controller = usePromptInputController();
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
      if (!text) return;
      await onSubmit({
        ...message,
        text,
        mentionedPaths: extractMentionedPaths(text, projectFilePaths),
      });
    },
    [onSubmit, projectFilePaths],
  );

  return (
    <PromptInput
      className="relative rounded-lg border border-ws-border-subtle bg-ws-hover/30 shadow-none"
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
      <PromptInputBody>
        <PromptInputTextarea
          value={controller.textInput.value}
          onChange={(event) => handleTextChange(event.target.value)}
          onKeyDown={handleMentionKeyDown}
          placeholder="Message the team… (@ to mention a file)"
          className="min-h-12 text-[12px] text-ws-text placeholder:text-ws-text-muted"
          disabled={sending}
        />
      </PromptInputBody>
      <PromptInputFooter className="px-2 pb-2">
        <PromptInputTools>
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
        </PromptInputTools>
        <PromptInputSubmit disabled={sending} />
      </PromptInputFooter>
    </PromptInput>
  );
}

export function WorkspaceChatPanel({ projectId }: WorkspaceChatPanelProps) {
  const { userId } = useAuth();
  const open = useWorkspaceStore((s) => s.chatPanelOpen);
  const closeChatPanel = useWorkspaceStore((s) => s.closeChatPanel);
  const currentFilePath = useWorkspaceStore((s) => s.currentFilePath);
  const { openTab } = useEditorTabs(projectId);
  const [sending, setSending] = useState(false);

  const messages = useQuery(api.chat.listMessages, {
    projectId: projectId as Id<"projects">,
    limit: 100,
  });
  const sendMessage = useMutation(api.chat.sendMessage);

  const openFile = useCallback(
    (path: string) => {
      openTab({ kind: "file", path });
    },
    [openTab],
  );

  const onSubmit = useCallback(
    async (message: ChatSubmitMessage) => {
      const text = message.text.trim();
      if (!text || sending) return;
      setSending(true);
      try {
        await sendMessage({
          projectId: projectId as Id<"projects">,
          body: text,
          filePath: currentFilePath ?? undefined,
          mentionedPaths: message.mentionedPaths,
        });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not send message",
        );
      } finally {
        setSending(false);
      }
    },
    [currentFilePath, projectId, sendMessage, sending],
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
              description="Chat with collaborators. Type @ to mention a project file."
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
                      isSelf
                        ? "group-[.is-user]:bg-ws-accent/20 group-[.is-user]:text-ws-text"
                        : "rounded-lg bg-ws-hover/70 px-3 py-2",
                    )}
                  >
                    <ChatMessageBody
                      body={item.body}
                      mentionedPaths={item.mentionedPaths}
                      onOpenFile={openFile}
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
