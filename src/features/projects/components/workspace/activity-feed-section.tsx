"use client";

import { useRouter } from "next/navigation";

import { ActivityFeedItem } from "@/features/projects/components/workspace/activity-feed-item";
import { SectionHeader } from "@/features/projects/components/workspace/section-header";
import { useWorkspaceActivity } from "@/features/projects/hooks/use-workspace";
import { Skeleton } from "@/components/ui/skeleton";

export function ActivityFeedSection() {
  const activity = useWorkspaceActivity();
  const router = useRouter();

  return (
    <section>
      <SectionHeader
        eyebrow="Timeline"
        title="Activity Feed"
        description="Stay in sync with updates across your collaborative workspaces."
        actionLabel="View all"
        onAction={() => router.push("/projects/activity")}
      />
      <div className="rounded-[22px] border border-border/60 bg-card/80 p-5 shadow-[0_14px_40px_-30px_rgba(76,29,149,0.4)] backdrop-blur-xl">
        {activity === undefined ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : activity.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No activity yet. Create or update a project to see it here.
          </p>
        ) : (
          <ul>
            {activity.map((item, index) => (
              <ActivityFeedItem
                key={item.id}
                item={item}
                isLast={index === activity.length - 1}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
