"use client";

import { SparklesIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import type { Id } from "@/convex/_generated/dataModel";
import { parseConvexErrorMessage } from "@/features/github/lib/github-errors";
import { useSetCommunityFeatured } from "@/features/projects/hooks/use-project-details";
import type { ProjectDetailsData } from "@/features/projects/lib/project-details-types";
import { cn } from "@/lib/utils";

type ProjectDetailsFeaturedBannerProps = {
  projectId: string;
  details: ProjectDetailsData;
};

export function ProjectDetailsFeaturedBanner({
  projectId,
  details,
}: ProjectDetailsFeaturedBannerProps) {
  const setFeatured = useSetCommunityFeatured();
  const [featured, setFeaturedState] = useState(details.communityFeatured);
  const [pending, setPending] = useState(false);

  if (!details.viewer.isOwner || details.visibility !== "public") {
    return null;
  }

  async function handleFeaturedChange(checked: boolean) {
    setPending(true);
    try {
      await setFeatured({
        projectId: projectId as Id<"projects">,
        featured: checked,
      });
      setFeaturedState(checked);
      toast.success(
        checked
          ? "Project featured on the community hub"
          : "Removed from featured projects",
      );
    } catch (error) {
      toast.error(
        parseConvexErrorMessage(error, "Could not update featured status"),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className={cn(
        "mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border px-4 py-3",
        featured
          ? "border-violet-500/25 bg-violet-500/8"
          : "border-border/60 bg-muted/20",
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-xl",
            featured
              ? "bg-violet-500/15 text-violet-600 dark:text-violet-300"
              : "bg-muted text-muted-foreground",
          )}
        >
          <SparklesIcon className="size-4" />
        </span>
        <div>
          <p className="text-sm font-medium">
            {featured ? "Featured on community hub" : "Feature on community hub"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {featured
              ? "This project appears in the spotlight row at the top of Community."
              : "Pin this public project to the featured row so more developers discover it."}
          </p>
        </div>
      </div>
      <Switch
        checked={featured}
        disabled={pending}
        onCheckedChange={(checked) => void handleFeaturedChange(checked)}
        aria-label="Feature project on community hub"
      />
    </div>
  );
}
