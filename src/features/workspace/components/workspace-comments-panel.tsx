"use client";

import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeftIcon,
  CheckIcon,
  MessageCircleIcon,
  MinusIcon,
  PlusIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getActiveMonacoEditor } from "@/features/workspace/lib/active-monaco-editor";
import { useEditorTabs } from "@/features/workspace/hooks/use-editor-tabs";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";

type WorkspaceCommentsPanelProps = {
  projectId: string;
};

type Scope = "file" | "project";

function fileBasename(path: string) {
  return path.split("/").pop() || path;
}

function AuthorRow({
  name,
  initials,
  color,
  imageUrl,
  meta,
}: {
  name: string;
  initials: string;
  color: string;
  imageUrl?: string;
  meta?: string;
}) {
  return (
    <div className="mb-1 flex items-center gap-2">
      <Avatar size="sm" className="size-5">
        {imageUrl ? <AvatarImage src={imageUrl} alt="" /> : null}
        <AvatarFallback
          className="text-[8px] text-white"
          style={{ backgroundColor: color }}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      <span className="truncate text-[11px] font-medium text-ws-text">
        {name}
      </span>
      {meta ? (
        <span className="shrink-0 text-[10px] text-ws-text-muted">{meta}</span>
      ) : null}
    </div>
  );
}

