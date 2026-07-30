"use client";

import { useConvexAuth, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import type { ProjectDocsData } from "@/features/projects/lib/project-details-types";

export function useProjectDocs(projectId: string | null): ProjectDocsData | null | undefined {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(
    api.projectCommunity.getProjectDocs,
    isAuthenticated && projectId
      ? { projectId: projectId as Id<"projects"> }
      : "skip",
  );
}
