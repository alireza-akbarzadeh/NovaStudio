"use client";

import {
  CheckIcon,
  ExternalLinkIcon,
  InboxIcon,
  Loader2Icon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import type { Id } from "@/convex/_generated/dataModel";
import { parseConvexErrorMessage } from "@/features/github/lib/github-errors";
import {
  useDecideAccessRequest,
  useProjectPendingAccessRequests,
} from "@/features/projects/hooks/use-project-details";
import { cn } from "@/lib/utils";

type ProjectDetailsAccessInboxSectionProps = {
  projectId: string;
  canManage: boolean;
};

export function ProjectDetailsAccessInboxSection({
  projectId,
  canManage,
}: ProjectDetailsAccessInboxSectionProps) {
  const requests = useProjectPendingAccessRequests(
    canManage ? projectId : null,
  );
  const decide = useDecideAccessRequest();
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (!canManage) return null;

  async function handleDecision(
    requestId: string,
    decision: "approved" | "denied",
  ) {
    setPendingId(requestId);
    try {
      await decide({
        requestId: requestId as Id<"projectAccessRequests">,
        decision,
      });
      toast.success(
        decision === "approved" ? "Access approved" : "Request declined",
      );
    } catch (error) {
      toast.error(
        parseConvexErrorMessage(error, "Could not update access request"),
      );
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="rounded-[24px] border border-border/60 bg-card/85 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <InboxIcon className="size-4 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">
              Access requests
            </h2>
            {requests && requests.length > 0 ? (
              <Badge variant="secondary" className="rounded-full text-[10px]">
                {requests.length} pending
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Review contributors who want to join this project.
          </p>
        </div>
      </div>

      {requests === undefined ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Loading requests…
        </div>
      ) : requests === null ? null : requests.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
          No pending access requests.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {requests.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-border/50 bg-muted/10 p-4"
            >
              <div className="flex items-start gap-3">
                <span
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold text-white"
                  style={{ backgroundColor: item.color }}
                >
                  {item.initials}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold tracking-tight">
                      {item.name}
                    </p>
                    <Badge
                      variant="outline"
                      className="rounded-full text-[10px] capitalize"
                    >
                      {item.role}
                    </Badge>
                    {item.experienceLevel ? (
                      <span className="text-[10px] text-muted-foreground">
                        · {item.experienceLevel}
                      </span>
                    ) : null}
                  </div>

                  {item.email ? (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {item.email}
                    </p>
                  ) : null}

                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Requested {item.time}
                  </p>

                  {item.message ? (
                    <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-muted-foreground">
                      {item.message}
                    </p>
                  ) : null}

                  {(item.github || item.portfolioUrl || item.linkedin) ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.github ? (
                        <a
                          href={
                            item.github.startsWith("http")
                              ? item.github
                              : `https://github.com/${item.github.replace(/^@/, "")}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2.5 py-1 text-[11px] text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                        >
                          GitHub
                          <ExternalLinkIcon className="size-3 opacity-60" />
                        </a>
                      ) : null}
                      {item.portfolioUrl ? (
                        <a
                          href={item.portfolioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2.5 py-1 text-[11px] text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                        >
                          Portfolio
                          <ExternalLinkIcon className="size-3 opacity-60" />
                        </a>
                      ) : null}
                      {item.linkedin ? (
                        <a
                          href={
                            item.linkedin.startsWith("http")
                              ? item.linkedin
                              : `https://linkedin.com/in/${item.linkedin.replace(/^@/, "")}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2.5 py-1 text-[11px] text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                        >
                          LinkedIn
                          <ExternalLinkIcon className="size-3 opacity-60" />
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    disabled={pendingId === item.id}
                    className={cn(
                      "inline-flex size-8 items-center justify-center rounded-full",
                      "bg-emerald-500/12 text-emerald-600 transition hover:bg-emerald-500/20 disabled:opacity-50",
                    )}
                    aria-label={`Approve ${item.name}`}
                    onClick={() => void handleDecision(item.id, "approved")}
                  >
                    {pendingId === item.id ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <CheckIcon className="size-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={pendingId === item.id}
                    className={cn(
                      "inline-flex size-8 items-center justify-center rounded-full",
                      "bg-rose-500/12 text-rose-600 transition hover:bg-rose-500/20 disabled:opacity-50",
                    )}
                    aria-label={`Decline ${item.name}`}
                    onClick={() => void handleDecision(item.id, "denied")}
                  >
                    <XIcon className="size-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
