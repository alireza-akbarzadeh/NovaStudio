"use client";

import {
  Clock3Icon,
  Globe2Icon,
  PinIcon,
  UsersIcon,
} from "lucide-react";
import { motion } from "motion/react";

import type { WorkspaceStat } from "@/features/projects/lib/projects-workspace-types";
import { cn } from "@/lib/utils";

const toneStyles = {
  violet: "from-violet-500/15 via-violet-400/5 to-transparent text-violet-600 dark:text-violet-300",
  blue: "from-sky-500/15 via-sky-400/5 to-transparent text-sky-600 dark:text-sky-300",
  pink: "from-fuchsia-500/15 via-fuchsia-400/5 to-transparent text-fuchsia-600 dark:text-fuchsia-300",
  orange: "from-orange-500/15 via-orange-400/5 to-transparent text-orange-600 dark:text-orange-300",
} as const;

const icons = {
  pin: PinIcon,
  clock: Clock3Icon,
  users: UsersIcon,
  globe: Globe2Icon,
} as const;

type ProjectsStatCardProps = {
  stat: WorkspaceStat;
  index: number;
  onClick?: () => void;
};

export function ProjectsStatCard({
  stat,
  index,
  onClick,
}: ProjectsStatCardProps) {
  const Icon = icons[stat.icon];

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        "group relative overflow-hidden rounded-[20px] border border-border/60 bg-card/80 p-5 shadow-[0_12px_40px_-28px_rgba(76,29,149,0.45)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-28px_rgba(76,29,149,0.55)]",
        "bg-gradient-to-br",
        toneStyles[stat.tone],
        onClick && "cursor-pointer",
      )}
    >
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-background/70 shadow-sm backdrop-blur">
          <Icon className="size-4.5" />
        </div>
        <span className="rounded-full bg-background/60 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
          {stat.trend}
        </span>
      </div>
      <p className="relative z-10 mt-5 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
        {stat.value}
      </p>
      <p className="relative z-10 mt-1 text-sm text-muted-foreground">
        {stat.label}
      </p>
      <svg
        aria-hidden
        className="pointer-events-none absolute right-2 bottom-2 h-14 w-28 opacity-40"
        viewBox="0 0 120 48"
        fill="none"
      >
        <path
          d="M2 36 C18 34 22 18 38 20 C54 22 58 40 74 34 C90 28 98 10 118 12"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </motion.article>
  );
}
