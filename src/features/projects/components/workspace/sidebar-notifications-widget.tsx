"use client";

import { useWorkspaceNotifications } from "@/features/projects/hooks/use-workspace";
import { cn } from "@/lib/utils";

const toneDot = {
  violet: "bg-violet-500",
  green: "bg-emerald-500",
  blue: "bg-sky-500",
  orange: "bg-orange-500",
} as const;

export function SidebarNotificationsWidget() {
  const notifications = useWorkspaceNotifications();

  return (
    <section className="rounded-[20px] border border-border/60 bg-card/80 p-4 shadow-[0_12px_36px_-28px_rgba(76,29,149,0.4)] backdrop-blur-xl">
      <h3 className="text-sm font-semibold tracking-tight">
        Recent Notifications
      </h3>
      {notifications === undefined ? (
        <p className="mt-3 text-xs text-muted-foreground">Loading…</p>
      ) : notifications.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          You&apos;re all caught up.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {notifications.map((item) => (
            <li key={item.id} className="flex items-start gap-2.5">
              <span
                className={cn(
                  "mt-1.5 size-2 shrink-0 rounded-full",
                  toneDot[item.tone as keyof typeof toneDot] ?? toneDot.violet,
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs leading-snug font-medium">{item.title}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {item.time}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
