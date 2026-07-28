"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type { Id } from "@/convex/_generated/dataModel";
import { parseConvexErrorMessage } from "@/features/github/lib/github-errors";
import { useOpenWorkspaceProject } from "@/features/projects/hooks/use-open-workspace-project";
import {
  useProjectDetails,
  useProposeFeature,
  useRecordProjectDownload,
  useRecordProjectView,
  useSeedDefaultPublicContent,
  useToggleProjectStar,
} from "@/features/projects/hooks/use-project-details";
import type { ProjectDetailsData } from "@/features/projects/lib/project-details-types";

export function useProjectDetailsPage(projectId: string) {
  const router = useRouter();
  const details = useProjectDetails(projectId);
  const recordView = useRecordProjectView();
  const toggleStar = useToggleProjectStar();
  const recordDownload = useRecordProjectDownload();
  const proposeFeature = useProposeFeature();
  const seedContent = useSeedDefaultPublicContent();
  const { openProject, isPending: opening } = useOpenWorkspaceProject();
  const viewedRef = useRef(false);
  const seededRef = useRef(false);

  const [starPending, setStarPending] = useState(false);
  const [localStars, setLocalStars] = useState<number | null>(null);
  const [localStarred, setLocalStarred] = useState<boolean | null>(null);

  useEffect(() => {
    if (!projectId || viewedRef.current) return;
    viewedRef.current = true;
    void recordView({ projectId: projectId as Id<"projects"> });
  }, [projectId, recordView]);

  useEffect(() => {
    if (!details) return;
    setLocalStars(details.stats.stars);
    setLocalStarred(details.viewer.hasStarred);
  }, [details]);

  useEffect(() => {
    if (!details || seededRef.current) return;
    if (
      details.viewer.isOwner &&
      details.todos.length === 0 &&
      details.features.length === 0
    ) {
      seededRef.current = true;
      void seedContent({ projectId: projectId as Id<"projects"> });
    }
  }, [details, projectId, seedContent]);

  const resolvedDetails = details as ProjectDetailsData | null | undefined;

  const starred = localStarred ?? resolvedDetails?.viewer.hasStarred ?? false;
  const stars = localStars ?? resolvedDetails?.stats.stars ?? 0;
  const requestStatus = resolvedDetails?.viewer.accessRequestStatus;
  const canOpen = Boolean(
    resolvedDetails &&
      (resolvedDetails.viewer.isMember ||
        resolvedDetails.viewer.canEdit ||
        resolvedDetails.viewer.isOwner),
  );

  async function handleStar() {
    setStarPending(true);
    try {
      const result = await toggleStar({
        projectId: projectId as Id<"projects">,
      });
      setLocalStarred(result.starred);
      setLocalStars(result.stars);
    } catch (error) {
      toast.error(parseConvexErrorMessage(error, "Could not update star"));
    } finally {
      setStarPending(false);
    }
  }

  async function handleDownload(githubRepoUrl?: string) {
    try {
      await recordDownload({ projectId: projectId as Id<"projects"> });
      if (githubRepoUrl) {
        window.open(githubRepoUrl, "_blank", "noopener,noreferrer");
      } else {
        toast.message("No repository linked yet");
      }
    } catch (error) {
      toast.error(parseConvexErrorMessage(error, "Could not record download"));
    }
  }

  async function handleProposeFeature(input: {
    title: string;
    description?: string;
    sponsorMessage?: string;
    sponsorAmount?: string;
  }) {
    await proposeFeature({
      projectId: projectId as Id<"projects">,
      title: input.title,
      description: input.description,
      sponsorMessage: input.sponsorMessage,
      sponsorAmount: input.sponsorAmount,
    });
    toast.success("Feature proposal submitted");
  }

  function requestAccess(onRequestAccess?: () => void) {
    if (onRequestAccess) {
      onRequestAccess();
      return;
    }
    router.push(`/projects/community?request=${projectId}`);
  }

  return {
    details: resolvedDetails,
    projectId,
    opening,
    starPending,
    starred,
    stars,
    requestStatus,
    canOpen,
    openProject,
    handleStar,
    handleDownload,
    handleProposeFeature,
    requestAccess,
  };
}
