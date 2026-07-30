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

export function useCommunityProjectActivity(projectId: string | null) {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(
    api.projectCommunity.listCommunityProjectActivity,
    isAuthenticated && projectId
      ? { projectId: projectId as Id<"projects"> }
      : "skip",
  );
}

export function useProjectContributorLeaderboard(projectId: string | null) {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(
    api.projectCommunity.listProjectContributorLeaderboard,
    isAuthenticated && projectId
      ? { projectId: projectId as Id<"projects"> }
      : "skip",
  );
}

export function useCommunityDiscussions(projectId: string | null) {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(
    api.projectCommunityDiscussion.listCommunityDiscussions,
    isAuthenticated && projectId
      ? { projectId: projectId as Id<"projects"> }
      : "skip",
  );
}

export function usePostCommunityDiscussion() {
  return useMutation(api.projectCommunityDiscussion.postCommunityDiscussion);
}

export function useReplyToCommunityDiscussion() {
  return useMutation(api.projectCommunityDiscussion.replyToCommunityDiscussion);
}

export function useDeleteCommunityDiscussion() {
  return useMutation(api.projectCommunityDiscussion.deleteCommunityDiscussion);
}

export function useProjectPendingAccessRequests(projectId: string | null) {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(
    api.projectCommunity.listProjectPendingAccessRequests,
    isAuthenticated && projectId
      ? { projectId: projectId as Id<"projects"> }
      : "skip",
  );
}

export function useDecideAccessRequest() {
  return useMutation(api.workspaceActions.decideAccessRequest);
}

export function useRecordProjectView() {
  return useMutation(api.projectCommunity.recordProjectView);
}

export function useToggleProjectStar() {
  return useMutation(api.projectCommunity.toggleProjectStar);
}

export function useToggleProjectFollow() {
  return useMutation(api.projectCommunity.toggleProjectFollow);
}

export function useRecordProjectDownload() {
  return useMutation(api.projectCommunity.recordProjectDownload);
}

export function useToggleFeatureUpvote() {
  return useMutation(api.projectCommunity.toggleFeatureUpvote);
}

export function useSetCommunityFeatured() {
  return useMutation(api.projectCommunity.setCommunityFeatured);
}

export function useProposeFeature() {
  return useMutation(api.projectCommunity.proposeFeature);
}

export function useJoinAsSponsor() {
  return useMutation(api.projectCommunity.joinAsSponsor);
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

export function useGenerateDemoUploadUrl() {
  return useMutation(api.projectCommunity.generateDemoUploadUrl);
}

export function useSetProjectDemoVideo() {
  return useMutation(api.projectCommunity.setProjectDemoVideo);
}

export function useRemoveProjectDemoVideo() {
  return useMutation(api.projectCommunity.removeProjectDemoVideo);
}

export function useForkPublicProject() {
  return useMutation(api.projectCommunity.forkPublicProject);
}
