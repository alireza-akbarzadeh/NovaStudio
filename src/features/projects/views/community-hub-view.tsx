"use client";

import { useState } from "react";

import { CommunityProjectsSection } from "@/features/projects/components/workspace/community-projects-section";
import { HubPageHeader } from "@/features/projects/components/workspace/hub-page-header";
import { RequestAccessModal } from "@/features/projects/components/workspace/request-access-modal";
import type { WorkspaceProject } from "@/features/projects/lib/projects-workspace-types";

export function CommunityHubView() {
  const [requestProject, setRequestProject] = useState<WorkspaceProject | null>(
    null,
  );

  return (
    <div className="mx-auto w-full max-w-5xl">
      <HubPageHeader
        title="Community"
        description="Discover public workspaces and request to contribute."
      />
      <CommunityProjectsSection
        embedded
        onRequestAccess={setRequestProject}
      />
      <RequestAccessModal
        project={requestProject}
        open={Boolean(requestProject)}
        onOpenChange={(open) => {
          if (!open) setRequestProject(null);
        }}
      />
    </div>
  );
}
