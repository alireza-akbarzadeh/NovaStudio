"use client";

import { useState } from "react";

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
import type {
  AccessRole,
  WorkspaceProject,
} from "@/features/projects/lib/projects-workspace-types";
import { cn } from "@/lib/utils";

const ROLES: AccessRole[] = [
  "Developer",
  "Designer",
  "QA",
  "Backend",
  "Frontend",
  "AI Engineer",
  "DevOps",
];

const LEVELS = ["Junior", "Mid", "Senior", "Lead"] as const;

type RequestAccessModalProps = {
  project: WorkspaceProject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RequestAccessModal({
  project,
  open,
  onOpenChange,
}: RequestAccessModalProps) {
  const [role, setRole] = useState<AccessRole>("Developer");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("Mid");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[24px] border-border/70 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Request Access</DialogTitle>
          <DialogDescription>
            Tell the owner how you want to contribute to{" "}
            <span className="font-medium text-foreground">
              {project?.name ?? "this project"}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        {project ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex size-10 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: project.owner.color }}
                >
                  {project.owner.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold">{project.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Owner · {project.owner.name}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {project.description}
              </p>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Contribution guidelines: keep PRs focused, follow the tech
                stack conventions, and discuss large changes first.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setRole(item)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      role === item
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Experience level</Label>
              <div className="flex flex-wrap gap-2">
                {LEVELS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setLevel(item)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      level === item
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="access-message">
                Why do you want to contribute?
              </Label>
              <Textarea
                id="access-message"
                placeholder="Share your experience and what you'd like to work on..."
                className="min-h-24 rounded-2xl"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="portfolio">Portfolio link</Label>
                <Input
                  id="portfolio"
                  placeholder="https://"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github">GitHub</Label>
                <Input
                  id="github"
                  placeholder="@username"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  placeholder="linkedin.com/in/..."
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button className="rounded-xl" onClick={() => onOpenChange(false)}>
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
