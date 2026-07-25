"use client";

import {
  BoxIcon,
  FileCodeIcon,
  FolderIcon,
  HexagonIcon,
  ServerIcon,
  TriangleIcon,
  ZapIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { Manrope } from "next/font/google";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  adjectives,
  animals,
  colors,
  uniqueNamesGenerator,
} from "unique-names-generator";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseConvexErrorMessage } from "@/features/github/lib/github-errors";
import {
  useCreateProject,
  useProjectTemplates,
} from "@/features/projects/hooks/use-projects";
import { cn } from "@/lib/utils";

const display = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

type TemplateId =
  | "empty"
  | "simple"
  | "static"
  | "vite"
  | "node"
  | "react"
  | "nextjs"
  | "tanstack";

type TemplateCategory = "blank" | "frontend" | "backend" | "fullstack";

type GalleryFilter = "all" | TemplateCategory;

type TemplateMeta = {
  id: TemplateId;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
};

const TEMPLATE_ICONS: Record<TemplateId, typeof FolderIcon> = {
  empty: FolderIcon,
  simple: FolderIcon,
  static: FileCodeIcon,
  vite: ZapIcon,
  node: ServerIcon,
  react: HexagonIcon,
  nextjs: TriangleIcon,
  tanstack: BoxIcon,
};

const CATEGORY_FILTERS: { id: GalleryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "frontend", label: "Frontend" },
  { id: "fullstack", label: "Full-stack" },
  { id: "backend", label: "Backend" },
  { id: "blank", label: "Blank" },
];

function randomProjectName() {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, animals, colors],
    separator: "-",
    length: 3,
  });
}

type NewProjectFormProps = {
  onCancel?: () => void;
  className?: string;
};

/** Shared create-project form used by the standalone page and workspace editor tab. */
export function NewProjectForm({ onCancel, className }: NewProjectFormProps) {
  const router = useRouter();
  const templates = useProjectTemplates() as TemplateMeta[] | undefined;
  const createProject = useCreateProject();
  const [name, setName] = useState(randomProjectName);
  const [templateId, setTemplateId] = useState<TemplateId>("react");
  const [filter, setFilter] = useState<GalleryFilter>("all");
  const [creating, setCreating] = useState(false);

  const visibleTemplates = useMemo(() => {
    if (!templates) return [];
    if (filter === "all") return templates;
    return templates.filter((template) => template.category === filter);
  }, [templates, filter]);

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Project name is required");
      return;
    }

    setCreating(true);
    try {
      const projectId = await createProject({
        name: trimmed,
        templateId,
      });
      toast.success("Project created");
      router.push(`/projects/${projectId}`);
    } catch (error) {
      toast.error(parseConvexErrorMessage(error, "Failed to create project"));
      setCreating(false);
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-6 max-w-xl">
        <h2
          className={cn(
            display.className,
            "text-2xl font-semibold tracking-tight",
          )}
        >
          Template gallery
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick a starter — React, Vite, Next, Node, or static — then name your
          project and open it in the editor.
        </p>
      </div>

      <div className="mb-6 space-y-2">
        <Label htmlFor="project-name">Project name</Label>
        <div className="flex gap-2">
          <Input
            id="project-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="my-project"
            autoFocus
            disabled={creating}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !creating) {
                void handleCreate();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={creating}
            onClick={() => setName(randomProjectName())}
          >
            Random
          </Button>
        </div>
      </div>

      <div className="mb-2">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Starters
          </p>
          <div
            className="flex flex-wrap gap-1 rounded-lg bg-muted/60 p-1"
            role="tablist"
            aria-label="Template category"
          >
            {CATEGORY_FILTERS.map((item) => {
              const active = filter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  disabled={creating}
                  onClick={() => {
                    setFilter(item.id);
                    if (!templates) return;
                    const next =
                      item.id === "all"
                        ? templates
                        : templates.filter((t) => t.category === item.id);
                    if (
                      next.length > 0 &&
                      !next.some((t) => t.id === templateId)
                    ) {
                      setTemplateId(next[0]!.id);
                    }
                  }}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
                    "outline-none focus-visible:ring-1 focus-visible:ring-ring/40",
                    active
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleTemplates.map((template, index) => {
            const id = template.id;
            const Icon = TEMPLATE_ICONS[id] ?? FolderIcon;
            const selected = templateId === id;

            return (
              <motion.button
                key={template.id}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.03 * index,
                  duration: 0.35,
                  ease: [0.22, 1, 0.36, 1],
                }}
                disabled={creating}
                onClick={() => setTemplateId(id)}
                className={cn(
                  "group flex flex-col items-start gap-3 rounded-md border p-4 text-left transition-colors",
                  "outline-none focus-visible:ring-1 focus-visible:ring-ring/40",
                  selected
                    ? "border-ring/50 bg-foreground/5"
                    : "border-border/60 bg-background/30 hover:border-border hover:bg-foreground/4",
                )}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-sm border transition-colors",
                      selected
                        ? "border-ring/40 text-ring"
                        : "border-border/60 text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  {selected ? (
                    <span className="rounded-full bg-ring/15 px-2 py-0.5 text-[10px] font-medium tracking-wide text-ring uppercase">
                      Selected
                    </span>
                  ) : null}
                </div>
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium tracking-tight">
                    {template.name}
                  </span>
                  <span className="mt-1 block text-[12px] leading-snug text-muted-foreground">
                    {template.description}
                  </span>
                </span>
                {template.tags.length > 0 ? (
                  <span className="flex flex-wrap gap-1.5">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-border/50 bg-background/50 px-2 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </span>
                ) : null}
              </motion.button>
            );
          })}
          {templates === undefined ? (
            <div className="col-span-full flex items-center gap-2 py-8 text-sm text-muted-foreground">
              Loading templates…
            </div>
          ) : visibleTemplates.length === 0 ? (
            <div className="col-span-full flex items-center gap-2 py-8 text-sm text-muted-foreground">
              No templates in this category.
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-end gap-3 border-t border-border/60 pt-6">
        {onCancel ? (
          <Button
            type="button"
            variant="ghost"
            disabled={creating}
            onClick={onCancel}
          >
            Cancel
          </Button>
        ) : null}
        <Button
          type="button"
          loading={creating}
          disabled={!name.trim() || templates === undefined}
          onClick={() => void handleCreate()}
        >
          {creating ? "Creating…" : "Create project"}
        </Button>
      </div>
    </div>
  );
}
