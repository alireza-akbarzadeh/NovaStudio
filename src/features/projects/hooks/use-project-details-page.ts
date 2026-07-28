"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type { Id } from "@/convex/_generated/dataModel";
import { parseConvexErrorMessage } from "@/features/github/lib/github-errors";
import { toGitHubUrl } from "@/features/github/lib/github-url";
import { useOpenWorkspaceProject } from "@/features/projects/hooks/use-open-workspace-project";
import {
  useProjectDetails,
  useJoinAsSponsor,
  useProposeFeature,
  useRecordProjectDownload,
  useRecordProjectView,
  useSeedDefaultPublicContent,
  useToggleFeatureUpvote,
  useToggleProjectFollow,
  useToggleProjectStar,
} from "@/features/projects/hooks/use-project-details";
import type { ProjectDetailsData } from "@/features/projects/lib/project-details-types";

export function useProjectDetailsPage(projectId: string) {
  const router = useRouter();
  const details = useProjectDetails(projectId);
  const recordView = useRecordProjectView();
  const toggleStar = useToggleProjectStar();
  const toggleFollow = useToggleProjectFollow();
  const recordDownload = useRecordProjectDownload();
  const proposeFeature = useProposeFeature();
  const joinAsSponsor = useJoinAsSponsor();
  const toggleFeatureUpvote = useToggleFeatureUpvote();
  const seedContent = useSeedDefaultPublicContent();
  const { openProject, isPending: opening } = useOpenWorkspaceProject();
  const viewedRef = useRef(false);
  const seededRef = useRef(false);

  const [starPending, setStarPending] = useState(false);
  const [followPending, setFollowPending] = useState(false);
  const [localStars, setLocalStars] = useState<number | null>(null);
  const [localStarred, setLocalStarred] = useState<boolean | null>(null);
  const [localFollowers, setLocalFollowers] = useState<number | null>(null);
  const [localFollowing, setLocalFollowing] = useState<boolean | null>(null);

  useEffect(() => {
    if (!projectId || viewedRef.current) return;
    viewedRef.current = true;
    void recordView({ projectId: projectId as Id<"projects"> });
  }, [projectId, recordView]);

  useEffect(() => {
    if (!details) return;
    setLocalStars(details.stats.stars);
    setLocalStarred(details.viewer.hasStarred);
    setLocalFollowers(details.stats.followers);
    setLocalFollowing(details.viewer.isFollowing);
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
  const following = localFollowing ?? resolvedDetails?.viewer.isFollowing ?? false;
  const followers = localFollowers ?? resolvedDetails?.stats.followers ?? 0;
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

  async function handleFollow() {
    setFollowPending(true);
    try {
      const result = await toggleFollow({
        projectId: projectId as Id<"projects">,
      });
      setLocalFollowing(result.following);
      setLocalFollowers(result.followers);
      toast.success(result.following ? "Following project" : "Unfollowed project");
    } catch (error) {
      toast.error(parseConvexErrorMessage(error, "Could not update follow"));
    } finally {
      setFollowPending(false);
    }
  }

  async function handleDownload(
    isGitHubLinked: boolean,
    githubRepoUrl?: string,
    githubBranch?: string,
  ) {
    try {
      await recordDownload({ projectId: projectId as Id<"projects"> });
      if (isGitHubLinked && githubRepoUrl) {
        window.open(
          toGitHubUrl(githubRepoUrl, { branch: githubBranch }),
          "_blank",
          "noopener,noreferrer",
        );
      } else {
        toast.message("No repository linked yet");
      }
    } catch (error) {
      toast.error(parseConvexErrorMessage(error, "Could not record download"));
    }
  }

  async function handleJoinAsSponsor(input: {
    tier: "supporter" | "backer";
    sponsorMessage?: string;
    sponsorAmount?: string;
  }) {
    await joinAsSponsor({
      projectId: projectId as Id<"projects">,
      tier: input.tier,
      sponsorMessage: input.sponsorMessage,
      sponsorAmount: input.sponsorAmount,
    });
    toast.success(
      input.tier === "backer"
        ? "You're on the sponsor wall as a backer"
        : "You're on the sponsor wall as a supporter",
    );
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

  async function handleUpvoteFeature(featureId: string) {
    return await toggleFeatureUpvote({
      projectId: projectId as Id<"projects">,
      featureId: featureId as Id<"projectFeatureIdeas">,
    });
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
    followPending,
    starred,
    stars,
    following,
    followers,
    requestStatus,
    canOpen,
    openProject,
    handleStar,
    handleFollow,
    handleDownload,
    handleProposeFeature,
    handleJoinAsSponsor,
    handleUpvoteFeature,
    requestAccess,
  };
}
