"use client";

import { Loader2Icon, PlayCircleIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Id } from "@/convex/_generated/dataModel";
import { parseConvexErrorMessage } from "@/features/github/lib/github-errors";
import {
  useGenerateDemoUploadUrl,
  useRemoveProjectDemoVideo,
  useSetProjectDemoVideo,
} from "@/features/projects/hooks/use-project-details";
import type { ProjectDetailsDemo } from "@/features/projects/lib/project-details-types";

const MAX_DEMO_VIDEO_BYTES = 100 * 1024 * 1024;

type ProjectDetailsDemoDialogProps = {
  projectId: string;
  demo: ProjectDetailsDemo | null;
  canManageDemo: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProjectDetailsDemoDialog({
  projectId,
  demo,
  canManageDemo,
  open,
  onOpenChange,
}: ProjectDetailsDemoDialogProps) {
  const generateUploadUrl = useGenerateDemoUploadUrl();
  const setProjectDemoVideo = useSetProjectDemoVideo();
  const removeProjectDemoVideo = useRemoveProjectDemoVideo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function handleUpload(file: File) {
    if (!file.type.startsWith("video/")) {
      toast.error("Please choose a video file");
      return;
    }
    if (file.size > MAX_DEMO_VIDEO_BYTES) {
      toast.error("Demo video must be 100 MB or smaller");
      return;
    }

    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl({
        projectId: projectId as Id<"projects">,
      });
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      const { storageId } = (await response.json()) as {
        storageId: Id<"_storage">;
      };

      await setProjectDemoVideo({
        projectId: projectId as Id<"projects">,
        storageId,
        filename: file.name,
        mediaType: file.type || "video/mp4",
      });
      toast.success("Demo video uploaded");
    } catch (error) {
      toast.error(parseConvexErrorMessage(error, "Could not upload demo video"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleRemove() {
    setRemoving(true);
    try {
      await removeProjectDemoVideo({
        projectId: projectId as Id<"projects">,
      });
      toast.success("Demo video removed");
    } catch (error) {
      toast.error(parseConvexErrorMessage(error, "Could not remove demo video"));
    } finally {
      setRemoving(false);
    }
  }

  const hasDemo = Boolean(demo?.url);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlayCircleIcon className="size-4 text-primary" />
            {hasDemo ? "Project demo" : "Add a demo video"}
          </DialogTitle>
          <DialogDescription>
            {hasDemo
              ? "Watch a walkthrough of this project."
              : canManageDemo
                ? "Upload a short video to show what this project does."
                : "This project has not published a demo yet."}
          </DialogDescription>
        </DialogHeader>

        {hasDemo ? (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-black">
              <video
                key={demo!.url}
                src={demo!.url}
                controls
                playsInline
                className="aspect-video w-full bg-black"
              >
                <track kind="captions" />
              </video>
            </div>
            <p className="text-xs text-muted-foreground">{demo!.filename}</p>
          </div>
        ) : canManageDemo ? (
          <div className="space-y-4 rounded-2xl border border-dashed border-border/70 px-6 py-10 text-center">
            <UploadIcon className="mx-auto size-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Upload a demo video</p>
              <p className="mt-1 text-xs text-muted-foreground">
                MP4, WebM, or MOV · up to 100 MB
              </p>
            </div>
            <Input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleUpload(file);
              }}
            />
            <Button
              type="button"
              className="rounded-xl"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <UploadIcon className="size-4" />
              )}
              {uploading ? "Uploading…" : "Choose video file"}
            </Button>
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
            No demo video available yet.
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {hasDemo && canManageDemo ? (
            <>
              <Input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleUpload(file);
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={uploading || removing}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? "Uploading…" : "Replace video"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl text-destructive hover:text-destructive"
                disabled={uploading || removing}
                onClick={() => void handleRemove()}
              >
                {removing ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <Trash2Icon className="size-4" />
                )}
                Remove
              </Button>
            </>
          ) : null}
          <Button
            type="button"
            variant={hasDemo || !canManageDemo ? "default" : "outline"}
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
