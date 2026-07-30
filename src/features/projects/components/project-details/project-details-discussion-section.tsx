"use client";

import { useAuth } from "@clerk/nextjs";
import {
  CheckCircle2Icon,
  Loader2Icon,
  MessageSquareIcon,
  Trash2Icon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Id } from "@/convex/_generated/dataModel";
import { parseConvexErrorMessage } from "@/features/github/lib/github-errors";
import {
  useCommunityDiscussions,
  useDeleteCommunityDiscussion,
  usePostCommunityDiscussion,
  useReplyToCommunityDiscussion,
} from "@/features/projects/hooks/use-project-details";
import type {
  ProjectCommunityDiscussion,
  ProjectCommunityMessage,
  ProjectDetailsData,
} from "@/features/projects/lib/project-details-types";

type ProjectDetailsDiscussionSectionProps = {
  projectId: string;
  details: ProjectDetailsData;
};

function AuthorAvatar({
  author,
}: {
  author: ProjectCommunityMessage["author"];
}) {
  return (
    <Avatar size="sm" style={{ boxShadow: `0 0 0 2px ${author.color}` }}>
      {author.imageUrl ? <AvatarImage src={author.imageUrl} alt="" /> : null}
      <AvatarFallback className="text-[10px]">{author.initials}</AvatarFallback>
    </Avatar>
  );
}

function MessageBubble({
  message,
  isOwnerMessage,
  canDelete,
  onDelete,
  deleting,
}: {
  message: ProjectCommunityMessage;
  isOwnerMessage?: boolean;
  canDelete?: boolean;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <AuthorAvatar author={message.author} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">{message.author.name}</p>
          {isOwnerMessage ? (
            <Badge variant="secondary" className="text-[10px]">
              Owner
            </Badge>
          ) : null}
          <span className="text-[11px] text-muted-foreground">{message.time}</span>
          {canDelete && onDelete ? (
            <button
              type="button"
              disabled={deleting}
              onClick={onDelete}
              className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground transition hover:text-destructive"
            >
              <Trash2Icon className="size-3" />
              Delete
            </button>
          ) : null}
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
          {message.body}
        </p>
      </div>
    </div>
  );
}

function DiscussionThread({
  thread,
  projectId,
  ownerUserId,
  viewerUserId,
  canModerate,
}: {
  thread: ProjectCommunityDiscussion;
  projectId: string;
  ownerUserId: string;
  viewerUserId?: string | null;
  canModerate: boolean;
}) {
  const replyMutation = useReplyToCommunityDiscussion();
  const deleteMutation = useDeleteCommunityDiscussion();
  const [expanded, setExpanded] = useState(thread.replies.length > 0);
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleReply() {
    if (!reply.trim()) return;
    setReplying(true);
    try {
      await replyMutation({
        projectId: projectId as Id<"projects">,
        parentId: thread.id as Id<"projectCommunityDiscussions">,
        body: reply,
      });
      setReply("");
      setExpanded(true);
      toast.success("Reply posted");
    } catch (error) {
      toast.error(parseConvexErrorMessage(error, "Could not post reply"));
    } finally {
      setReplying(false);
    }
  }

  async function handleDelete(messageId: string) {
    setDeletingId(messageId);
    try {
      await deleteMutation({
        projectId: projectId as Id<"projects">,
        messageId: messageId as Id<"projectCommunityDiscussions">,
      });
      toast.success("Message deleted");
    } catch (error) {
      toast.error(parseConvexErrorMessage(error, "Could not delete message"));
    } finally {
      setDeletingId(null);
    }
  }

  function canDeleteMessage(message: ProjectCommunityMessage) {
    if (!viewerUserId) return false;
    return canModerate || message.author.userId === viewerUserId;
  }

  return (
    <article className="rounded-2xl border border-border/50 bg-muted/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {thread.answered ? (
            <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2Icon className="size-3" />
              Answered
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[11px]">
              Open question
            </Badge>
          )}
          {thread.replyCount > 0 ? (
            <span className="text-[11px] text-muted-foreground">
              {thread.replyCount}{" "}
              {thread.replyCount === 1 ? "reply" : "replies"}
            </span>
          ) : null}
        </div>
        {thread.replyCount > 0 ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="text-xs font-medium text-primary hover:underline"
          >
            {expanded ? "Hide replies" : "Show replies"}
          </button>
        ) : null}
      </div>

      <div className="mt-3">
        <MessageBubble
          message={thread}
          canDelete={canDeleteMessage(thread)}
          onDelete={() => void handleDelete(thread.id)}
          deleting={deletingId === thread.id}
        />
      </div>

      {expanded && thread.replies.length > 0 ? (
        <div className="mt-4 space-y-4 border-l border-border/60 pl-4">
          {thread.replies.map((replyMessage) => (
            <MessageBubble
              key={replyMessage.id}
              message={replyMessage}
              isOwnerMessage={replyMessage.author.userId === ownerUserId}
              canDelete={canDeleteMessage(replyMessage)}
              onDelete={() => void handleDelete(replyMessage.id)}
              deleting={deletingId === replyMessage.id}
            />
          ))}
        </div>
      ) : null}

      {viewerUserId ? (
        <div className="mt-4 space-y-2">
          <Textarea
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            placeholder="Write a reply…"
            rows={3}
            className="min-h-[80px] resize-y bg-background/80"
          />
          <Button
            type="button"
            size="sm"
            disabled={replying || !reply.trim()}
            onClick={() => void handleReply()}
          >
            {replying ? (
              <>
                <Loader2Icon className="size-3.5 animate-spin" />
                Posting…
              </>
            ) : (
              "Reply"
            )}
          </Button>
        </div>
      ) : null}
    </article>
  );
}

