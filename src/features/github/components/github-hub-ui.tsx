"use client";

import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  Loader2Icon,
  RefreshCwIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function formatGitHubDate(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GitHubAuthorAvatar({
  login,
  avatarUrl,
  size = 20,
}: {
  login: string;
  avatarUrl: string;
  size?: number;
}) {
  if (!avatarUrl) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-ws-hover text-[9px] font-medium text-ws-text-muted"
        style={{ width: size, height: size }}
      >
        {login.slice(0, 1).toUpperCase()}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-full"
    />
  );
}

export function GitHubHubToolbar({
  title,
  onBack,
  onRefresh,
  isRefreshing,
  externalUrl,
}: {
  title: string;
  onBack?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  externalUrl?: string;
}) {
  return (
    <div className="flex h-7 shrink-0 items-center justify-between border-b border-ws-border-subtle px-1.5">
      <div className="flex min-w-0 items-center gap-1">
        {onBack ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onBack}
            className="size-5 shrink-0 rounded-sm text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
          >
            <ArrowLeftIcon className="size-3" />
          </Button>
        ) : null}
        <span className="truncate text-[11px] font-medium text-ws-text">
          {title}
        </span>
      </div>
      <div className="flex items-center gap-0.5">
        {onRefresh ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Refresh"
            aria-label="Refresh"
            disabled={isRefreshing}
            onClick={onRefresh}
            className="size-5 rounded-sm text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
          >
            <RefreshCwIcon
              className={cn("size-3", isRefreshing && "animate-spin")}
            />
          </Button>
        ) : null}
        {externalUrl ? (
          <Button
            asChild
            variant="ghost"
            size="icon-sm"
            className="size-5 rounded-sm text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
          >
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open on GitHub"
              aria-label="Open on GitHub"
            >
              <ExternalLinkIcon className="size-3" />
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function GitHubHubErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="space-y-2 px-3 py-4">
      <p className="text-[11px] text-ws-danger-soft">{message}</p>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onRetry}
        className="h-7 text-[11px] text-ws-text-secondary hover:bg-ws-hover hover:text-ws-text"
      >
        Try again
      </Button>
    </div>
  );
}

export function GitHubStateFilterBar({
  value,
  onChange,
}: {
  value: "open" | "closed" | "all";
  onChange: (value: "open" | "closed" | "all") => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {(["open", "closed", "all"] as const).map((state) => (
        <button
          key={state}
          type="button"
          onClick={() => onChange(state)}
          className={cn(
            "rounded-sm px-1.5 py-0.5 text-[10px] capitalize transition-colors",
            value === state
              ? "bg-ws-hover text-ws-text"
              : "text-ws-text-muted hover:text-ws-text",
          )}
        >
          {state}
        </button>
      ))}
    </div>
  );
}

export function GitHubLabelBadges({
  labels,
}: {
  labels: Array<{ name: string; color: string }>;
}) {
  if (labels.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {labels.map((label) => (
        <span
          key={label.name}
          className="rounded-full px-1.5 py-0.5 text-[9px] font-medium"
          style={{
            backgroundColor: `#${label.color}33`,
            color: `#${label.color}`,
          }}
        >
          {label.name}
        </span>
      ))}
    </div>
  );
}

export type GitHubCommentItem = {
  id: number;
  body: string;
  authorLogin: string;
  authorAvatarUrl: string;
  createdAt: string;
};

export function GitHubCommentList({
  comments,
  title = "Comments",
}: {
  comments: GitHubCommentItem[];
  title?: string;
}) {
  return (
    <div className="space-y-2 border-t border-ws-border-subtle pt-3">
      <p className="text-[10px] font-medium tracking-wide text-ws-text-muted uppercase">
        {title} ({comments.length})
      </p>
      {comments.length === 0 ? (
        <p className="text-[11px] text-ws-text-muted">No comments yet.</p>
      ) : (
        <ul className="space-y-2">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="rounded-md border border-ws-border/70 bg-ws-panel/50 p-2.5"
            >
              <div className="mb-1.5 flex items-center gap-2 text-[10px] text-ws-text-muted">
                <GitHubAuthorAvatar
                  login={comment.authorLogin}
                  avatarUrl={comment.authorAvatarUrl}
                  size={16}
                />
                <span className="font-medium text-ws-text-secondary">
                  {comment.authorLogin}
                </span>
                <span>{formatGitHubDate(comment.createdAt)}</span>
              </div>
              <p className="text-[12px] leading-relaxed whitespace-pre-wrap text-ws-text-secondary">
                {comment.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function GitHubReplyBox({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  placeholder = "Write a reply…",
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  placeholder?: string;
}) {
  return (
    <div className="shrink-0 space-y-2 border-t border-ws-border-subtle bg-ws-panel p-2.5">
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        disabled={isSubmitting}
        className="min-h-16 resize-none border-ws-border bg-ws-bg text-[12px] text-ws-text"
      />
      <Button
        type="button"
        size="sm"
        disabled={!value.trim() || isSubmitting}
        onClick={onSubmit}
        className="h-7 bg-ws-accent text-[11px] text-white hover:bg-ws-accent-hover"
      >
        {isSubmitting ? (
          <>
            <Loader2Icon className="size-3.5 animate-spin" />
            Posting…
          </>
        ) : (
          "Reply"
        )}
      </Button>
    </div>
  );
}

export function GitHubLoadingRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-4 text-[11px] text-ws-text-muted">
      <Loader2Icon className="size-3.5 animate-spin" />
      {label}
    </div>
  );
}

export function GitHubDisabledPanel({ message }: { message: string }) {
  return <p className="px-3 py-4 text-[11px] text-ws-text-muted">{message}</p>;
}
