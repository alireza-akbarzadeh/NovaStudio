"use client";

import {
  ExternalLinkIcon,
  GlobeIcon,
  Loader2Icon,
  MonitorIcon,
  RocketIcon,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProjectDetailsData } from "@/features/projects/lib/project-details-types";
import { cn } from "@/lib/utils";

type ProjectDetailsPreviewSectionProps = {
  details: ProjectDetailsData;
};

function providerLabel(provider: "vercel" | "netlify") {
  return provider === "netlify" ? "Netlify" : "Vercel";
}

function displayHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url.replace(/^https?:\/\//, "");
  }
}

export function ProjectDetailsPreviewSection({
  details,
}: ProjectDetailsPreviewSectionProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const preview = details.preview;
  const canManage = details.viewer.isOwner || details.viewer.canManage;

  useEffect(() => {
    setIframeLoaded(false);
  }, [preview?.url]);

  return (
    <section className="rounded-[24px] border border-border/60 bg-card/85 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <MonitorIcon className="size-4 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">Live preview</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {preview
              ? "Embedded snapshot of the latest successful deploy."
              : "Deploy to Vercel or Netlify to showcase the running app here."}
          </p>
        </div>
        {preview ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full capitalize">
              {providerLabel(preview.provider)}
            </Badge>
            <Badge className="rounded-full bg-emerald-500/12 text-emerald-700 dark:text-emerald-300">
              {preview.label}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              asChild
            >
              <a
                href={preview.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLinkIcon className="size-3.5" />
                Open live site
              </a>
            </Button>
          </div>
        ) : null}
      </div>

      {preview ? (
        <div className="mt-4 overflow-hidden rounded-[20px] border border-border/60 bg-muted/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="flex items-center gap-2 border-b border-border/60 bg-muted/40 px-4 py-3">
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-rose-400/80" />
              <span className="size-2.5 rounded-full bg-amber-400/80" />
              <span className="size-2.5 rounded-full bg-emerald-400/80" />
            </div>
            <div className="min-w-0 flex-1 truncate rounded-lg bg-background/70 px-3 py-1.5 text-[11px] text-muted-foreground">
              {displayHost(preview.url)}
            </div>
            <Image
              src={
                preview.provider === "netlify" ? "/netlify.svg" : "/vercel.svg"
              }
              alt={providerLabel(preview.provider)}
              width={16}
              height={16}
              className="size-4 shrink-0 opacity-80"
            />
          </div>

          <div className="relative aspect-[16/10] bg-background">
            {!iframeLoaded ? (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
                <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : null}
            <iframe
              key={preview.url}
              title={`${details.name} live preview`}
              src={preview.url}
              className="size-full border-0 bg-white"
              loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              referrerPolicy="no-referrer"
              onLoad={() => setIframeLoaded(true)}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-4 py-2.5 text-[11px] text-muted-foreground">
            <span>Updated {preview.updatedLabel}</span>
            <span className="inline-flex items-center gap-1">
              <GlobeIcon className="size-3.5" />
              Some sites block embedding — use Open live site if the preview is
              blank.
            </span>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "relative mt-4 overflow-hidden rounded-[20px] border border-dashed border-border/70",
            details.coverTone,
          )}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.28),transparent_60%)]" />
          <div className="relative space-y-4 p-6 md:p-8">
            <div className="flex gap-2">
              <span className="size-3 rounded-full bg-white/30" />
              <span className="size-3 rounded-full bg-white/20" />
              <span className="size-3 rounded-full bg-white/20" />
            </div>
            <div className="rounded-xl bg-black/20 p-4 backdrop-blur-sm">
              <p className="font-mono text-xs text-white/90">{details.name}/</p>
              <p className="mt-2 font-mono text-[11px] text-white/70">
                {details.tech.slice(0, 3).join(" · ") || "src · components · app"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="max-w-md text-sm text-white/85">
                {canManage
                  ? "Connect Vercel or Netlify in the workspace Deploy panel, then ship a production build to show a live preview on this page."
                  : "This project has not published a live deploy preview yet."}
              </p>
              {canManage ? (
                <Button
                  size="sm"
                  className="rounded-xl bg-white/95 text-slate-900 hover:bg-white"
                  asChild
                >
                  <a href={`/projects/${details.id}`}>
                    <RocketIcon className="size-3.5" />
                    Open workspace to deploy
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
