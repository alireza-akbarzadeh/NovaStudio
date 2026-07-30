"use client";

import { PlayCircleIcon, Settings2Icon, UploadIcon } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { ProjectDetailsDemo } from "@/features/projects/lib/project-details-types";
import { cn } from "@/lib/utils";

type ProjectDetailsInlineDemoProps = {
  demo: ProjectDetailsDemo | null;
  canManageDemo: boolean;
  onManageDemo: () => void;
  className?: string;
};

export function ProjectDetailsInlineDemo({
  demo,
  canManageDemo,
  onManageDemo,
  className,
}: ProjectDetailsInlineDemoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const hasDemo = Boolean(demo?.url);

  if (!hasDemo && !canManageDemo) {
    return null;
  }

  function handlePlay() {
    const video = videoRef.current;
    if (!video) return;
    void video.play();
    setIsPlaying(true);
  }

  return (
    <div
      id="project-demo"
      className={cn(
        "relative overflow-hidden border-border/60 bg-black lg:border-l",
        className,
      )}
    >
      {hasDemo && demo ? (
        <div className="relative aspect-video w-full lg:aspect-auto lg:h-full lg:min-h-56">
          <video
            ref={videoRef}
            key={demo.url}
            src={demo.url}
            controls={isPlaying}
            playsInline
            preload="metadata"
            className="size-full bg-black object-cover"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          >
            <track kind="captions" />
          </video>

          {!isPlaying ? (
            <button
              type="button"
              onClick={handlePlay}
              className="group absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/35 transition hover:bg-black/45"
              aria-label="Play demo video"
            >
              <span className="inline-flex size-14 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-lg transition group-hover:scale-105">
                <PlayCircleIcon className="size-7" />
              </span>
              <span className="text-sm font-medium text-white">Watch demo</span>
            </button>
          ) : null}

          {canManageDemo ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="absolute top-3 right-3 rounded-xl bg-black/50 text-white backdrop-blur hover:bg-black/65"
              onClick={onManageDemo}
            >
              <Settings2Icon className="size-3.5" />
              Manage
            </Button>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={onManageDemo}
          className="flex aspect-video w-full flex-col items-center justify-center gap-3 border-t border-dashed border-white/20 bg-black/40 p-6 text-center transition hover:bg-black/55 lg:aspect-auto lg:min-h-56 lg:border-t-0"
        >
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-white/10 text-white">
            <UploadIcon className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-white">Add a demo video</p>
            <p className="mt-1 text-xs text-white/70">
              Show visitors what this project does
            </p>
          </div>
        </button>
      )}
    </div>
  );
}
