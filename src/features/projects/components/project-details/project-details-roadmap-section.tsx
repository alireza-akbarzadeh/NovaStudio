"use client";

import { useMutation } from "convex/react";
import {
  CheckCircle2Icon,
  CircleIcon,
  CoinsIcon,
  Loader2Icon,
  PencilIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { parseConvexErrorMessage } from "@/features/github/lib/github-errors";
import type { ProjectDetailsTodo } from "@/features/projects/lib/project-details-types";
import { todoStatusLabel } from "@/features/projects/lib/project-details-utils";
import { cn } from "@/lib/utils";

type ProjectDetailsRoadmapSectionProps = {
  projectId: string;
  todos: ProjectDetailsTodo[];
  canManage?: boolean;
};

function BountyBadge({ amount }: { amount: string }) {
  return (
    <Badge className="gap-1 rounded-full border-amber-500/25 bg-amber-500/12 text-amber-800 dark:text-amber-300">
      <CoinsIcon className="size-3" />
      {amount} bounty
    </Badge>
  );
}

function RoadmapTodoRow({
  todo,
  projectId,
  canManage,
}: {
  todo: ProjectDetailsTodo;
  projectId: string;
  canManage: boolean;
}) {
  const upsertTodo = useMutation(api.projectCommunity.upsertPublicTodo);
  const [editingBounty, setEditingBounty] = useState(false);
  const [draftBounty, setDraftBounty] = useState(todo.bountyAmount ?? "");
  const [saving, setSaving] = useState(false);

  async function saveBounty() {
    setSaving(true);
    try {
      await upsertTodo({
        projectId: projectId as Id<"projects">,
        todoId: todo.id as Id<"projectPublicTodos">,
        title: todo.title,
        status: todo.status,
        bountyAmount: draftBounty.trim() || undefined,
      });
      setEditingBounty(false);
      toast.success(
        draftBounty.trim() ? "Bounty updated" : "Bounty removed",
      );
    } catch (error) {
      toast.error(parseConvexErrorMessage(error, "Could not update bounty"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="rounded-xl border border-border/50 bg-muted/15 px-3 py-3">
      <div className="flex items-start gap-3">
        {todo.status === "done" ? (
          <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-500" />
        ) : (
          <CircleIcon
            className={cn(
              "mt-0.5 size-4 shrink-0",
              todo.status === "in-progress"
                ? "text-violet-500"
                : "text-muted-foreground",
            )}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p
              className={cn(
                "text-sm font-medium",
                todo.status === "done" &&
                  "text-muted-foreground line-through",
              )}
            >
              {todo.title}
            </p>
            {todo.bountyAmount && !editingBounty ? (
              <BountyBadge amount={todo.bountyAmount} />
            ) : null}
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {todoStatusLabel[todo.status]}
          </p>

          {canManage && todo.status !== "done" ? (
            <div className="mt-3">
              {editingBounty ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={draftBounty}
                    onChange={(event) => setDraftBounty(event.target.value)}
                    placeholder="$500 / €200"
                    className="h-8 max-w-[180px] rounded-lg text-sm"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 rounded-lg"
                    disabled={saving}
                    onClick={() => void saveBounty()}
                  >
                    {saving ? (
                      <Loader2Icon className="size-3.5 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 rounded-lg"
                    disabled={saving}
                    onClick={() => {
                      setDraftBounty(todo.bountyAmount ?? "");
                      setEditingBounty(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDraftBounty(todo.bountyAmount ?? "");
                    setEditingBounty(true);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                >
                  <PencilIcon className="size-3" />
                  {todo.bountyAmount ? "Edit bounty" : "Add bounty"}
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export function ProjectDetailsRoadmapSection({
  projectId,
  todos,
  canManage = false,
}: ProjectDetailsRoadmapSectionProps) {
  const openBounties = useMemo(
    () =>
      todos.filter(
        (todo) =>
          todo.bountyAmount &&
          todo.status !== "done",
      ),
    [todos],
  );

  const sortedTodos = useMemo(() => {
    return [...todos].sort((a, b) => {
      const aOpen = a.bountyAmount && a.status !== "done" ? 1 : 0;
      const bOpen = b.bountyAmount && b.status !== "done" ? 1 : 0;
      return bOpen - aOpen;
    });
  }, [todos]);

  return (
    <section className="rounded-[24px] border border-border/60 bg-card/85 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Public roadmap</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            What the team is building next
            {openBounties.length > 0
              ? ` · ${openBounties.length} open ${openBounties.length === 1 ? "bounty" : "bounties"}`
              : ""}
            .
          </p>
        </div>
        {openBounties.length > 0 ? (
          <Badge
            variant="outline"
            className="gap-1 rounded-full border-amber-500/30 bg-amber-500/8 text-amber-800 dark:text-amber-300"
          >
            <CoinsIcon className="size-3" />
            {openBounties.length} funded
          </Badge>
        ) : null}
      </div>

      {sortedTodos.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {sortedTodos.map((todo) => (
            <RoadmapTodoRow
              key={todo.id}
              todo={todo}
              projectId={projectId}
              canManage={canManage}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
          The owner hasn&apos;t published a roadmap yet.
        </p>
      )}
    </section>
  );
}
