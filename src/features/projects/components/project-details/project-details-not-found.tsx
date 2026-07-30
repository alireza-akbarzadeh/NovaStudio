"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export function ProjectDetailsNotFound() {
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-dashed border-border/70 bg-card/50 px-8 py-16 text-center">
      <p className="text-lg font-semibold">Project not found</p>
      <p className="mt-2 text-sm text-muted-foreground">
        This project may be private or was removed.
      </p>
      <Button asChild className="mt-6 rounded-xl">
        <Link href="/projects/community">Back to Community</Link>
      </Button>
    </div>
  );
}
