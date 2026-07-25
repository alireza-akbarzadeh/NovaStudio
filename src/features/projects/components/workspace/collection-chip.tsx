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
};

export function CollectionChip({ collection, index }: CollectionChipProps) {
  const Icon = icons[collection.icon];

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 + index * 0.04, duration: 0.28 }}
      className="inline-flex min-w-[150px] items-center gap-3 rounded-full border border-border/60 bg-card/85 px-4 py-3 text-left shadow-[0_10px_30px_-24px_rgba(76,29,149,0.45)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_16px_40px_-24px_rgba(76,29,149,0.5)]"
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
