"use client";

import { CheckIcon, XIcon } from "lucide-react";

import {
  useDecideAccessRequest,
  usePendingAccessRequests,
} from "@/features/projects/hooks/use-workspace";
import type { Id } from "@/convex/_generated/dataModel";

export function SidebarRequestsWidget() {
  const requests = usePendingAccessRequests();
  const decide = useDecideAccessRequest();

  return (
    <section className="rounded-[20px] border border-border/60 bg-card/80 p-4 shadow-[0_12px_36px_-28px_rgba(76,29,149,0.4)] backdrop-blur-xl">
      <h3 className="text-sm font-semibold tracking-tight">Pending Requests</h3>
      {requests === undefined ? (
        <p className="mt-3 text-xs text-muted-foreground">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          No pending contribution requests.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {requests.map((item) => (
            <li key={item.id} className="flex items-center gap-2.5">
              <span
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                style={{ backgroundColor: item.color }}
              >
                {item.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{item.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {item.role} · {item.project}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="inline-flex size-7 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-600 transition hover:bg-emerald-500/20"
                  aria-label="Accept"
                  onClick={() =>
                    void decide({
                      requestId: item.id as Id<"projectAccessRequests">,
                      decision: "approved",
                    })
                  }
                >
                  <CheckIcon className="size-3.5" />
                </button>
                <button
                  type="button"
                  className="inline-flex size-7 items-center justify-center rounded-full bg-rose-500/12 text-rose-600 transition hover:bg-rose-500/20"
                  aria-label="Decline"
                  onClick={() =>
                    void decide({
                      requestId: item.id as Id<"projectAccessRequests">,
                      decision: "denied",
                    })
                  }
                >
                  <XIcon className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
