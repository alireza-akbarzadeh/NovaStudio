"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { RequestAccessModal } from "@/features/projects/components/workspace/request-access-modal";
import { usePublicProjects } from "@/features/projects/hooks/use-workspace";
import { ProjectDetailsView } from "@/features/projects/views/project-details-view";
import type { WorkspaceProject } from "@/features/projects/lib/projects-workspace-types";

type CommunityProjectDetailsClientProps = {
  projectId: string;
};

export function CommunityProjectDetailsClient({
  projectId,
}: CommunityProjectDetailsClientProps) {
  const searchParams = useSearchParams();
  const publicProjects = usePublicProjects();
  const [requestOpen, setRequestOpen] = useState(
    () => searchParams.get("request") === projectId,
  );

  const catalog = useMemo(
    () => (publicProjects ?? []) as WorkspaceProject[],
    [publicProjects],
  );

  const project =
    catalog.find((item) => item.id === projectId) ??
    ({
      id: projectId,
      name: "Project",
      description: "",
      cover: "",
      coverTone: "bg-gradient-to-br from-violet-600 to-indigo-600",
      tech: [],
      status: "in-progress",
      visibility: "public",
      pinned: false,
      progress: 0,
      lastUpdated: "",
      lastOpened: "",
      lastEditedBy: "",
      members: [],
      owner: { name: "Creator", initials: "CR", color: "#BA68C8" },
    } satisfies WorkspaceProject);

  return (
    <>
      <ProjectDetailsView
        projectId={projectId}
        onRequestAccess={() => setRequestOpen(true)}
      />
      <RequestAccessModal
        project={project}
        open={requestOpen}
        onOpenChange={setRequestOpen}
      />
    </>
  );
}
