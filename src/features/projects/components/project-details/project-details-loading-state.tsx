"use client";

import { Loader2Icon } from "lucide-react";

export function ProjectDetailsLoadingState() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
    </div>
  );
}
