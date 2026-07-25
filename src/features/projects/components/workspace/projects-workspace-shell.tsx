"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

import { ProjectsNavSidebar } from "@/features/projects/components/workspace/projects-nav-sidebar";
import { ProjectsRightSidebar } from "@/features/projects/components/workspace/projects-right-sidebar";

type ProjectsWorkspaceShellProps = {
  children: ReactNode;
  showRightSidebar?: boolean;
};

export function ProjectsWorkspaceShell({
  children,
  showRightSidebar = false,
}: ProjectsWorkspaceShellProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="relative min-h-screen bg-background text-foreground"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 10% 0%, color-mix(in oklch, var(--ring) 16%, transparent), transparent 55%), radial-gradient(ellipse 55% 40% at 90% 10%, color-mix(in oklch, var(--accent) 50%, transparent), transparent 50%), radial-gradient(ellipse 50% 35% at 70% 100%, color-mix(in oklch, var(--primary) 8%, transparent), transparent 55%)",
        }}
      />

      <div className="relative z-10 flex min-h-screen">
        <ProjectsNavSidebar />
        <div className="flex min-w-0 flex-1 gap-6 px-4 py-6 md:px-6 lg:px-8">
          <div className="min-w-0 flex-1">{children}</div>
          {showRightSidebar ? <ProjectsRightSidebar /> : null}
        </div>
      </div>
    </motion.div>
  );
}
