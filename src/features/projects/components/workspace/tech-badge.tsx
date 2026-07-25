import { cn } from "@/lib/utils";

type TechBadgeProps = {
  label: string;
  className?: string;
};

export function TechBadge({ label, className }: TechBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-primary/15 bg-primary/8 px-2.5 py-0.5 text-[11px] font-medium text-primary transition-colors group-hover:border-primary/25 group-hover:bg-primary/12",
        className,
      )}
    >
      {label}
    </span>
  );
}
