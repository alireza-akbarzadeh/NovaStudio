"use client";

import { SparklesIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProjectDetailsFeature } from "@/features/projects/lib/project-details-types";
import { featureStatusStyles } from "@/features/projects/lib/project-details-utils";
import { cn } from "@/lib/utils";

type ProjectDetailsSponsorSectionProps = {
  features: ProjectDetailsFeature[];
  onBecomeSponsor: () => void;
};

export function ProjectDetailsSponsorSection({
  features,
  onBecomeSponsor,
}: ProjectDetailsSponsorSectionProps) {
  return (
    <section className="rounded-[24px] border border-border/60 bg-card/85 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">
              Sponsor a feature
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Propose something you&apos;d like built — optionally note if
            you&apos;d sponsor development.
          </p>
        </div>
        <Button
          type="button"
          className="rounded-xl"
          onClick={onBecomeSponsor}
        >
          Become a sponsor
        </Button>
      </div>

      {features.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {features.map((feature) => (
            <li
              key={feature.id}
              className="rounded-2xl border border-border/60 bg-muted/20 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{feature.title}</p>
                  {feature.description ? (
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  ) : null}
                </div>
                <Badge
                  className={cn(
                    "rounded-full capitalize",
                    featureStatusStyles[feature.status],
                  )}
                >
                  {feature.status}
                </Badge>
              </div>
              {feature.sponsorName ? (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Proposed by {feature.sponsorName}
                  {feature.sponsorAmount ? ` · ${feature.sponsorAmount}` : null}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
          No feature proposals yet. Be the first to suggest one.
        </p>
      )}
    </section>
  );
}
