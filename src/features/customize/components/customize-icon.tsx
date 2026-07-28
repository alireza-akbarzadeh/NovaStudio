import { BlocksIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type CustomizeIconProps = {
  className?: string;
  strokeWidth?: number;
};

/** Cursor-style Customize icon — 2×2 blocks grid. */
export function CustomizeIcon({
  className,
  strokeWidth = 1.75,
}: CustomizeIconProps) {
  return (
    <BlocksIcon className={cn("size-4", className)} strokeWidth={strokeWidth} />
  );
}
