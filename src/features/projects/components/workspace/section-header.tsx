import { ArrowRightIcon } from "lucide-react";
import { Manrope } from "next/font/google";

import { cn } from "@/lib/utils";

const display = Manrope({
  subsets: ["latin"],
  weight: ["600", "700"],
});

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={cn(
            display.className,
            "text-xl font-semibold tracking-tight text-foreground",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/8"
        >
          {actionLabel}
          <ArrowRightIcon className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