export function ProjectDetailsDiscussionSection({
  projectId,
  details,
}: ProjectDetailsDiscussionSectionProps) {
  const { userId, isSignedIn } = useAuth();
  const discussions = useCommunityDiscussions(projectId);
  const postDiscussion = usePostCommunityDiscussion();
  const [activeTab, setActiveTab] = useState<"all" | "open">("all");
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  const ownerUserId =
    details.contributors.find((member) => member.role === "owner")?.userId ??
    "";

  const filtered = useMemo(() => {
    if (!discussions) return undefined;
    if (activeTab === "open") {
      return discussions.filter((thread) => !thread.answered);
    }
    return discussions;
  }, [activeTab, discussions]);

  const canModerate =
    details.viewer.isOwner || details.viewer.canManage;

  async function handlePost() {
    if (!draft.trim()) return;
    setPosting(true);
    try {
      await postDiscussion({
        projectId: projectId as Id<"projects">,
        body: draft,
      });
      setDraft("");
      toast.success("Question posted");
    } catch (error) {
      toast.error(parseConvexErrorMessage(error, "Could not post question"));
    } finally {
      setPosting(false);
    }
  }

  return (
    <section className="rounded-[24px] border border-border/60 bg-card/85 p-6">
      <div className="flex items-center gap-2">
        <MessageSquareIcon className="size-4 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight">
          Discussion & Q&A
        </h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Ask questions, share feedback, and get answers from the team.
      </p>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "all" | "open")}
        className="mt-4"
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="open">Open Q&A</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-4">
          {isSignedIn ? (
            <div className="rounded-2xl border border-border/50 bg-muted/10 p-4">
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask a question about this project…"
                rows={3}
                className="min-h-[88px] resize-y bg-background/80"
              />
              <Button
                type="button"
                className="mt-3"
                size="sm"
                disabled={posting || !draft.trim()}
                onClick={() => void handlePost()}
              >
                {posting ? (
                  <>
                    <Loader2Icon className="size-3.5 animate-spin" />
                    Posting…
                  </>
                ) : (
                  "Post question"
                )}
              </Button>
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
              Sign in to join the discussion.
            </p>
          )}

          {filtered === undefined ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" />
              Loading discussion…
            </div>
          ) : filtered.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
              {activeTab === "open"
                ? "No open questions — everything has been answered."
                : "No discussion yet. Be the first to ask a question."}
            </p>
          ) : (
            <div className="space-y-4">
              {filtered.map((thread) => (
                <DiscussionThread
                  key={thread.id}
                  thread={thread}
                  projectId={projectId}
                  ownerUserId={ownerUserId}
                  viewerUserId={userId}
                  canModerate={canModerate}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
