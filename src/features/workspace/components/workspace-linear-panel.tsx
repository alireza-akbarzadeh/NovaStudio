/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  CircleDotIcon,
  KanbanSquareIcon,
  Link2Icon,
  Loader2Icon,
  PlusIcon,
  RefreshCwIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  GitHubHubErrorState,
  GitHubHubToolbar,
  GitHubLoadingRow,
} from "@/features/github/components/github-hub-ui";
import { useLinearConnection } from "@/features/integrations/hooks/use-linear-connection";
import {
  memberLabel,
  pickStageState,
  stageFromStateType,
  useLinearIssues,
  type LinearCycleSummary,
  type LinearIssueDetail,
  type LinearIssueScope,
  type LinearIssueSummary,
  type LinearMember,
  type LinearTaskStage,
  type LinearTeamSummary,
} from "@/features/integrations/hooks/use-linear-issues";
import { useProjectLinearLink } from "@/features/integrations/hooks/use-project-linear-link";
import { cn } from "@/lib/utils";

type WorkspaceLinearPanelProps = {
  projectId: string;
};

type View =
  | { kind: "list" }
  | { kind: "detail"; identifier: string }
  | { kind: "create" };

const SCOPES: { id: LinearIssueScope; label: string }[] = [
  { id: "mine", label: "Mine" },
  { id: "team", label: "Team" },
  { id: "cycle", label: "Cycle" },
];

const STAGE_BUTTONS: { id: LinearTaskStage; label: string }[] = [
  { id: "todo", label: "Todo" },
  { id: "started", label: "In Progress" },
  { id: "done", label: "Done" },
];

function formatRelativeDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function StateBadge({
  state,
}: {
  state?: { name: string; color?: string; type?: string } | null;
}) {
  if (!state) return null;
  const color = state.color ? `#${state.color.replace(/^#/, "")}` : undefined;
  return (
    <span
      className="inline-flex max-w-full items-center gap-1 truncate rounded-full px-1.5 py-0.5 text-[9px] font-medium"
      style={color ? { backgroundColor: `${color}22`, color } : undefined}
    >
      <CircleDotIcon className="size-2.5 shrink-0" />
      <span className="truncate">{state.name}</span>
    </span>
  );
}

