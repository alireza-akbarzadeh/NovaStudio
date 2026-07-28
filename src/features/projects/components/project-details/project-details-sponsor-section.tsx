"use client";

import { SparklesIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseConvexErrorMessage } from "@/features/github/lib/github-errors";
import type { ProjectDetailsFeature } from "@/features/projects/lib/project-details-types";
import { featureStatusStyles } from "@/features/projects/lib/project-details-utils";
import { cn } from "@/lib/utils";

type ProjectDetailsSponsorSectionProps = {
  features: ProjectDetailsFeature[];
  onProposeFeature: (input: {
    title: string;
    description?: string;
    sponsorMessage?: string;
    sponsorAmount?: string;
  }) => Promise<void>;
};

export function ProjectDetailsSponsorSection({
  features,
  onProposeFeature,
}: ProjectDetailsSponsorSectionProps) {
  const [featureTitle, setFeatureTitle] = useState("");
  const [featureDescription, setFeatureDescription] = useState("");
  const [sponsorMessage, setSponsorMessage] = useState("");
  const [sponsorAmount, setSponsorAmount] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!featureTitle.trim()) return;

    setPending(true);
    try {
      await onProposeFeature({
        title: featureTitle.trim(),
        description: featureDescription.trim() || undefined,
        sponsorMessage: sponsorMessage.trim() || undefined,
        sponsorAmount: sponsorAmount.trim() || undefined,
      });
      setFeatureTitle("");
      setFeatureDescription("");
      setSponsorMessage("");
      setSponsorAmount("");
    } catch (error) {
      toast.error(parseConvexErrorMessage(error, "Could not submit proposal"));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-[24px] border border-border/60 bg-card/85 p-6">
      <div className="flex items-center gap-2">
        <SparklesIcon className="size-4 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight">Sponsor a feature</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Propose something you&apos;d like built — optionally note if you&apos;d
        sponsor development.
      </p>

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

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="mt-5 space-y-3 border-t border-border/50 pt-5"
      >
        <div className="space-y-2">
          <Label htmlFor="feature-title">Feature idea</Label>
          <Input
            id="feature-title"
            value={featureTitle}
            onChange={(event) => setFeatureTitle(event.target.value)}
            placeholder="e.g. Add OAuth login"
            className="rounded-xl"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="feature-description">Details</Label>
          <Textarea
            id="feature-description"
            value={featureDescription}
            onChange={(event) => setFeatureDescription(event.target.value)}
            placeholder="Describe the feature and why it matters..."
            className="min-h-20 rounded-xl"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sponsor-amount">Sponsor budget (optional)</Label>
            <Input
              id="sponsor-amount"
              value={sponsorAmount}
              onChange={(event) => setSponsorAmount(event.target.value)}
              placeholder="$500 bounty"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="sponsor-message">Message (optional)</Label>
            <Input
              id="sponsor-message"
              value={sponsorMessage}
              onChange={(event) => setSponsorMessage(event.target.value)}
              placeholder="Happy to fund design + implementation"
              className="rounded-xl"
            />
          </div>
        </div>
        <Button
          type="submit"
          className="rounded-xl"
          disabled={pending || !featureTitle.trim()}
        >
          {pending ? "Submitting…" : "Propose feature"}
        </Button>
      </form>
    </section>
  );
}
