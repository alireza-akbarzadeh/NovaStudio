"use client";

import { useMutation } from "convex/react";
import {
  BellIcon,
  BellOffIcon,
  MoreVerticalIcon,
  MinusIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { usePushSubscription } from "@/features/notifications/hooks/use-push-subscription";
import {
  getSoundPrefs,
  playSoundIfEnabled,
  setSoundPrefs,
} from "@/features/notifications/lib/play-sound";
import { useWorkspaceNotifications } from "@/features/projects/hooks/use-workspace";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";

const toneDot = {
  violet: "bg-violet-500",
  green: "bg-emerald-500",
  blue: "bg-sky-500",
  orange: "bg-orange-500",
} as const;

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

export function WorkspaceNotificationsPanel() {
  const open = useWorkspaceStore((s) => s.notificationsPanelOpen);
  const closeNotificationsPanel = useWorkspaceStore(
    (s) => s.closeNotificationsPanel,
  );
  const notifications = useWorkspaceNotifications(50);
  const markRead = useMutation(api.workspaceActions.markNotificationRead);
  const push = usePushSubscription();
  const [soundsOn, setSoundsOn] = useState(true);

  useEffect(() => {
    setSoundsOn(getSoundPrefs().enabled);
  }, []);

  if (!open) return null;

  const toggleSounds = () => {
    const next = setSoundPrefs({ enabled: !soundsOn });
    setSoundsOn(next.enabled);
    if (next.enabled) void playSoundIfEnabled("aiDone");
  };

  const togglePush = async () => {
    try {
      if (push.subscribed) {
        await push.disablePush();
        toast.success("Push notifications disabled");
      } else {
        await push.enablePush();
        toast.success("Push notifications enabled");
        void playSoundIfEnabled("success");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update push",
      );
    }
  };

  const onActivate = async (
    id: string,
    read: boolean | undefined,
  ) => {
    if (read) return;
    try {
      await markRead({
        notificationId: id as Id<"notifications">,
      });
    } catch {
      // Ignore — list will refresh on next sync.
    }
  };

  return (
    <aside
      aria-label="Notifications"
      className="flex h-full w-[min(420px,42vw)] shrink-0 flex-col overflow-hidden rounded-[10px] border border-ws-border-subtle bg-ws-panel shadow-[0_1px_0_color-mix(in_oklab,var(--ws-text)_4%,transparent)]"
    >
      <header className="flex h-10 shrink-0 items-center gap-2 border-b border-ws-border-subtle px-3">
        <h2 className="flex-1 truncate text-[13px] font-semibold tracking-tight text-ws-text">
          Notifications
        </h2>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 rounded-md text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
              aria-label="Notification options"
            >
              <MoreVerticalIcon className="size-3.5" strokeWidth={1.75} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-52 border-ws-border bg-ws-panel text-ws-text"
          >
            <DropdownMenuItem
              className="gap-2 text-[12px]"
              onClick={toggleSounds}
            >
              {soundsOn ? (
                <Volume2Icon className="size-3.5" strokeWidth={1.75} />
              ) : (
                <VolumeXIcon className="size-3.5" strokeWidth={1.75} />
              )}
              {soundsOn ? "Sounds on" : "Sounds muted"}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 text-[12px]"
              disabled={push.busy || !push.configured}
              onClick={() => void togglePush()}
            >
              {push.subscribed ? (
                <BellIcon className="size-3.5 text-ws-accent" strokeWidth={1.75} />
              ) : (
                <BellOffIcon className="size-3.5" strokeWidth={1.75} />
              )}
              {push.subscribed ? "Push enabled" : "Enable push"}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-ws-border-subtle" />
            <DropdownMenuItem
              className="gap-2 text-[12px]"
              onClick={closeNotificationsPanel}
            >
              <MinusIcon className="size-3.5" strokeWidth={1.75} />
              Hide notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 rounded-md text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
          aria-label="Hide notifications"
          onClick={closeNotificationsPanel}
        >
          <MinusIcon className="size-3.5" strokeWidth={1.75} />
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {notifications === undefined ? (
          <p className="px-4 py-6 text-center text-[12px] text-ws-text-muted">
            Loading…
          </p>
        ) : notifications.length === 0 ? (
          <div className="flex h-full min-h-55 items-center justify-center px-8">
            <p className="max-w-55 text-center text-[13px] leading-relaxed text-ws-text-muted">
              Suggestions, events,
              <br />
              and errors will appear here
            </p>
          </div>
        ) : (
          <ul className="flex flex-col py-1">
            {notifications.map((item) => {
              const content = (
                <>
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      toneDot[item.tone as keyof typeof toneDot] ??
                        toneDot.violet,
                      item.read && "opacity-40",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-[12px] leading-snug",
                        item.read
                          ? "font-normal text-ws-text-secondary"
                          : "font-medium text-ws-text",
                      )}
                    >
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ws-text-muted">
                      {item.time}
                    </p>
                  </div>
                  {!item.read ? (
                    <span
                      aria-hidden
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ws-accent"
                    />
                  ) : null}
                </>
              );

              const rowClass = cn(
                "flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors",
                "hover:bg-ws-hover",
                !item.read && "bg-ws-accent/4",
              );

              if (item.href) {
                if (isExternalHref(item.href)) {
                  return (
                    <li key={item.id}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={rowClass}
                        onClick={() => void onActivate(item.id, item.read)}
                      >
                        {content}
                      </a>
                    </li>
                  );
                }

                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={rowClass}
                      onClick={() => void onActivate(item.id, item.read)}
                    >
                      {content}
                    </Link>
                  </li>
                );
              }

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={rowClass}
                    onClick={() => void onActivate(item.id, item.read)}
                  >
                    {content}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
