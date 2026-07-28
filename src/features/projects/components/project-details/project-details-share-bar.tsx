"use client";

import { CheckIcon, CopyIcon, LinkIcon, Share2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  communityProjectUrl,
  linkedInShareUrl,
  shareMessage,
  twitterShareUrl,
} from "@/features/projects/lib/project-details-share-utils";
import type { ProjectDetailsData } from "@/features/projects/lib/project-details-types";

type ProjectDetailsShareBarProps = {
  details: ProjectDetailsData;
  compact?: boolean;
};

export function ProjectDetailsShareBar({
  details,
  compact = false,
}: ProjectDetailsShareBarProps) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const shareUrl = communityProjectUrl(details.id);
  const message = shareMessage(details.name, details.tech);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && "share" in navigator);
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Community link copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  }

  async function nativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: details.name,
          text: message,
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or share failed — fall back to copy.
      }
    }
    await copyLink();
  }

  return (
    <div
      className={
        compact
          ? "flex flex-wrap items-center gap-2"
          : "flex flex-col gap-2 sm:items-end"
      }
    >
      {!compact ? (
        <p className="text-[11px] font-medium text-muted-foreground">Share</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={() => void copyLink()}
        >
          {copied ? (
            <CheckIcon className="size-3.5 text-emerald-600" />
          ) : (
            <CopyIcon className="size-3.5" />
          )}
          Copy link
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          asChild
        >
          <a
            href={twitterShareUrl(shareUrl, message)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Share2Icon className="size-3.5" />
            Post
          </a>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          asChild
        >
          <a
            href={linkedInShareUrl(shareUrl)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <LinkIcon className="size-3.5" />
            LinkedIn
          </a>
        </Button>
        {canNativeShare ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-xl"
            onClick={() => void nativeShare()}
          >
            Share…
          </Button>
        ) : null}
      </div>
    </div>
  );
}
