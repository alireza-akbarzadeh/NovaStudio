"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProjectFilter } from "@/features/projects/lib/projects-workspace-types";
import { cn } from "@/lib/utils";

const filters: { id: ProjectFilter; label: string }[] = [
  { id: "all", label: "All Projects" },
  { id: "mine", label: "My Projects" },
  { id: "pinned", label: "Pinned" },
  { id: "recent", label: "Recent" },
  { id: "shared", label: "Shared" },
  { id: "public", label: "Public" },
  { id: "archived", label: "Archived" },
];

type ProjectsFiltersBarProps = {
  filter: ProjectFilter;
  onFilterChange: (filter: ProjectFilter) => void;
  sort: string;
  onSortChange: (sort: string) => void;
};

export function ProjectsFiltersBar({
  filter,
  onFilterChange,
  sort,
  onSortChange,
}: ProjectsFiltersBarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-1.5">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onFilterChange(item.id)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-medium transition",
              filter === item.id
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "bg-card/80 text-muted-foreground ring-1 ring-border/60 hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Select defaultValue="all-tech">
          <SelectTrigger className="h-9 w-[140px] rounded-xl bg-card/80">
            <SelectValue placeholder="Technology" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-tech">All tech</SelectItem>
            <SelectItem value="next">Next.js</SelectItem>
            <SelectItem value="react">React</SelectItem>
            <SelectItem value="ai">AI</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all-status">
          <SelectTrigger className="h-9 w-[130px] rounded-xl bg-card/80">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-status">All status</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="review">Review</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={onSortChange}>
          <SelectTrigger className="h-9 w-[160px] rounded-xl bg-card/80">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="popular">Popular</SelectItem>
            <SelectItem value="updated">Recently updated</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
