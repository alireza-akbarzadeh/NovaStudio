"use client";

import { SparklesIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseConvexErrorMessage } from "@/features/github/lib/github-errors";
import type { SponsorTier } from "@/features/projects/lib/project-details-types";
import {
  sponsorTierMeta,
  sponsorTierOrder,
} from "@/features/projects/lib/project-details-utils";
import { cn } from "@/lib/utils";

type ProjectDetailsSponsorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTier?: SponsorTier;
  onJoinAsSponsor: (input: {
    tier: "supporter" | "backer";
    sponsorMessage?: string;
    sponsorAmount?: string;
  }) => Promise<void>;
  onProposeFeature: (input: {
    title: string;
    description?: string;
    sponsorMessage?: string;
    sponsorAmount?: string;
  }) => Promise<void>;
};

export function ProjectDetailsSponsorDialog({
  open,
  onOpenChange,
  currentTier,
  onJoinAsSponsor,
  onProposeFeature,
}: ProjectDetailsSponsorDialogProps) {
  const [tier, setTier] = useState<SponsorTier>("feature");
  const [featureTitle, setFeatureTitle] = useState("");
  const [featureDescription, setFeatureDescription] = useState("");
  const [sponsorMessage, setSponsorMessage] = useState("");
  const [sponsorAmount, setSponsorAmount] = useState("");
  const [pending, setPending] = useState(false);

  function resetForm() {
    setTier("feature");
    setFeatureTitle("");
    setFeatureDescription("");
    setSponsorMessage("");
    setSponsorAmount("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      if (tier === "feature") {
        if (!featureTitle.trim()) return;
        await onProposeFeature({
          title: featureTitle.trim(),
          description: featureDescription.trim() || undefined,
          sponsorMessage: sponsorMessage.trim() || undefined,
          sponsorAmount: sponsorAmount.trim() || undefined,
        });
      } else if (tier === "backer") {
        await onJoinAsSponsor({
          tier: "backer",
          sponsorAmount: sponsorAmount.trim(),
          sponsorMessage: sponsorMessage.trim() || undefined,
        });
      } else {
        await onJoinAsSponsor({
          tier: "supporter",
          sponsorMessage: sponsorMessage.trim(),
        });
      }
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error(parseConvexErrorMessage(error, "Could not submit sponsorship"));
    } finally {
      setPending(false);
    }
  }

  const submitLabel =
    tier === "feature"
      ? "Propose feature"
      : tier === "backer"
        ? "Join as backer"
        : "Join as supporter";

  const canSubmit =
    tier === "feature"
      ? Boolean(featureTitle.trim())
      : tier === "backer"
        ? Boolean(sponsorAmount.trim())
        : Boolean(sponsorMessage.trim());

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) resetForm();
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-primary" />
            Choose your sponsorship tier
          </DialogTitle>
          <DialogDescription>
            Pick how you want to support this project. You can upgrade your tier
            later — higher tiers are never downgraded.
          </DialogDescription>
        </DialogHeader>

        {currentTier ? (
          <p className="text-xs text-muted-foreground">
            You&apos;re currently a{" "}
            <span className="font-medium text-foreground">
              {sponsorTierMeta[currentTier].label}
            </span>
            .
          </p>
        ) : null}

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-4"
        >
          <div className="grid gap-2">
            {sponsorTierOrder.map((option) => {
              const meta = sponsorTierMeta[option];
              const selected = tier === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTier(option)}
                  className={cn(
                    "rounded-2xl border border-border/60 p-3 text-left transition",
                    selected
                      ? meta.pickerClass
                      : "bg-muted/15 hover:border-border hover:bg-muted/25",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{meta.label}</span>
                    {selected ? (
                      <Badge variant="secondary" className="text-[10px]">
                        Selected
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {meta.description}
                  </p>
                </button>
              );
            })}
          </div>

          {tier === "feature" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="sponsor-dialog-feature-title">Feature idea</Label>
                <Input
                  id="sponsor-dialog-feature-title"
                  value={featureTitle}
                  onChange={(event) => setFeatureTitle(event.target.value)}
                  placeholder="e.g. Add OAuth login"
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sponsor-dialog-feature-description">Details</Label>
                <Textarea
                  id="sponsor-dialog-feature-description"
                  value={featureDescription}
                  onChange={(event) => setFeatureDescription(event.target.value)}
                  placeholder="Describe the feature and why it matters..."
                  className="min-h-20 rounded-xl"
                />
              </div>
            </>
          ) : null}

          {tier === "backer" ? (
            <div className="space-y-2">
              <Label htmlFor="sponsor-dialog-amount">Pledge amount</Label>
              <Input
                id="sponsor-dialog-amount"
                value={sponsorAmount}
                onChange={(event) => setSponsorAmount(event.target.value)}
                placeholder="$500 / €200 / 0.5 ETH"
                className="rounded-xl"
                required
              />
            </div>
          ) : null}

          {tier === "supporter" ? (
            <div className="space-y-2">
              <Label htmlFor="sponsor-dialog-message">Your message</Label>
              <Textarea
                id="sponsor-dialog-message"
                value={sponsorMessage}
                onChange={(event) => setSponsorMessage(event.target.value)}
                placeholder="Why you believe in this project..."
                className="min-h-20 rounded-xl"
                required
              />
            </div>
          ) : tier !== "supporter" ? (
            <div className="space-y-2">
              <Label htmlFor="sponsor-dialog-message">Message (optional)</Label>
              <Input
                id="sponsor-dialog-message"
                value={sponsorMessage}
                onChange={(event) => setSponsorMessage(event.target.value)}
                placeholder="Happy to fund design + implementation"
                className="rounded-xl"
              />
            </div>
          ) : null}

          {tier === "feature" ? (
            <div className="space-y-2">
              <Label htmlFor="sponsor-dialog-amount">
                Sponsor budget (optional)
              </Label>
              <Input
                id="sponsor-dialog-amount"
                value={sponsorAmount}
                onChange={(event) => setSponsorAmount(event.target.value)}
                placeholder="$500 bounty"
                className="rounded-xl"
              />
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl"
              disabled={pending || !canSubmit}
            >
              {pending ? "Submitting…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
