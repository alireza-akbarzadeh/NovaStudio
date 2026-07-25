"use client";

import { CompassIcon, FolderPlusIcon, UploadIcon } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type ProjectsEmptyStateProps = {
  onImport: () => void;
};

export function ProjectsEmptyState({ onImport }: ProjectsEmptyStateProps) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center rounded-[24px] border border-dashed border-border/80 bg-card/60 px-6 py-16 text-center shadow-[0_18px_50px_-34px_rgba(76,29,149,0.4)] backdrop-blur-xl"
    >
      <div className="relative mb-6 size-28">
        <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-violet-500/30 via-fuchsia-500/20 to-sky-500/20 blur-xl" />
        <div className="relative flex size-full items-center justify-center rounded-[28px] border border-primary/15 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10">
          <FolderPlusIcon className="size-10 text-primary" />
        </div>
      </div>
      <h2 className="text-2xl font-semibold tracking-tight">
        Start your first project
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Create a workspace, import a repository, or browse community projects
        built by other developers.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button
          className="rounded-2xl"
          onClick={() => router.push("/projects/new")}
        >
          <FolderPlusIcon className="size-4" />
          New Project
        </Button>
        <Button variant="outline" className="rounded-2xl" onClick={onImport}>
          <UploadIcon className="size-4" />
          Import Project
        </Button>
        <Button variant="ghost" className="rounded-2xl">
          <CompassIcon className="size-4" />
          Browse Community
        </Button>
      </div>
    </motion.div>
  );
}
