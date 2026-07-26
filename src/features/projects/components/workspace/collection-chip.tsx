"use client";

import {
  ArchiveIcon,
  BriefcaseIcon,
  PinIcon,
  SparklesIcon,
  UserIcon,
} from "lucide-react";
import { motion } from "motion/react";

import type { WorkspaceCollection } from "@/features/projects/lib/projects-workspace-types";
import { cn } from "@/lib/utils";

const icons = {
  pin: PinIcon,
  sparkles: SparklesIcon,
  user: UserIcon,
  briefcase: BriefcaseIcon,
  archive: ArchiveIcon,
} as const;

type CollectionChipProps = {
  collection: WorkspaceCollection;
  index: number;
  selected?: boolean;
  onSelect?: (collectionId: string) => void;
};

export function CollectionChip({
  collection,
  index,
  selected = false,
  onSelect,
}: CollectionChipProps) {
  const Icon = icons[collection.icon];

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 + index * 0.04, duration: 0.28 }}
      onClick={() => onSelect?.(collection.id)}
      aria-pressed={selected}
      className={cn(
        "inline-flex min-w-[150px] items-center gap-3 rounded-full border px-4 py-3 text-left backdrop-blur-xl transition-all duration-300",
        selected
          ? "shadow-[0_16px_40px_-20px_rgba(76,29,149,0.55)]"
          : "border-border/60 bg-card/85 shadow-[0_10px_30px_-24px_rgba(76,29,149,0.45)] hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_16px_40px_-24px_rgba(76,29,149,0.5)]",
      )}
      style={
        selected
          ? {
              borderColor: collection.color,
              backgroundColor: `color-mix(in oklab, ${collection.color} 18%, transparent)`,
              boxShadow: `0 0 0 2px color-mix(in oklab, ${collection.color} 55%, transparent)`,
            }
          : undefined
      }
    >
      <span
        className="inline-flex size-9 items-center justify-center rounded-2xl text-white"
        style={{ backgroundColor: collection.color }}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold tracking-tight">
          {collection.name}
        </span>
        <span className="block text-[11px] text-muted-foreground">
          {collection.count} projects
        </span>
      </span>
    </motion.button>
  );
}
