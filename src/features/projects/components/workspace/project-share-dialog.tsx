"use client";

import { CopyIcon, GlobeIcon, LockIcon, SparklesIcon, UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Id } from "@/convex/_generated/dataModel";
import { parseConvexErrorMessage } from "@/features/github/lib/github-errors";
import { useSetCommunityFeatured } from "@/features/projects/hooks/use-project-details";
import { useUpdateProjectMeta } from "@/features/projects/hooks/use-workspace";
import type { WorkspaceProject } from "@/features/projects/lib/projects-workspace-types";
import { ProjectSharingPanel } from "@/features/settings/components/project-sharing-panel";

type ProjectShareDialogProps = {
  project: WorkspaceProject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProjectShareDialog({
  project,
  open,
  onOpenChange,
}: ProjectShareDialogProps) {
  const updateMeta = useUpdateProjectMeta();
  const setFeatured = useSetCommunityFeatured();
  const [isPublic, setIsPublic] = useState(false);
  const [featured, setFeaturedState] = useState(false);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [savingFeatured, setSavingFeatured] = useState(false);

  useEffect(() => {
    if (!project) return;
    setIsPublic(project.visibility === "public");
    setFeaturedState(Boolean(project.featured));
  }, [project]);

  if (!project) return null;

  const communityUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/projects/community`
      : "/projects/community";
  const projectUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/projects/${project.id}`
      : `/projects/${project.id}`;

  async function handleVisibilityChange(checked: boolean) {
    if (!project) return;
    setSavingVisibility(true);
    try {
      await updateMeta({
        projectId: project.id as Id<"projects">,
        visibility: checked ? "public" : "private",
      });
      setIsPublic(checked);
      if (!checked) {
        setFeaturedState(false);
      }
      toast.success(
        checked
          ? "Project is now public — developers can discover it and request access"
          : "Project is now private",
      );
    } catch (error) {
      toast.error(
        parseConvexErrorMessage(error, "Could not update visibility"),
      );
    } finally {
      setSavingVisibility(false);
    }
  }

  async function handleFeaturedChange(checked: boolean) {
    if (!project) return;
    setSavingFeatured(true);
    try {
      await setFeatured({
        projectId: project.id as Id<"projects">,
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
      setSavingFeatured(false);
    }
  }

  async function copyLink(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy link");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[24px] border-border/70 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Share project</DialogTitle>
          <DialogDescription>
            Publish to the community or invite teammates to collaborate on{" "}
            <span className="font-medium text-foreground">{project.name}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {isPublic ? (
                    <GlobeIcon className="size-4" />
                  ) : (
                    <LockIcon className="size-4" />
                  )}
                </span>
                <div>
                  <Label htmlFor="public-toggle" className="text-sm font-semibold">
                    {isPublic ? "Public project" : "Private project"}
                  </Label>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {isPublic
                      ? "Other developers can browse this project in Community and send access requests to contribute."
                      : "Only you and invited members can see this project."}
                  </p>
                </div>
              </div>
              <Switch
                id="public-toggle"
                checked={isPublic}
                disabled={savingVisibility || !project.isOwner}
                onCheckedChange={(checked) => void handleVisibilityChange(checked)}
              />
            </div>

            {isPublic ? (
              <div className="mt-4 space-y-4 border-t border-border/50 pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
                      <SparklesIcon className="size-4" />
                    </span>
                    <div>
                      <Label
                        htmlFor="featured-toggle"
                        className="text-sm font-semibold"
                      >
                        Feature on community hub
                      </Label>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Pin this project to the spotlight row at the top of
                        Community.
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="featured-toggle"
                    checked={featured}
                    disabled={savingFeatured || !project.isOwner}
                    onCheckedChange={(checked) =>
                      void handleFeaturedChange(checked)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Public links
                  </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 justify-start rounded-xl text-xs"
                    onClick={() => void copyLink(projectUrl, "Project link")}
                  >
                    <CopyIcon className="size-3.5 shrink-0" />
                    Copy project link
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 justify-start rounded-xl text-xs"
                    onClick={() => void copyLink(communityUrl, "Community link")}
                  >
                    <CopyIcon className="size-3.5 shrink-0" />
                    Copy community page
                  </Button>
                </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <UsersIcon className="size-4 text-primary" />
              Invite teammates
            </div>
            <ProjectSharingPanel
              projectId={project.id}
              canManage={project.isOwner ?? true}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
