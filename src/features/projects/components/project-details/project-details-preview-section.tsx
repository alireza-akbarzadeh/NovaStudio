"use client";

import type { ProjectDetailsData } from "@/features/projects/lib/project-details-types";
import { cn } from "@/lib/utils";

type ProjectDetailsPreviewSectionProps = {
  details: ProjectDetailsData;
};

export function ProjectDetailsPreviewSection({
  details,
}: ProjectDetailsPreviewSectionProps) {
  return (
    <section className="rounded-[24px] border border-border/60 bg-card/85 p-6">
      <h2 className="text-lg font-semibold tracking-tight">Preview</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        A snapshot of what this workspace looks like today.
      </p>
      <div
        className={cn(
          "relative mt-4 overflow-hidden rounded-[20px] border border-border/50",
          details.coverTone,
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.28),transparent_60%)]" />
        <div className="relative space-y-3 p-6 md:p-8">
          <div className="flex gap-2">
            <span className="size-3 rounded-full bg-white/30" />
            <span className="size-3 rounded-full bg-white/20" />
            <span className="size-3 rounded-full bg-white/20" />
          </div>
          <div className="rounded-xl bg-black/20 p-4 backdrop-blur-sm">
            <p className="font-mono text-xs text-white/90">{details.name}/</p>
            <p className="mt-2 font-mono text-[11px] text-white/70">
              src · components · README.md
            </p>
          </div>
          <p className="max-w-md text-sm text-white/85">
            NovaStudio workspace with live editor, terminal, and deploy tooling
            for {details.tech.slice(0, 2).join(" + ") || "web"} projects.
          </p>
        </div>
      </div>
    </section>
  );
}
