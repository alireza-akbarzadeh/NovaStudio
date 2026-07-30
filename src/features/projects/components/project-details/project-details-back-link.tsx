"use client";

import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function ProjectDetailsBackLink() {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="mb-6 -ml-2 rounded-xl text-muted-foreground"
      asChild
    >
      <Link href="/projects/community">
        <ArrowLeftIcon className="size-4" />
        Back to Community
      </Link>
    </Button>
  );
}
