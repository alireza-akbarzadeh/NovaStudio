"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useConvexAuth, useMutation, useQuery } from "convex/react";

export function useProjectDetails(projectId: string | null) {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(
    api.projectCommunity.getProjectDetails,
    isAuthenticated && projectId
      ? { projectId: projectId as Id<"projects"> }
      : "skip",
  );
}

export function useRecordProjectView() {
  return useMutation(api.projectCommunity.recordProjectView);
}

export function useToggleProjectStar() {
  return useMutation(api.projectCommunity.toggleProjectStar);
}

export function useRecordProjectDownload() {
  return useMutation(api.projectCommunity.recordProjectDownload);
}

export function useProposeFeature() {
  return useMutation(api.projectCommunity.proposeFeature);
}

export function useUpsertPublicTodo() {
  return useMutation(api.projectCommunity.upsertPublicTodo);
}

export function useDeletePublicTodo() {
  return useMutation(api.projectCommunity.deletePublicTodo);
}

export function useUpdateFeatureStatus() {
  return useMutation(api.projectCommunity.updateFeatureStatus);
}

export function useSeedDefaultPublicContent() {
  return useMutation(api.projectCommunity.seedDefaultPublicContent);
}
