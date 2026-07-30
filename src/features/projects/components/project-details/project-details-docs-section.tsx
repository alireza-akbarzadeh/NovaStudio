"use client";

import { useAction } from "convex/react";
import {
  ChevronDownIcon,
  ExternalLinkIcon,
  FileTextIcon,
  Loader2Icon,
  RefreshCwIcon,
  SquarePenIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { parseConvexErrorMessage } from "@/features/github/lib/github-errors";
import { toGitHubUrl } from "@/features/github/lib/github-url";
import { ProjectDocMarkdown } from "@/features/projects/components/project-details/project-doc-markdown";
import { useProjectDocs } from "@/features/projects/hooks/use-project-docs";
import type { ProjectDocSlot } from "@/features/projects/lib/project-details-types";
import { isProjectLinkedToGitHub } from "@/features/projects/lib/project-details-utils";
import { cn } from "@/lib/utils";

type ProjectDetailsDocsSectionProps = {
  projectId: string;
  canOpenStudio?: boolean;
  openingStudio?: boolean;
  onOpenStudio?: () => void;
};

export function ProjectDetailsDocsSection({
  projectId,
  canOpenStudio = false,
  openingStudio = false,
  onOpenStudio,
}: ProjectDetailsDocsSectionProps) {
  const docsData = useProjectDocs(projectId);
  const syncDocs = useAction(api.projectCommunityDocsActions.syncProjectDocsFromGitHub);

  const [activeSlot, setActiveSlot] = useState<ProjectDocSlot>("readme");
  const [syncing, setSyncing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const activeDoc = useMemo(
    () => docsData?.docs.find((doc) => doc.slot === activeSlot),
    [docsData, activeSlot],
  );

  if (docsData === undefined) {
    return (
      <section className="rounded-[24px] border border-border/60 bg-card/85 p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Loading repository docs…
        </div>
      </section>
    );
  }

  if (!docsData) return null;

  const visibleTabs = docsData.docs.filter(
    (doc) => doc.exists || docsData.canEdit,
  );
  const hasGithub = isProjectLinkedToGitHub(docsData);

  async function handleSyncFromGitHub() {
    if (!docsData?.canManage || !hasGithub) return;
    setSyncing(true);
    try {
      const result = await syncDocs({
        projectId: projectId as Id<"projects">,
      });
      toast.success(
        result.imported.length > 0
          ? `Synced ${result.imported.length} file${result.imported.length === 1 ? "" : "s"} from GitHub`
          : "No documentation files found on GitHub",
      );
    } catch (error) {
      toast.error(parseConvexErrorMessage(error, "Could not sync from GitHub"));
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <section className="overflow-hidden rounded-3xl border border-border/60 bg-card/85">
        <div className="border-b border-border/50 px-6 py-5 md:px-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="group min-w-0 flex-1 rounded-xl text-left transition hover:bg-muted/30 -mx-2 px-2 py-1"
              >
                <div className="flex items-start gap-3">
                  <ChevronDownIcon
                    className={cn(
                      "mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      expanded && "rotate-180",
                    )}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <FileTextIcon className="size-4 text-primary" />
                      <h2 className="text-lg font-semibold tracking-tight">
                        Repository docs
                      </h2>
                      {!expanded && activeDoc ? (
                        <Badge variant="secondary" className="rounded-full text-[10px]">
                          {activeDoc.label}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      README, contributing guide, and license — read-only here.
                      Edit in NovaStudio when you have access.
                    </p>
                  </div>
                </div>
              </button>
            </CollapsibleTrigger>

            <div className="flex flex-wrap gap-2">
              {canOpenStudio ? (
                <Button
                  type="button"
                  size="sm"
                  className="rounded-xl"
                  disabled={openingStudio}
                  onClick={onOpenStudio}
                >
                  <SquarePenIcon className="size-3.5" />
                  {openingStudio ? "Opening…" : "Open in Studio"}
                </Button>
              ) : null}
              {docsData.canManage && hasGithub ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  disabled={syncing}
                  onClick={() => void handleSyncFromGitHub()}
                >
                  {syncing ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : (
                    <RefreshCwIcon className="size-3.5" />
                  )}
                  Sync from GitHub
                </Button>
              ) : null}
              {activeDoc?.path && hasGithub ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  asChild
                >
                  <a
                    href={toGitHubUrl(docsData.githubRepoUrl!, {
                      branch: docsData.githubBranch,
                      path: activeDoc.path,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLinkIcon className="size-3.5" />
                    View on GitHub
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <CollapsibleContent>
          <Tabs
            value={activeSlot}
            onValueChange={(value) => setActiveSlot(value as ProjectDocSlot)}
            className="pt-5"
          >
            <div className="px-6 md:px-8">
              <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-muted/50 p-1 sm:w-auto">
                {docsData.docs.map((doc) => (
                  <TabsTrigger
                    key={doc.slot}
                    value={doc.slot}
                    className="rounded-lg px-3 py-1.5 text-xs data-[state=active]:bg-background"
                  >
                    <span>{doc.label}</span>
                    {doc.isDirty ? (
                      <Badge variant="secondary" className="ml-2 rounded-full px-1.5 py-0 text-[10px]">
                        edited
                      </Badge>
                    ) : null}
                    {doc.isStaged ? (
                      <Badge className="ml-2 rounded-full px-1.5 py-0 text-[10px]">
                        staged
                      </Badge>
                    ) : null}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {docsData.docs.map((doc) => (
              <TabsContent key={doc.slot} value={doc.slot} className="mt-4">
                {!doc.exists && !docsData.canEdit ? (
                  <p className="mx-6 mb-6 rounded-2xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground md:mx-8">
                    No {doc.label.toLowerCase()} file published yet.
                  </p>
                ) : !doc.exists ? (
                  <div className="mx-6 mb-6 rounded-2xl border border-dashed border-border/70 px-6 py-10 text-center md:mx-8">
                    <p className="text-sm text-muted-foreground">
                      {doc.defaultPath} has not been added yet.
                    </p>
                    {canOpenStudio ? (
                      <Button
                        className="mt-4 rounded-xl"
                        disabled={openingStudio}
                        onClick={onOpenStudio}
                      >
                        <SquarePenIcon className="size-4" />
                        Open in Studio to add {doc.label}
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  <div className="project-doc-reader">
                    <div className="project-doc-reader-toolbar">
                      <span className="project-doc-reader-path">
                        <FileTextIcon className="size-3.5 shrink-0 opacity-60" />
                        {doc.path}
                      </span>
                    </div>

                    {doc.isMarkdown ? (
                      <div className="project-doc-reader-body">
                        <ProjectDocMarkdown content={doc.content} />
                      </div>
                    ) : (
                      <div className="project-doc-reader-body">
                        <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-foreground/90">
                          {doc.content}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            ))}

            {visibleTabs.length === 0 ? (
              <p className="mx-6 mb-6 rounded-2xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground md:mx-8">
                No repository documentation available.
              </p>
            ) : null}
          </Tabs>
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}
