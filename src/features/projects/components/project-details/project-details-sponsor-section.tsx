"use client";

import { ChevronUpIcon, SparklesIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProjectDetailsFeature } from "@/features/projects/lib/project-details-types";
import {
  featureStatusStyles,
  formatProjectCount,
} from "@/features/projects/lib/project-details-utils";
import { cn } from "@/lib/utils";

type ProjectDetailsSponsorSectionProps = {
  features: ProjectDetailsFeature[];
  onBecomeSponsor: () => void;
  onUpvoteFeature: (featureId: string) => Promise<{
    upvoted: boolean;
    upvotes: number;
  }>;
};

export function ProjectDetailsSponsorSection({
  features,
  onBecomeSponsor,
  onUpvoteFeature,
}: ProjectDetailsSponsorSectionProps) {
  const [localFeatures, setLocalFeatures] = useState(features);
  const [pendingFeatureId, setPendingFeatureId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setLocalFeatures(features);
  }, [features]);

  async function handleUpvote(featureId: string) {
    setPendingFeatureId(featureId);
    try {
      const result = await onUpvoteFeature(featureId);
      setLocalFeatures((current) =>
        current.map((feature) =>
          feature.id === featureId
            ? {
                ...feature,
                upvotes: result.upvotes,
                viewerHasUpvoted: result.upvoted,
              }
            : feature,
        ),
      );
    } catch {
      toast.error("Could not update upvote");
    } finally {
      setPendingFeatureId(null);
    }
  }

  const sortedFeatures = [...localFeatures].sort(
    (a, b) => b.upvotes - a.upvotes || b.createdAt - a.createdAt,
  );

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
            Propose something you&apos;d like built — upvote ideas you want
            prioritized.
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

      {sortedFeatures.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {sortedFeatures.map((feature) => (
            <li
              key={feature.id}
              className="flex gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4"
            >
              <button
                type="button"
                disabled={pendingFeatureId === feature.id}
                onClick={() => void handleUpvote(feature.id)}
                className={cn(
                  "flex shrink-0 flex-col items-center gap-0.5 rounded-xl border px-2.5 py-2 text-center transition",
                  feature.viewerHasUpvoted
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border/60 bg-background/60 text-muted-foreground hover:border-primary/20 hover:bg-muted/40 hover:text-foreground",
                )}
                aria-label={
                  feature.viewerHasUpvoted
                    ? `Remove upvote from ${feature.title}`
                    : `Upvote ${feature.title}`
                }
              >
                <ChevronUpIcon
                  className={cn(
                    "size-4",
                    feature.viewerHasUpvoted && "text-primary",
                  )}
                />
                <span className="text-xs font-semibold tabular-nums">
                  {formatProjectCount(feature.upvotes)}
                </span>
              </button>

              <div className="min-w-0 flex-1">
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
                    {feature.sponsorAmount
                      ? ` · ${feature.sponsorAmount}`
                      : null}
                  </p>
                ) : null}
              </div>
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
