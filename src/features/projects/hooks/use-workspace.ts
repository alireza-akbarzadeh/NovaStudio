"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect } from "react";

export function useWorkspaceStats() {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(api.workspace.getStats, isAuthenticated ? {} : "skip");
}

export function useWorkspaceActivity(limit = 12) {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(
    api.workspace.listActivity,
    isAuthenticated ? { limit } : "skip",
  );
}

export function useWorkspaceDeadlines(limit = 8) {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(
    api.workspace.listDeadlines,
    isAuthenticated ? { limit } : "skip",
  );
}

export function useTeamDirectory() {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(
    api.workspace.listTeamDirectory,
    isAuthenticated ? {} : "skip",
  );
}

export function useCollectionProjects(collectionId: string | null) {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(
    api.workspaceActions.listCollectionProjects,
    isAuthenticated && collectionId
      ? { collectionId: collectionId as Id<"collections"> }
      : "skip",
  );
}

export function useCreateCollection() {
  return useMutation(api.workspaceActions.createCollection);
}

export function useAddProjectToCollection() {
  return useMutation(api.workspaceActions.addProjectToCollection);
}

export function useRemoveProjectFromCollection() {
  return useMutation(api.workspaceActions.removeProjectFromCollection);
}

export function useCreateDeadline() {
  return useMutation(api.workspaceActions.createDeadline);
}

export function useDeleteDeadline() {
  return useMutation(api.workspaceActions.deleteDeadline);
}

export function useWorkspaceNotifications(limit = 10) {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(
    api.workspace.listNotifications,
    isAuthenticated ? { limit } : "skip",
  );
}

export function useWorkspaceStorage() {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(
    api.workspace.getStorageUsage,
    isAuthenticated ? {} : "skip",
  );
}

export function useWorkspaceProjects() {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(
    api.workspace.listWorkspaceProjects,
    isAuthenticated ? {} : "skip",
  );
}

export function usePublicProjects(limit = 24) {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(
    api.workspace.listPublicProjects,
    isAuthenticated ? { limit } : "skip",
  );
}

export function useWorkspaceCollections() {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(
    api.workspaceActions.listCollections,
    isAuthenticated ? {} : "skip",
  );
}

export function usePendingAccessRequests() {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(
    api.workspaceActions.listPendingAccessRequests,
    isAuthenticated ? {} : "skip",
  );
}

export function useEnsureWorkspaceDefaults() {
  const { isAuthenticated } = useConvexAuth();
  const ensure = useMutation(api.workspaceActions.ensureDefaultCollections);

  useEffect(() => {
    if (!isAuthenticated) return;
    void ensure({});
  }, [ensure, isAuthenticated]);
}

export function useTogglePin() {
  return useMutation(api.workspaceActions.togglePin);
}

export function useDecideAccessRequest() {
  return useMutation(api.workspaceActions.decideAccessRequest);
}

export function useCreateAccessRequest() {
  return useMutation(api.workspaceActions.createAccessRequest);
}
