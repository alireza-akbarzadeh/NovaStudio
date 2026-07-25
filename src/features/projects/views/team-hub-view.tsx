"use client";

import { HubPageHeader } from "@/features/projects/components/workspace/hub-page-header";

export function TeamHubView() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <HubPageHeader
        title="Team"
        description="Invite collaborators and manage roles across your shared projects."
      />
      <div className="rounded-[22px] border border-dashed border-border/70 bg-card/50 px-6 py-16 text-center backdrop-blur-xl">
        <h2 className="text-lg font-semibold tracking-tight">Team hub coming soon</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          For now, invite people from a project’s sharing settings. Org-wide
          seats and roles will land here.
        </p>
      </div>
    </div>
  );
}
