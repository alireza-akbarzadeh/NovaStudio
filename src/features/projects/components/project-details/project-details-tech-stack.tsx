"use client";

import { LayersIcon } from "lucide-react";

import { TechBadge } from "@/features/projects/components/workspace/tech-badge";
import { cn } from "@/lib/utils";

type ProjectDetailsTechStackProps = {
  tech: string[];
  variant?: "default" | "hero" | "bar";
  className?: string;
  showLabel?: boolean;
};

export function ProjectDetailsTechStack({
  tech,
  variant = "default",
  className,
  showLabel = true,
}: ProjectDetailsTechStackProps) {
  if (tech.length === 0) {
    return variant === "hero" ? null : (
      <p className={cn("text-xs text-muted-foreground", className)}>
        Tech stack not published yet.
      </p>
    );
  }

  return (
    <div className={cn("min-w-0", className)}>
      {showLabel ? (
        <div
          className={cn(
            "mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em]",
            variant === "hero"
              ? "text-white/70"
              : variant === "bar"
                ? "text-muted-foreground"
                : "text-muted-foreground",
          )}
        >
          <LayersIcon className="size-3.5" />
          Tech stack
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {tech.map((label) => (
          <TechBadge
            key={label}
            label={label}
            className={cn(
              variant === "hero" &&
                "border-white/20 bg-white/10 text-white group-hover:border-white/30 group-hover:bg-white/15",
              variant === "bar" && "bg-background/80",
            )}
          />
        ))}
      </div>
    </div>
  );
}
