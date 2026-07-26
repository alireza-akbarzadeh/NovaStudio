"use client";

import Link from "next/link";

import { ActivityFeedItem } from "@/features/projects/components/workspace/activity-feed-item";
import { HubPageHeader } from "@/features/projects/components/workspace/hub-page-header";
import { useWorkspaceActivity } from "@/features/projects/hooks/use-workspace";
import { Skeleton } from "@/components/ui/skeleton";

export function ActivityHubView() {
  const activity = useWorkspaceActivity(40);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <HubPageHeader
        title="Activity"
        description="Updates across every project you own or collaborate on."
      />
      <div className="rounded-[22px] border border-border/60 bg-card/80 p-5 shadow-[0_14px_40px_-30px_rgba(76,29,149,0.4)] backdrop-blur-xl">
        {activity === undefined ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : activity.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No activity yet. Create or update a project to see it here.
          </p>
        ) : (
          <ul>
            {activity.map((item, index) => (
              <li key={item.id}>
                <ActivityFeedItem
                  item={item}
                  isLast={index === activity.length - 1}
                />
                {item.projectId ? (
                  <div className="-mt-3 mb-4 ml-11">
                    <Link
                      href={`/projects/${item.projectId}`}
                      className="text-[11px] font-medium text-primary hover:underline"
                    >
                      Open {item.projectName ?? "project"}
                    </Link>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
