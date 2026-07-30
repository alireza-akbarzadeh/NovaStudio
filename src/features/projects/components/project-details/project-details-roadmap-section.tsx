"use client";

import { useMutation } from "convex/react";
import {
  CheckCircle2Icon,
  CircleIcon,
  CoinsIcon,
  Loader2Icon,
  PencilIcon,
  SproutIcon,
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
import {
  goodFirstIssueBadgeClass,
  todoStatusLabel,
} from "@/features/projects/lib/project-details-utils";
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

function GoodFirstIssueBadge() {
  return (
    <Badge className={goodFirstIssueBadgeClass}>
      <SproutIcon className="size-3" />
      Good first issue
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

  async function saveTodo(patch: {
    bountyAmount?: string;
    goodFirstIssue?: boolean;
  }) {
    setSaving(true);
    try {
      await upsertTodo({
        projectId: projectId as Id<"projects">,
        todoId: todo.id as Id<"projectPublicTodos">,
        title: todo.title,
        status: todo.status,
        bountyAmount:
          patch.bountyAmount !== undefined
            ? patch.bountyAmount.trim() || undefined
            : todo.bountyAmount,
        goodFirstIssue:
          patch.goodFirstIssue !== undefined
            ? patch.goodFirstIssue
            : todo.goodFirstIssue,
      });
    } catch (error) {
      toast.error(parseConvexErrorMessage(error, "Could not update roadmap item"));
      throw error;
    } finally {
      setSaving(false);
    }
  }

  async function saveBounty() {
    try {
      await saveTodo({ bountyAmount: draftBounty });
      setEditingBounty(false);
      toast.success(
        draftBounty.trim() ? "Bounty updated" : "Bounty removed",
      );
    } catch {
      /* toast shown in saveTodo */
    }
  }

  async function toggleGoodFirstIssue() {
    try {
      await saveTodo({ goodFirstIssue: !todo.goodFirstIssue });
      toast.success(
        todo.goodFirstIssue
          ? "Removed good first issue tag"
          : "Marked as good first issue",
      );
    } catch {
      /* toast shown in saveTodo */
    }
  }

  return (
    <li
      className={cn(
        "rounded-xl border px-3 py-3",
        todo.goodFirstIssue && todo.status !== "done"
          ? "border-emerald-500/25 bg-emerald-500/5"
          : "border-border/50 bg-muted/15",
      )}
    >
      <div className="flex items-start gap-3">
        {todo.status === "done" ? (
          <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-500" />
        ) : (
          <CircleIcon
            className={cn(
              "mt-0.5 size-4 shrink-0",
              todo.status === "in-progress"
                ? "text-violet-500"
                : todo.goodFirstIssue
                  ? "text-emerald-500"
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
            <div className="flex flex-wrap items-center gap-1.5">
              {todo.goodFirstIssue ? <GoodFirstIssueBadge /> : null}
              {todo.bountyAmount && !editingBounty ? (
                <BountyBadge amount={todo.bountyAmount} />
              ) : null}
            </div>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {todoStatusLabel[todo.status]}
          </p>

          {canManage && todo.status !== "done" ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => void toggleGoodFirstIssue()}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition",
                  todo.goodFirstIssue
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-border/60 text-muted-foreground hover:border-emerald-500/30 hover:text-emerald-700",
                )}
              >
                <SproutIcon className="size-3" />
                {todo.goodFirstIssue
                  ? "Good first issue"
                  : "Mark good first issue"}
              </button>

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

function roadmapPriority(todo: ProjectDetailsTodo) {
  if (todo.status === "done") return 0;
  let score = 0;
  if (todo.goodFirstIssue) score += 2;
  if (todo.bountyAmount) score += 1;
  return score;
}

export function ProjectDetailsRoadmapSection({
  projectId,
  todos,
  canManage = false,
}: ProjectDetailsRoadmapSectionProps) {
  const openBounties = useMemo(
    () =>
      todos.filter(
        (todo) => todo.bountyAmount && todo.status !== "done",
      ),
    [todos],
  );

  const goodFirstIssues = useMemo(
    () =>
      todos.filter(
        (todo) => todo.goodFirstIssue && todo.status !== "done",
      ),
    [todos],
  );

  const sortedTodos = useMemo(() => {
    return [...todos].sort(
      (a, b) => roadmapPriority(b) - roadmapPriority(a),
    );
  }, [todos]);

  return (
    <section className="rounded-[24px] border border-border/60 bg-card/85 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Public roadmap</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            What the team is building next
            {goodFirstIssues.length > 0
              ? ` · ${goodFirstIssues.length} good first ${goodFirstIssues.length === 1 ? "issue" : "issues"}`
              : ""}
            {openBounties.length > 0
              ? ` · ${openBounties.length} open ${openBounties.length === 1 ? "bounty" : "bounties"}`
              : ""}
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {goodFirstIssues.length > 0 ? (
            <Badge variant="outline" className={goodFirstIssueBadgeClass}>
              <SproutIcon className="size-3" />
              {goodFirstIssues.length} beginner-friendly
            </Badge>
          ) : null}
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
