"use client";

import { ActivityFeedItem } from "@/features/projects/components/workspace/activity-feed-item";
import { SectionHeader } from "@/features/projects/components/workspace/section-header";
import { WORKSPACE_ACTIVITY } from "@/features/projects/lib/projects-workspace-data";

export function ActivityFeedSection() {
  return (
    <section>
      <SectionHeader
        eyebrow="Timeline"
        title="Activity Feed"
        description="Stay in sync with updates across your collaborative workspaces."
      />
      <div className="rounded-[22px] border border-border/60 bg-card/80 p-5 shadow-[0_14px_40px_-30px_rgba(76,29,149,0.4)] backdrop-blur-xl">
        <ul>
          {WORKSPACE_ACTIVITY.map((item, index) => (
            <ActivityFeedItem
              key={item.id}
              item={item}
              isLast={index === WORKSPACE_ACTIVITY.length - 1}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