export function WorkspaceCommentsPanel({
  projectId,
}: WorkspaceCommentsPanelProps) {
  const open = useWorkspaceStore((s) => s.commentsPanelOpen);
  const closeCommentsPanel = useWorkspaceStore((s) => s.closeCommentsPanel);
  const currentFilePath = useWorkspaceStore((s) => s.currentFilePath);
  const activeThreadId = useWorkspaceStore((s) => s.activeCommentThreadId);
  const setActiveCommentThreadId = useWorkspaceStore(
    (s) => s.setActiveCommentThreadId,
  );
  const commentDraftLine = useWorkspaceStore((s) => s.commentDraftLine);
  const setCommentDraftLine = useWorkspaceStore((s) => s.setCommentDraftLine);
  const setPendingEditorReveal = useWorkspaceStore(
    (s) => s.setPendingEditorReveal,
  );
  const { openTab } = useEditorTabs(projectId);

  const [scope, setScope] = useState<Scope>("file");
  const [includeResolved, setIncludeResolved] = useState(false);
  const [sending, setSending] = useState(false);

  const listArgs = useMemo(() => {
    const base = {
      projectId: projectId as Id<"projects">,
      includeResolved,
      limit: 80,
    };
    if (scope === "file" && currentFilePath) {
      return { ...base, filePath: currentFilePath };
    }
    return base;
  }, [projectId, includeResolved, scope, currentFilePath]);

  const threads = useQuery(api.comments.listThreads, open ? listArgs : "skip");
  const threadDetail = useQuery(
    api.comments.getThread,
    open && activeThreadId
      ? { threadId: activeThreadId as Id<"projectCommentThreads"> }
      : "skip",
  );

  const createThread = useMutation(api.comments.createThread);
  const addReply = useMutation(api.comments.addReply);
  const setResolved = useMutation(api.comments.setResolved);

  const jumpToThread = useCallback(
    (filePath: string, line: number, threadId: string) => {
      setActiveCommentThreadId(threadId);
      setCommentDraftLine(null);
      setPendingEditorReveal({ path: filePath, line, column: 1 });
      openTab({ kind: "file", path: filePath });
    },
    [
      openTab,
      setActiveCommentThreadId,
      setCommentDraftLine,
      setPendingEditorReveal,
    ],
  );

  const startDraftOnCursor = useCallback(() => {
    if (!currentFilePath) {
      toast.error("Open a file to comment on a line");
      return;
    }
    const ed = getActiveMonacoEditor(currentFilePath);
    const line =
      ed?.getPosition()?.lineNumber ??
      commentDraftLine ??
      1;
    setCommentDraftLine(line);
    setActiveCommentThreadId(null);
  }, [
    commentDraftLine,
    currentFilePath,
    setActiveCommentThreadId,
    setCommentDraftLine,
  ]);

  useEffect(() => {
    if (scope === "file" && !currentFilePath) {
      setScope("project");
    }
  }, [currentFilePath, scope]);

  const onCreateThread = useCallback(
    async (message: PromptInputMessage) => {
      const text = message.text.trim();
      if (!text || !currentFilePath || commentDraftLine == null || sending) {
        return;
      }
      setSending(true);
      try {
        const id = await createThread({
          projectId: projectId as Id<"projects">,
          filePath: currentFilePath,
          line: commentDraftLine,
          body: text,
        });
        setCommentDraftLine(null);
        setActiveCommentThreadId(id);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not add comment",
        );
      } finally {
        setSending(false);
      }
    },
    [
      commentDraftLine,
      createThread,
      currentFilePath,
      projectId,
      sending,
      setActiveCommentThreadId,
      setCommentDraftLine,
    ],
  );

  const onReply = useCallback(
    async (message: PromptInputMessage) => {
      const text = message.text.trim();
      if (!text || !activeThreadId || sending) return;
      setSending(true);
      try {
        await addReply({
          threadId: activeThreadId as Id<"projectCommentThreads">,
          body: text,
        });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not send reply",
        );
      } finally {
        setSending(false);
      }
    },
    [activeThreadId, addReply, sending],
  );

  if (!open) return null;

  const drafting = commentDraftLine != null && !activeThreadId;

  return (
    <aside
      aria-label="Live comments"
      className="flex h-full w-[min(420px,42vw)] shrink-0 flex-col overflow-hidden rounded-[10px] border border-ws-border-subtle bg-ws-panel shadow-[0_1px_0_color-mix(in_oklab,var(--ws-text)_4%,transparent)]"
    >
      <header className="flex h-10 shrink-0 items-center gap-2 border-b border-ws-border-subtle px-3">
        {activeThreadId || drafting ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 rounded-md text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
            aria-label="Back to comments"
            onClick={() => {
              setActiveCommentThreadId(null);
              setCommentDraftLine(null);
            }}
          >
            <ArrowLeftIcon className="size-3.5" strokeWidth={1.75} />
          </Button>
        ) : (
          <MessageCircleIcon
            className="size-3.5 text-ws-text-muted"
            strokeWidth={1.75}
          />
        )}
        <h2 className="flex-1 truncate text-[13px] font-semibold tracking-tight text-ws-text">
          {drafting
            ? `New comment · line ${commentDraftLine}`
            : activeThreadId
              ? "Comment thread"
              : "Live comments"}
        </h2>
        {!activeThreadId && !drafting ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 rounded-md text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
            aria-label="Comment on current line"
            onClick={startDraftOnCursor}
          >
            <PlusIcon className="size-3.5" strokeWidth={1.75} />
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 rounded-md text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
          aria-label="Hide comments"
          onClick={closeCommentsPanel}
        >
          <MinusIcon className="size-3.5" strokeWidth={1.75} />
        </Button>
      </header>

      {!activeThreadId && !drafting ? (
        <div className="flex shrink-0 items-center gap-1 border-b border-ws-border-subtle px-2 py-1.5">
          <button
            type="button"
            className={cn(
              "rounded-md px-2 py-1 text-[11px]",
              scope === "file"
                ? "bg-ws-accent/15 text-ws-text"
                : "text-ws-text-muted hover:bg-ws-hover",
            )}
            disabled={!currentFilePath}
            onClick={() => setScope("file")}
          >
            This file
          </button>
          <button
            type="button"
            className={cn(
              "rounded-md px-2 py-1 text-[11px]",
              scope === "project"
                ? "bg-ws-accent/15 text-ws-text"
                : "text-ws-text-muted hover:bg-ws-hover",
            )}
            onClick={() => setScope("project")}
          >
            Project
          </button>
          <button
            type="button"
            className={cn(
              "ml-auto rounded-md px-2 py-1 text-[11px]",
              includeResolved
                ? "bg-ws-hover text-ws-text"
                : "text-ws-text-muted hover:bg-ws-hover",
            )}
            onClick={() => setIncludeResolved((v) => !v)}
          >
            Resolved
          </button>
        </div>
      ) : null}

      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="gap-3 p-3">
          {drafting ? (
            <div className="rounded-lg border border-ws-border-subtle bg-ws-hover/40 px-3 py-2">
              <p className="text-[11px] text-ws-text-muted">
                Commenting on{" "}
                <span className="font-medium text-ws-text">
                  {currentFilePath
                    ? fileBasename(currentFilePath)
                    : "file"}
                </span>{" "}
                · line {commentDraftLine}
              </p>
            </div>
          ) : activeThreadId ? (
            threadDetail === undefined ? (
              <p className="py-8 text-center text-[12px] text-ws-text-muted">
                Loading…
              </p>
            ) : threadDetail === null ? (
              <p className="py-8 text-center text-[12px] text-ws-text-muted">
                Thread not found
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    className="truncate text-[11px] text-ws-accent hover:underline"
                    onClick={() =>
                      jumpToThread(
                        threadDetail.filePath,
                        threadDetail.line,
                        threadDetail.id,
                      )
                    }
                  >
                    {fileBasename(threadDetail.filePath)} · line{" "}
                    {threadDetail.line}
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-[11px] text-ws-text-muted"
                    onClick={() =>
                      void setResolved({
                        threadId:
                          threadDetail.id as Id<"projectCommentThreads">,
                        resolved: !threadDetail.resolved,
                      }).catch((error) =>
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : "Could not update",
                        ),
                      )
                    }
                  >
                    <CheckIcon className="size-3" />
                    {threadDetail.resolved ? "Reopen" : "Resolve"}
                  </Button>
                </div>
                <Message from="assistant" className="max-w-full">
                  <AuthorRow
                    name={threadDetail.author.name}
                    initials={threadDetail.author.initials}
                    color={threadDetail.author.color}
                    imageUrl={threadDetail.author.imageUrl}
                    meta={threadDetail.time}
                  />
                  <MessageContent className="rounded-lg bg-ws-hover/70 px-3 py-2">
                    <p className="whitespace-pre-wrap break-words text-[12px] leading-relaxed">
                      {threadDetail.body}
                    </p>
                  </MessageContent>
                </Message>
                {threadDetail.replies.map((reply) => (
                  <Message
                    key={reply.id}
                    from="assistant"
                    className="max-w-full pl-4"
                  >
                    <AuthorRow
                      name={reply.author.name}
                      initials={reply.author.initials}
                      color={reply.author.color}
                      imageUrl={reply.author.imageUrl}
                      meta={reply.time}
                    />
                    <MessageContent className="rounded-lg bg-ws-hover/50 px-3 py-2">
                      <p className="whitespace-pre-wrap break-words text-[12px] leading-relaxed">
                        {reply.body}
                      </p>
                    </MessageContent>
                  </Message>
                ))}
              </>
            )
          ) : threads === undefined ? (
            <p className="py-8 text-center text-[12px] text-ws-text-muted">
              Loading…
            </p>
          ) : threads.length === 0 ? (
            <ConversationEmptyState
              icon={
                <MessageCircleIcon
                  className="size-8 text-ws-text-muted"
                  strokeWidth={1.5}
                />
              }
              title="No comments yet"
              description="Click + or the gutter to comment on a line — like Figma."
              className="min-h-55 text-ws-text"
            />
          ) : (
            threads.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "w-full rounded-lg border border-ws-border-subtle bg-ws-hover/30 px-3 py-2.5 text-left transition-colors hover:bg-ws-hover/60",
                  item.resolved && "opacity-60",
                )}
                onClick={() => jumpToThread(item.filePath, item.line, item.id)}
              >
                <AuthorRow
                  name={item.author.name}
                  initials={item.author.initials}
                  color={item.author.color}
                  imageUrl={item.author.imageUrl}
                  meta={`line ${item.line}`}
                />
                <p className="line-clamp-2 text-[12px] leading-snug text-ws-text">
                  {item.body}
                </p>
                <p className="mt-1.5 truncate text-[10px] text-ws-text-muted">
                  {fileBasename(item.filePath)}
                  {item.replyCount > 0
                    ? ` · ${item.replyCount} ${item.replyCount === 1 ? "reply" : "replies"}`
                    : ""}
                  {" · "}
                  {item.time}
                </p>
              </button>
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {(drafting || activeThreadId) && (
        <div className="shrink-0 border-t border-ws-border-subtle p-3">
          <TooltipProvider delayDuration={200}>
            <PromptInputProvider>
              <PromptInput
                className="rounded-lg border border-ws-border-subtle bg-ws-hover/30 shadow-none"
                onSubmit={drafting ? onCreateThread : onReply}
              >
                <PromptInputBody>
                  <PromptInputTextarea
                    placeholder={
                      drafting
                        ? "Leave a comment on this line…"
                        : "Reply…"
                    }
                    className="min-h-12 text-[12px] text-ws-text placeholder:text-ws-text-muted"
                    disabled={sending}
                  />
                </PromptInputBody>
                <PromptInputFooter className="px-2 pb-2">
                  <div />
                  <PromptInputSubmit disabled={sending} />
                </PromptInputFooter>
              </PromptInput>
            </PromptInputProvider>
          </TooltipProvider>
        </div>
      )}
    </aside>
  );
}
