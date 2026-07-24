import Image from "next/image";

import { cn } from "@/lib/utils";

/** Official Prettier mark from `/public/images/prettier.svg`. */
export function PrettierIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/images/prettier.svg"
      alt=""
      width={16}
      height={16}
      aria-hidden
      unoptimized
      className={cn("size-4 shrink-0 object-contain", className)}
    />
  );
}
