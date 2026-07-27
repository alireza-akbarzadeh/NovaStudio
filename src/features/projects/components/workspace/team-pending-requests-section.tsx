"use client";

import { CheckIcon, ExternalLinkIcon, XIcon } from "lucide-react";
import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import type { Id } from "@/convex/_generated/dataModel";
import {
  useDecideAccessRequest,
  usePendingAccessRequests,
} from "@/features/projects/hooks/use-workspace";
import { cn } from "@/lib/utils";

function formatRelativeTime(timestamp: number) {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function TeamPendingRequestsSection() {
  const requests = usePendingAccessRequests();
  const decide = useDecideAccessRequest();

  if (requests === undefined) {
    return (
      <section className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-28 rounded-[20px]" />
      </section>
    );
  }

  if (requests.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-tight">
          Pending access requests
        </h2>
        <span className="text-[11px] text-muted-foreground">
          {requests.length} awaiting review
        </span>
      </div>

      <ul className="space-y-3">
        {requests.map((item) => (
          <li
            key={item.id}
            className="rounded-[20px] border border-border/60 bg-card/80 p-4 backdrop-blur-xl"
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
                  <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:text-violet-300">
                    {item.role}
                  </span>
                  {item.experienceLevel ? (
                    <span className="text-[10px] text-muted-foreground">
                      · {item.experienceLevel}
                    </span>
                  ) : null}
                </div>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  Wants to join{" "}
                  <Link
                    href={`/projects/${item.projectId}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {item.project}
                  </Link>
                  <span className="ml-1.5 opacity-60">
                    · {formatRelativeTime(item.createdAt)}
                  </span>
                </p>

                {item.message ? (
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                    {item.message}
                  </p>
                ) : null}

                {(item.github || item.portfolioUrl) ? (
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
                  </div>
                ) : null}
              </div>

              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  className={cn(
                    "inline-flex size-8 items-center justify-center rounded-full",
                    "bg-emerald-500/12 text-emerald-600 transition hover:bg-emerald-500/20",
                  )}
                  aria-label={`Approve ${item.name}`}
                  onClick={() =>
                    void decide({
                      requestId: item.id as Id<"projectAccessRequests">,
                      decision: "approved",
                    })
                  }
                >
                  <CheckIcon className="size-4" />
                </button>
                <button
                  type="button"
                  className={cn(
                    "inline-flex size-8 items-center justify-center rounded-full",
                    "bg-rose-500/12 text-rose-600 transition hover:bg-rose-500/20",
                  )}
                  aria-label={`Decline ${item.name}`}
                  onClick={() =>
                    void decide({
                      requestId: item.id as Id<"projectAccessRequests">,
                      decision: "denied",
                    })
                  }
                >
                  <XIcon className="size-4" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
