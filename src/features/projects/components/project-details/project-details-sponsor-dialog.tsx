"use client";

import { SparklesIcon } from "lucide-react";
import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseConvexErrorMessage } from "@/features/github/lib/github-errors";

type ProjectDetailsSponsorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  onProposeFeature,
}: ProjectDetailsSponsorDialogProps) {
  const [featureTitle, setFeatureTitle] = useState("");
  const [featureDescription, setFeatureDescription] = useState("");
  const [sponsorMessage, setSponsorMessage] = useState("");
  const [sponsorAmount, setSponsorAmount] = useState("");
  const [pending, setPending] = useState(false);

  function resetForm() {
    setFeatureTitle("");
    setFeatureDescription("");
    setSponsorMessage("");
    setSponsorAmount("");
  }

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
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error(parseConvexErrorMessage(error, "Could not submit proposal"));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) resetForm();
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-primary" />
            Become a sponsor
          </DialogTitle>
          <DialogDescription>
            Propose a feature you&apos;d like built for this project — optionally
            note if you&apos;d sponsor development.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-3"
        >
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
          <div className="grid gap-3 sm:grid-cols-2">
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
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="sponsor-dialog-message">Message (optional)</Label>
              <Input
                id="sponsor-dialog-message"
                value={sponsorMessage}
                onChange={(event) => setSponsorMessage(event.target.value)}
                placeholder="Happy to fund design + implementation"
                className="rounded-xl"
              />
            </div>
          </div>
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
              disabled={pending || !featureTitle.trim()}
            >
              {pending ? "Submitting…" : "Propose feature"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
