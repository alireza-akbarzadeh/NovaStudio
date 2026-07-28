"use client";

import { SearchIcon, XIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { communitySearchPlaceholder } from "@/features/projects/lib/community-hub-utils";
import { cn } from "@/lib/utils";

type CommunityHubSearchProps = {
  value: string;
  onChange: (value: string) => void;
  resultCount?: number;
  className?: string;
};

export function CommunityHubSearch({
  value,
  onChange,
  resultCount,
  className,
}: CommunityHubSearchProps) {
  const hasQuery = value.trim().length > 0;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={communitySearchPlaceholder()}
          className="h-11 rounded-2xl border-border/60 bg-card/80 pl-11 pr-11 shadow-sm backdrop-blur"
          aria-label="Search community projects"
        />
        {hasQuery ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1/2 right-3 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Clear search"
          >
            <XIcon className="size-3.5" />
          </button>
        ) : null}
      </div>
      {hasQuery && resultCount !== undefined ? (
        <p className="px-1 text-xs text-muted-foreground">
          {resultCount === 0
            ? "No projects match your search."
            : `${resultCount} ${resultCount === 1 ? "project" : "projects"} found`}
        </p>
      ) : null}
    </div>
  );
}