export function WorkspaceLinearPanel({ projectId }: WorkspaceLinearPanelProps) {
  const { isConnected, isLoading: isConnectionLoading } = useLinearConnection();
  const { link } = useProjectLinearLink(projectId);
  const {
    listTeams,
    listMembers,
    getActiveCycle,
    listIssues,
    getIssue,
    createIssue,
    updateIssueState,
    updateAssignee,
    linkToProject,
    isListingTeams,
    isListingMembers,
    isListing,
    isLoadingDetail,
    isCreating,
    isUpdatingState,
    isUpdatingAssignee,
    isLinking,
  } = useLinearIssues(projectId);

  const [view, setView] = useState<View>({ kind: "list" });
  const [teams, setTeams] = useState<LinearTeamSummary[] | null>(null);
  const [members, setMembers] = useState<LinearMember[] | null>(null);
  const [teamId, setTeamId] = useState<string>("");
  const [scope, setScope] = useState<LinearIssueScope>("mine");
  const [issues, setIssues] = useState<LinearIssueSummary[] | null>(null);
  const [activeCycle, setActiveCycle] = useState<LinearCycleSummary | null>(
    null,
  );
  const [detail, setDetail] = useState<LinearIssueDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAssigneeId, setNewAssigneeId] = useState("");
  const [newStage, setNewStage] = useState<LinearTaskStage>("todo");
  const [addToActiveCycle, setAddToActiveCycle] = useState(false);

  const loadTeams = useCallback(async () => {
    if (!isConnected) return;
    setError(null);
    try {
      const next = await listTeams();
      setTeams(next);
      setTeamId((current) => current || next[0]?.id || "");
    } catch (err) {
      setTeams(null);
      setError(err instanceof Error ? err.message : "Failed to load teams");
    }
  }, [isConnected, listTeams]);

  const loadMembers = useCallback(async () => {
    if (!isConnected || !teamId) return;
    try {
      setMembers(await listMembers(teamId));
    } catch {
      setMembers([]);
    }
  }, [isConnected, listMembers, teamId]);

  const loadActiveCycle = useCallback(async () => {
    if (!isConnected || !teamId) return;
    setActiveCycle(await getActiveCycle(teamId));
  }, [getActiveCycle, isConnected, teamId]);

  const loadList = useCallback(async () => {
    if (!isConnected || !teamId) return;
    setError(null);
    try {
      const result = await listIssues(teamId, scope);
      setIssues(result.issues);
      setActiveCycle(result.activeCycle);
    } catch (err) {
      setIssues(null);
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    }
  }, [isConnected, listIssues, scope, teamId]);

  const loadDetail = useCallback(
    async (identifier: string) => {
      if (!isConnected) return;
      setError(null);
      setDetail(null);
      try {
        setDetail(await getIssue(identifier));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load task");
      }
    },
    [getIssue, isConnected],
  );

  useEffect(() => {
    if (!isConnected) return;
    loadTeams().catch(console.error);
  }, [isConnected, loadTeams]);

  useEffect(() => {
    if (!isConnected || !teamId) return;
    loadMembers().catch(console.error);
    loadActiveCycle().catch(console.error);
  }, [isConnected, loadActiveCycle, loadMembers, teamId]);

  useEffect(() => {
    if (!isConnected || view.kind !== "list" || !teamId) return;
    loadList().catch(console.error);
  }, [isConnected, loadList, teamId, view.kind]);

  useEffect(() => {
    if (!isConnected || view.kind !== "detail") return;
    loadDetail(view.identifier).catch(console.error);
  }, [isConnected, loadDetail, view]);

  useEffect(() => {
    setAddToActiveCycle(Boolean(activeCycle));
  }, [activeCycle]);

  if (isConnectionLoading) {
    return <GitHubLoadingRow label="Loading Linear…" />;
  }

  if (!isConnected) {
    return (
      <div className="space-y-3 px-3 py-4">
        <div className="flex items-center gap-2 text-[11px] text-ws-text">
          <KanbanSquareIcon className="size-3.5 text-ws-text-muted" />
          <span className="font-medium">Linear tasks</span>
        </div>
        <p className="text-[11px] leading-relaxed text-ws-text-muted">
          Connect Linear in Integrations to create tasks, assign teammates, and
          move work from Todo → In Progress → Done without leaving the editor.
        </p>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-7 border-ws-border bg-ws-bg text-[11px] text-ws-text hover:bg-ws-hover"
        >
          <Link href="/projects/integrations">Open Integrations</Link>
        </Button>
      </div>
    );
  }

  if (view.kind === "create") {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <GitHubHubToolbar
          title="New task"
          onBack={() => setView({ kind: "list" })}
        />
        <div className="min-h-0 flex-1 space-y-3 overflow-auto p-3">
          {teams && teams.length > 1 ? (
            <label className="block space-y-1">
              <span className="text-[10px] tracking-wide text-ws-text-muted uppercase">
                Team
              </span>
              <select
                value={teamId}
                onChange={(event) => {
                  setTeamId(event.target.value);
                  setNewAssigneeId("");
                }}
                className="h-8 w-full rounded-md border border-ws-border bg-ws-bg px-2 text-[12px] text-ws-text"
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.key} — {team.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <Input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="Task title"
            className="h-8 border-ws-border bg-ws-bg text-[12px] text-ws-text"
          />
          <Textarea
            value={newDescription}
            onChange={(event) => setNewDescription(event.target.value)}
            placeholder="Description (optional)"
            rows={6}
            className="min-h-28 resize-none border-ws-border bg-ws-bg text-[12px] text-ws-text"
          />
          <label className="block space-y-1">
            <span className="text-[10px] tracking-wide text-ws-text-muted uppercase">
              Assign to
            </span>
            <select
              value={newAssigneeId}
              onChange={(event) => setNewAssigneeId(event.target.value)}
              disabled={isListingMembers}
              className="h-8 w-full rounded-md border border-ws-border bg-ws-bg px-2 text-[12px] text-ws-text disabled:opacity-60"
            >
              <option value="">Unassigned</option>
              {members?.map((member) => (
                <option key={member.id} value={member.id}>
                  {memberLabel(member)}
                  {member.email ? ` (${member.email})` : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="space-y-1">
            <span className="text-[10px] tracking-wide text-ws-text-muted uppercase">
              Starting state
            </span>
            <div className="flex flex-wrap gap-1">
              {STAGE_BUTTONS.map((stage) => (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setNewStage(stage.id)}
                  className={cn(
                    "rounded-sm px-2 py-1 text-[10px] font-medium transition-colors",
                    newStage === stage.id
                      ? "bg-ws-accent/15 text-ws-accent"
                      : "bg-ws-stage/40 text-ws-text-muted hover:bg-ws-hover hover:text-ws-text",
                  )}
                >
                  {stage.label}
                </button>
              ))}
            </div>
          </div>
          <label
            className={cn(
              "flex items-center gap-2 text-[11px]",
              activeCycle
                ? "text-ws-text-secondary"
                : "text-ws-text-muted opacity-70",
            )}
          >
            <input
              type="checkbox"
              checked={addToActiveCycle && Boolean(activeCycle)}
              disabled={!activeCycle}
              onChange={(event) => setAddToActiveCycle(event.target.checked)}
              className="size-3.5 rounded border-ws-border"
            />
            {activeCycle
              ? `Add to active cycle (${activeCycle.name || `Cycle ${activeCycle.number}`})`
              : "No active cycle for this team"}
          </label>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={!newTitle.trim() || !teamId || isCreating}
              onClick={() =>
                void createIssue({
                  teamId,
                  title: newTitle.trim(),
                  description: newDescription.trim() || undefined,
                  addToActiveCycle: Boolean(activeCycle) && addToActiveCycle,
                  assigneeId: newAssigneeId || undefined,
                  initialStage: newStage,
                }).then((issue) => {
                  setNewTitle("");
                  setNewDescription("");
                  setNewAssigneeId("");
                  setNewStage("todo");
                  setView({ kind: "detail", identifier: issue.identifier });
                })
              }
              className="h-7 bg-ws-accent text-[11px] text-white hover:bg-ws-accent-hover"
            >
              {isCreating ? (
                <>
                  <Loader2Icon className="size-3.5 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create task"
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setView({ kind: "list" })}
              className="h-7 border-ws-border bg-ws-bg text-[11px] text-ws-text hover:bg-ws-hover"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (view.kind === "detail") {
    const isProjectLink =
      link?.issueIdentifier?.toUpperCase() ===
      (detail?.identifier ?? view.identifier).toUpperCase();
    const currentStage = stageFromStateType(detail?.state?.type);

    const applyStage = async (stage: LinearTaskStage) => {
      if (!detail) return;
      const nextState = pickStageState(detail.team.states.nodes, stage);
      if (!nextState) {
        return;
      }
      if (nextState.id === detail.state?.id) return;
      try {
        await updateIssueState(detail.id, nextState.id);
        setDetail((current) =>
          current
            ? {
                ...current,
                state: {
                  id: nextState.id,
                  name: nextState.name,
                  type: nextState.type,
                  color: nextState.color,
                },
              }
            : current,
        );
      } catch {
        // toast in hook
      }
    };

    return (
      <div className="flex h-full min-h-0 flex-col">
        <GitHubHubToolbar
          title={detail?.identifier ?? view.identifier}
          onBack={() => {
            setView({ kind: "list" });
            setDetail(null);
          }}
          onRefresh={() =>
            void loadDetail(detail?.identifier ?? view.identifier)
          }
          isRefreshing={isLoadingDetail}
          externalUrl={detail?.url}
        />
        <div className="min-h-0 flex-1 overflow-auto">
          {isLoadingDetail && !detail ? (
            <GitHubLoadingRow label="Loading task…" />
          ) : error && !detail ? (
            <GitHubHubErrorState
              message={error}
              onRetry={() => void loadDetail(view.identifier)}
            />
          ) : detail ? (
            <div className="space-y-3 p-3">
              <div className="space-y-2">
                <StateBadge state={detail.state} />
                <h3 className="text-[13px] font-medium leading-snug text-ws-text">
                  {detail.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-ws-text-muted">
                  {detail.cycle ? (
                    <span>
                      {detail.cycle.name || `Cycle ${detail.cycle.number}`}
                    </span>
                  ) : null}
                  <span className={detail.cycle ? "" : undefined}>
                    {detail.cycle ? "· " : ""}
                    {formatRelativeDate(detail.updatedAt)}
                  </span>
                </div>
                {detail.description ? (
                  <div className="rounded-md border border-ws-border/70 bg-ws-stage/30 p-2.5 text-[12px] leading-relaxed whitespace-pre-wrap text-ws-text-secondary">
                    {detail.description}
                  </div>
                ) : (
                  <p className="text-[11px] text-ws-text-muted italic">
                    No description provided.
                  </p>
                )}

                <div className="space-y-1">
                  <span className="text-[10px] tracking-wide text-ws-text-muted uppercase">
                    Status
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {STAGE_BUTTONS.map((stage) => {
                      const available = pickStageState(
                        detail.team.states.nodes,
                        stage.id,
                      );
                      return (
                        <button
                          key={stage.id}
                          type="button"
                          disabled={
                            isUpdatingState || !available
                          }
                          onClick={() => void applyStage(stage.id)}
                          className={cn(
                            "rounded-sm px-2 py-1 text-[10px] font-medium transition-colors disabled:opacity-40",
                            currentStage === stage.id
                              ? "bg-ws-accent/15 text-ws-accent"
                              : "border border-ws-border bg-ws-bg text-ws-text-muted hover:bg-ws-hover hover:text-ws-text",
                          )}
                        >
                          {stage.label}
                        </button>
                      );
                    })}
                  </div>
                  <label className="mt-2 block space-y-1">
                    <span className="text-[10px] tracking-wide text-ws-text-muted uppercase">
                      Exact state
                    </span>
                    <select
                      value={detail.state?.id ?? ""}
                      disabled={isUpdatingState}
                      onChange={(event) => {
                        const stateId = event.target.value;
                        if (!stateId || stateId === detail.state?.id) return;
                        const nextState = detail.team.states.nodes.find(
                          (state) => state.id === stateId,
                        );
                        void updateIssueState(detail.id, stateId).then(() => {
                          setDetail((current) =>
                            current && nextState
                              ? {
                                  ...current,
                                  state: {
                                    id: nextState.id,
                                    name: nextState.name,
                                    type: nextState.type,
                                    color: nextState.color,
                                  },
                                }
                              : current,
                          );
                        });
                      }}
                      className="h-8 w-full rounded-md border border-ws-border bg-ws-bg px-2 text-[12px] text-ws-text disabled:opacity-60"
                    >
                      {detail.team.states.nodes.map((state) => (
                        <option key={state.id} value={state.id}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block space-y-1">
                  <span className="text-[10px] tracking-wide text-ws-text-muted uppercase">
                    Assignee
                  </span>
                  <select
                    value={detail.assignee?.id ?? ""}
                    disabled={isUpdatingAssignee || isListingMembers}
                    onChange={(event) => {
                      const nextId = event.target.value || null;
                      void updateAssignee(detail.id, nextId).then((result) => {
                        setDetail((current) =>
                          current
                            ? { ...current, assignee: result.assignee ?? null }
                            : current,
                        );
                      });
                    }}
                    className="h-8 w-full rounded-md border border-ws-border bg-ws-bg px-2 text-[12px] text-ws-text disabled:opacity-60"
                  >
                    <option value="">Unassigned</option>
                    {members?.map((member) => (
                      <option key={member.id} value={member.id}>
                        {memberLabel(member)}
                      </option>
                    ))}
                    {detail.assignee &&
                    !members?.some((m) => m.id === detail.assignee?.id) ? (
                      <option value={detail.assignee.id}>
                        {memberLabel(detail.assignee)}
                      </option>
                    ) : null}
                  </select>
                </label>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isLinking || isProjectLink}
                  onClick={() => void linkToProject(detail.identifier)}
                  className="h-7 border-ws-border bg-ws-bg text-[11px] text-ws-text hover:bg-ws-hover"
                >
                  {isLinking ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : (
                    <Link2Icon className="size-3.5" />
                  )}
                  {isProjectLink ? "Linked to project" : "Link to project"}
                </Button>
                {isProjectLink ? (
                  <p className="text-[10px] leading-relaxed text-ws-text-muted">
                    Push and deploy will comment and update this task’s workflow
                    state when matching statuses exist.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  const selectedTeam = teams?.find((team) => team.id === teamId);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-col gap-1.5 border-b border-ws-border-subtle px-2 py-1.5">
        <div className="flex items-center gap-1.5">
          {isListingTeams && !teams ? (
            <span className="text-[11px] text-ws-text-muted">Loading teams…</span>
          ) : teams && teams.length > 0 ? (
            <select
              value={teamId}
              onChange={(event) => {
                setTeamId(event.target.value);
                setIssues(null);
                setMembers(null);
              }}
              className="h-6 min-w-0 flex-1 rounded-sm border border-ws-border bg-ws-bg px-1.5 text-[11px] text-ws-text"
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.key} — {team.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="min-w-0 flex-1 truncate text-[11px] text-ws-text-muted">
              No teams available
            </span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="New task"
            aria-label="New task"
            disabled={!teamId}
            onClick={() => setView({ kind: "create" })}
            className="size-5 rounded-sm text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
          >
            <PlusIcon className="size-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Refresh"
            aria-label="Refresh tasks"
            disabled={isListing || !teamId}
            onClick={() => void loadList()}
            className="size-5 rounded-sm text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
          >
            <RefreshCwIcon
              className={cn("size-3", isListing && "animate-spin")}
            />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          {SCOPES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setScope(item.id);
                setIssues(null);
              }}
              className={cn(
                "rounded-sm px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                scope === item.id
                  ? "bg-ws-accent/15 text-ws-accent"
                  : "text-ws-text-muted hover:bg-ws-hover hover:text-ws-text",
              )}
            >
              {item.label}
              {item.id === "cycle" && activeCycle
                ? ` · ${activeCycle.name || activeCycle.number}`
                : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {!teamId && teams && teams.length === 0 ? (
          <p className="px-3 py-4 text-[11px] text-ws-text-muted">
            Your Linear key has no teams. Create a team in Linear first.
          </p>
        ) : isListing && issues === null ? (
          <GitHubLoadingRow label="Loading tasks…" />
        ) : error ? (
          <GitHubHubErrorState message={error} onRetry={() => void loadList()} />
        ) : issues && issues.length === 0 ? (
          <div className="space-y-3 px-3 py-4">
            <p className="text-[11px] text-ws-text-muted">
              {scope === "cycle" && !activeCycle
                ? `${selectedTeam?.name ?? "This team"} has no active cycle.`
                : `No ${scope === "mine" ? "assigned " : scope === "cycle" ? "cycle " : ""}tasks found.`}
            </p>
            <Button
              type="button"
              size="sm"
              disabled={!teamId}
              onClick={() => setView({ kind: "create" })}
              className="h-7 bg-ws-accent text-[11px] text-white hover:bg-ws-accent-hover"
            >
              <PlusIcon className="size-3.5" />
              Create task
            </Button>
          </div>
        ) : (
          <ul className="space-y-0 p-1.5">
            {issues?.map((issue) => (
              <li key={issue.id}>
                <button
                  type="button"
                  onClick={() =>
                    setView({ kind: "detail", identifier: issue.identifier })
                  }
                  className="flex w-full gap-2 rounded-sm px-2 py-1.5 text-left transition-colors hover:bg-ws-hover"
                >
                  <CircleDotIcon
                    className="mt-0.5 size-3 shrink-0"
                    style={
                      issue.state?.color
                        ? {
                            color: `#${issue.state.color.replace(/^#/, "")}`,
                          }
                        : undefined
                    }
                  />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-start gap-1.5">
                      <span className="shrink-0 font-mono text-[10px] text-ws-link">
                        {issue.identifier}
                      </span>
                      <p className="min-w-0 flex-1 text-[12px] leading-snug text-ws-text">
                        {issue.title}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-ws-text-muted">
                      {issue.state ? <StateBadge state={issue.state} /> : null}
                      {issue.assignee ? (
                        <span className="truncate">
                          {memberLabel(issue.assignee)}
                        </span>
                      ) : (
                        <span className="truncate italic">Unassigned</span>
                      )}
                      <span className="ml-auto shrink-0">
                        {formatRelativeDate(issue.updatedAt)}
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
