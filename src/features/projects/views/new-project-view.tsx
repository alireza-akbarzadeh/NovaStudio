"use client";

import { useRouter } from "next/navigation";

import { HubPageHeader } from "@/features/projects/components/workspace/hub-page-header";
import { NewProjectForm } from "@/features/projects/components/new-project-form";

/** New project template gallery — renders in the projects hub middle pane. */
export function NewProjectView() {
  const router = useRouter();

  return (
    <div className="mx-auto w-full max-w-5xl">
      <HubPageHeader
        title="New project"
        description="Browse the template gallery to get started."
      />
      <div className="rounded-[22px] border border-border/60 bg-card/70 p-5 shadow-[0_16px_48px_-32px_rgba(76,29,149,0.4)] backdrop-blur-xl md:p-8">
        <NewProjectForm onCancel={() => router.replace("/projects")} />
      </div>
    </div>
  );
}
