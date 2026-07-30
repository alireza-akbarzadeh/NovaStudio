"use client";

import { UsersIcon } from "lucide-react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  COMMUNITY_HUB_SORT_OPTIONS,
  type CommunityHubSort,
} from "@/features/projects/lib/community-hub-utils";
import { cn } from "@/lib/utils";

type CommunityHubFiltersProps = {
  sort: CommunityHubSort;
  onSortChange: (sort: CommunityHubSort) => void;
  acceptingContributorsOnly: boolean;
  onAcceptingContributorsChange: (value: boolean) => void;
  className?: string;
};

export function CommunityHubFilters({
  sort,
  onSortChange,
  acceptingContributorsOnly,
  onAcceptingContributorsChange,
  className,
}: CommunityHubFiltersProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Label htmlFor="community-sort" className="text-xs text-muted-foreground">
          Sort by
        </Label>
        <Select
          value={sort}
          onValueChange={(value) => onSortChange(value as CommunityHubSort)}
        >
          <SelectTrigger
            id="community-sort"
            size="sm"
            className="min-w-[180px] rounded-xl"
          >
            <SelectValue placeholder="Sort projects" />
          </SelectTrigger>
          <SelectContent>
            {COMMUNITY_HUB_SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/70 px-3 py-2">
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <UsersIcon className="size-4" />
        </span>
        <div className="min-w-0">
          <Label
            htmlFor="accepting-contributors"
            className="text-sm font-medium"
          >
            Accepting contributors
          </Label>
          <p className="text-[11px] text-muted-foreground">
            Only projects you can request to join
          </p>
        </div>
        <Switch
          id="accepting-contributors"
          checked={acceptingContributorsOnly}
          onCheckedChange={onAcceptingContributorsChange}
          aria-label="Show projects accepting contributors only"
        />
      </div>
    </div>
  );
}
