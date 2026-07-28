import { ClipboardListIcon, ZapIcon } from "lucide-react";

import type { CustomizeItem } from "@/features/customize/lib/customize-catalog";
import { cn } from "@/lib/utils";

type CustomizeItemRowProps = {
  item: CustomizeItem;
  variant: "skill" | "rule";
  className?: string;
};

export function CustomizeItemRow({
  item,
  variant,
  className,
}: CustomizeItemRowProps) {
  const Icon = variant === "skill" ? ZapIcon : ClipboardListIcon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-ws-border-subtle bg-ws-panel/60 px-3 py-2.5",
        className,
      )}
    >
      <Icon
        className="mt-0.5 size-3.5 shrink-0 text-ws-text-muted"
        strokeWidth={1.75}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-[12px] font-medium text-ws-text">
          {item.name}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-ws-text-muted">
          {item.description}
        </p>
      </div>
    </div>
  );
}
