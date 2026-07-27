"use client";

import {
  CheckIcon,
  ChevronDownIcon,
  Loader2Icon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { PullRequestMergeMethod } from "@/features/github/hooks/use-github-pull-requests";

type PullRequestReviewMenuProps = {
  canReview: boolean;
  canMerge: boolean;
  reviewBody: string;
  mergeMethod: PullRequestMergeMethod;
  isReviewing: boolean;
  isMerging: boolean;
  onReviewBodyChange: (value: string) => void;
  onMergeMethodChange: (value: PullRequestMergeMethod) => void;
  onApprove: () => void;
  onRequestChanges: () => void;
  onMerge: () => void;
};

export function PullRequestReviewMenu({
  canReview,
  canMerge,
  reviewBody,
  mergeMethod,
  isReviewing,
  isMerging,
  onReviewBodyChange,
  onMergeMethodChange,
  onApprove,
  onRequestChanges,
  onMerge,
}: PullRequestReviewMenuProps) {
  if (!canReview && !canMerge) return null;

  const mergeControls = canMerge ? (
    <div className="flex items-center gap-2">
      <Select value={mergeMethod} onValueChange={onMergeMethodChange}>
        <SelectTrigger
          size="sm"
          className="h-7 flex-1 border-ws-border bg-ws-bg text-[11px] text-ws-text shadow-none"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" className="z-100">
          <SelectItem value="merge" className="text-[11px]">
            Merge commit
          </SelectItem>
          <SelectItem value="squash" className="text-[11px]">
            Squash and merge
          </SelectItem>
          <SelectItem value="rebase" className="text-[11px]">
            Rebase and merge
          </SelectItem>
        </SelectContent>
      </Select>
      <Button
        type="button"
        size="sm"
        disabled={isMerging || (canReview && isReviewing)}
        onClick={onMerge}
        className="h-7 bg-violet-600 text-[11px] text-white hover:bg-violet-700"
      >
        {isMerging ? (
          <Loader2Icon className="size-3 animate-spin" />
        ) : (
          "Merge"
        )}
      </Button>
    </div>
  ) : null;

  if (canReview) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 border-ws-border bg-ws-bg px-2 text-[11px] text-ws-text hover:bg-ws-hover"
          >
            Review
            <ChevronDownIcon className="size-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-80 border-ws-border bg-ws-panel p-3"
        >
          <Textarea
            value={reviewBody}
            onChange={(event) => onReviewBodyChange(event.target.value)}
            placeholder="Overall review comment (required for Request changes)"
            rows={3}
            disabled={isReviewing}
            className="mb-2 min-h-16 resize-none border-ws-border bg-ws-bg text-[12px] text-ws-text"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={isReviewing || isMerging}
              onClick={onApprove}
              className="h-7 flex-1 gap-1 bg-emerald-600 text-[11px] text-white hover:bg-emerald-700"
            >
              {isReviewing ? (
                <Loader2Icon className="size-3 animate-spin" />
              ) : (
                <CheckIcon className="size-3" />
              )}
              Approve
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isReviewing || isMerging}
              onClick={onRequestChanges}
              className="h-7 flex-1 gap-1 border-ws-border bg-ws-bg text-[11px] text-ws-text hover:bg-ws-hover"
            >
              <XIcon className="size-3" />
              Request changes
            </Button>
          </div>
          {canMerge ? (
            <>
              <DropdownMenuSeparator className="my-2 bg-ws-border" />
              {mergeControls}
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 border-ws-border bg-ws-bg px-2 text-[11px] text-ws-text hover:bg-ws-hover"
        >
          Merge
          <ChevronDownIcon className="size-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 border-ws-border bg-ws-panel p-3"
      >
        {mergeControls}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
