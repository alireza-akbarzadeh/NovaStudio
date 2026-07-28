"use client";

import { useAction, useMutation } from "convex/react";
import {
  ExternalLinkIcon,
  FileTextIcon,
  Loader2Icon,
  PencilIcon,
  RefreshCwIcon,
  SaveIcon,
  UploadCloudIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useCommitAndPush } from "@/features/github/hooks/use-commit-and-push";
import { parseConvexErrorMessage } from "@/features/github/lib/github-errors";
import { toGitHubUrl } from "@/features/github/lib/github-url";
import { ProjectDocMarkdown } from "@/features/projects/components/project-details/project-doc-markdown";
import { useProjectDocs } from "@/features/projects/hooks/use-project-docs";
import type {
  ProjectDocRecord,
  ProjectDocSlot,
} from "@/features/projects/lib/project-details-types";
import { isProjectLinkedToGitHub } from "@/features/projects/lib/project-details-utils";
import { cn } from "@/lib/utils";

type ProjectDetailsDocsSectionProps = {
  projectId: string;
};

export function ProjectDetailsDocsSection({
  projectId,
}: ProjectDetailsDocsSectionProps) {
  const docsData = useProjectDocs(projectId);
  const writeFile = useMutation(api.projectFiles.writeFileAtPath);
  const updateContent = useMutation(api.projectFiles.updateContent);
  const setFileStaged = useMutation(api.projectFiles.setFileStaged);
  const syncDocs = useAction(api.projectCommunityDocsActions.syncProjectDocsFromGitHub);
  const { push, isPushing } = useCommitAndPush(projectId);

  const [activeSlot, setActiveSlot] = useState<ProjectDocSlot>("readme");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const activeDoc = useMemo(
    (): ProjectDocRecord | undefined =>
      docsData?.docs.find((doc) => doc.slot === activeSlot),
    [docsData, activeSlot],
  );

  useEffect(() => {
    if (!activeDoc) return;
    if (!editing) {
      setDraft(activeDoc.content);
    }
  }, [activeDoc, editing]);

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

  async function handleCreate(doc: ProjectDocRecord | undefined = activeDoc) {
    if (!doc || !docsData?.canEdit) return;
    setSaving(true);
    try {
      await writeFile({
        projectId: projectId as Id<"projects">,
        path: doc.defaultPath,
        content: doc.defaultContent,
      });
      toast.success(`${doc.label} created`);
      setDraft(doc.defaultContent);
      setEditing(true);
    } catch (error) {
      toast.error(parseConvexErrorMessage(error, "Could not create document"));
    } finally {
      setSaving(false);
    }
  }

  async function handleSave(andPush = false) {
    if (!activeDoc || !docsData?.canEdit) return;
    const path = activeDoc.path ?? activeDoc.defaultPath;
    setSaving(true);
    try {
      if (activeDoc.exists && activeDoc.path) {
        await updateContent({
          projectId: projectId as Id<"projects">,
          path: activeDoc.path,
          content: draft,
        });
      } else {
        await writeFile({
          projectId: projectId as Id<"projects">,
          path,
          content: draft,
        });
      }

      await setFileStaged({
        projectId: projectId as Id<"projects">,
        path,
        staged: true,
      }).catch(() => {
        /* unchanged vs synced — skip staging */
      });

      toast.success(`${activeDoc.label} saved`);
      setEditing(false);

      if (andPush) {
        if (!hasGithub) {
          toast.message("Link GitHub to push documentation");
          return;
        }
        await push(`Update ${path}`);
      }
    } catch (error) {
      toast.error(parseConvexErrorMessage(error, "Could not save document"));
    } finally {
      setSaving(false);
    }
  }

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
      setEditing(false);
    } catch (error) {
      toast.error(parseConvexErrorMessage(error, "Could not sync from GitHub"));
    } finally {
      setSyncing(false);
    }
  }

  return (
    <section className="rounded-[24px] border border-border/60 bg-card/85 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileTextIcon className="size-4 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">
              Repository docs
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            README, contributing guide, and license — synced with your project
            files and GitHub.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
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

      <Tabs
        value={activeSlot}
        onValueChange={(value) => {
          setActiveSlot(value as ProjectDocSlot);
          setEditing(false);
        }}
        className="mt-5"
      >
        <TabsList className="h-auto flex-wrap gap-1 rounded-xl bg-muted/50 p-1">
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

        {docsData.docs.map((doc) => (
          <TabsContent key={doc.slot} value={doc.slot} className="mt-4">
            {!doc.exists && !docsData.canEdit ? (
              <p className="rounded-2xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
                No {doc.label.toLowerCase()} file published yet.
              </p>
            ) : !doc.exists ? (
              <div className="rounded-2xl border border-dashed border-border/70 px-6 py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  {doc.defaultPath} has not been added yet.
                </p>
                <Button
                  className="mt-4 rounded-xl"
                  disabled={saving}
                  onClick={() => void handleCreate(doc)}
                >
                  Add {doc.label}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-xs text-muted-foreground">
                    {doc.path}
                  </p>
                  {docsData.canEdit ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={editing ? "secondary" : "outline"}
                        className="rounded-xl"
                        onClick={() => setEditing((value) => !value)}
                      >
                        <PencilIcon className="size-3.5" />
                        {editing ? "Preview" : "Edit"}
                      </Button>
                      {editing ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            className="rounded-xl"
                            disabled={saving}
                            onClick={() => void handleSave(false)}
                          >
                            <SaveIcon className="size-3.5" />
                            Save
                          </Button>
                          {hasGithub ? (
                            <Button
                              type="button"
                              size="sm"
                              className="rounded-xl"
                              disabled={saving || isPushing}
                              onClick={() => void handleSave(true)}
                            >
                              {isPushing ? (
                                <Loader2Icon className="size-3.5 animate-spin" />
                              ) : (
                                <UploadCloudIcon className="size-3.5" />
                              )}
                              Save & push
                            </Button>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {editing ? (
                  <Textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    className={cn(
                      "min-h-[320px] rounded-2xl font-mono text-xs leading-relaxed",
                      doc.isMarkdown ? "" : "whitespace-pre-wrap",
                    )}
                  />
                ) : doc.isMarkdown ? (
                  <div className="rounded-2xl border border-border/60 bg-muted/15 p-5">
                    <ProjectDocMarkdown content={doc.content} />
                  </div>
                ) : (
                  <pre className="overflow-x-auto rounded-2xl border border-border/60 bg-muted/15 p-5 font-mono text-xs leading-relaxed text-foreground/90">
                    {doc.content}
                  </pre>
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {visibleTabs.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
          No repository documentation available.
        </p>
      ) : null}
    </section>
  );
}
