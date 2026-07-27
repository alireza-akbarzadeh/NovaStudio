"use client";

import {
  Show,
  useOrganization,
  useOrganizationList,
} from "@clerk/nextjs";
import { useAction } from "convex/react";
import {
  Building2Icon,
  Loader2Icon,
  UserPlusIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { parseConvexErrorMessage } from "@/features/github/lib/github-errors";
import { HubPageHeader } from "@/features/projects/components/workspace/hub-page-header";
import { TeamPendingRequestsSection } from "@/features/projects/components/workspace/team-pending-requests-section";
import {
  useTeamDirectory,
  useWorkspaceProjects,
} from "@/features/projects/hooks/use-workspace";
import { reportInviteResult } from "@/features/sharing/lib/report-invite-result";
import { cn } from "@/lib/utils";

const roleBadge = {
  owner: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  editor: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  viewer: "bg-muted text-muted-foreground",
} as const;

const orgRoleBadge: Record<string, string> = {
  "org:admin": "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "org:member": "bg-sky-500/15 text-sky-700 dark:text-sky-300",
};

type InviteRole = "editor" | "viewer";

function initialsFrom(name: string) {
  return (
    name
      .split(/\s+/)
      .map((part) => part[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"
  );
}

function ProjectInviteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const projects = useWorkspaceProjects();
  const inviteByEmail = useAction(api.sharing.inviteByEmail);

  const ownedProjects = useMemo(
    () => (projects ?? []).filter((project) => project.role === "owner"),
    [projects],
  );

  const [projectId, setProjectId] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("editor");
  const [submitting, setSubmitting] = useState(false);

  const selectedProjectId = projectId || ownedProjects[0]?.id || "";

  async function handleInvite(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedProjectId || !email.trim() || submitting) return;

    setSubmitting(true);
    try {
      const result = await inviteByEmail({
        projectId: selectedProjectId as Id<"projects">,
        email: email.trim(),
        role,
      });
      await reportInviteResult(result);
      setEmail("");
      onOpenChange(false);
    } catch (error) {
      toast.error(parseConvexErrorMessage(error, "Failed to invite member"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite to project</DialogTitle>
          <DialogDescription>
            Grant editor or viewer access to one of your projects. This does not
            add them to the organization.
          </DialogDescription>
        </DialogHeader>

        {projects === undefined ? (
          <Skeleton className="h-32 rounded-xl" />
        ) : ownedProjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Create a project you own first, then you can invite teammates here.
          </p>
        ) : (
          <form
            id="team-invite-form"
            onSubmit={(event) => void handleInvite(event)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="team-invite-email">Email</Label>
              <Input
                id="team-invite-email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="teammate@example.com"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Project</Label>
                <Select
                  value={selectedProjectId || undefined}
                  onValueChange={setProjectId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {ownedProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={role}
                  onValueChange={(value) => setRole(value as InviteRole)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">Can edit</SelectItem>
                    <SelectItem value="viewer">Can view</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="text-[12px] text-muted-foreground">
              If they already have an account, they&apos;re added immediately.
              Otherwise an invite link is copied for you to share.
            </p>
          </form>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="team-invite-form"
            disabled={
              submitting ||
              ownedProjects.length === 0 ||
              !email.trim() ||
              !selectedProjectId
            }
          >
            {submitting ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Inviting…
              </>
            ) : (
              <>
                <UserPlusIcon className="size-4" />
                Invite
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OrgMembersSection() {
  const { organization, memberships, isLoaded } = useOrganization({
    memberships: {
      infinite: true,
    },
  });

  if (!isLoaded) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  const rows = memberships?.data ?? [];

  if (rows.length === 0) {
    return (
      <div className="rounded-[22px] border border-dashed border-border/70 bg-card/50 px-6 py-12 text-center backdrop-blur-xl">
        <h2 className="text-lg font-semibold tracking-tight">
          No organization members yet
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Invite people to {organization?.name ?? "this team"} from Organization
          settings. Then grant them project access below.
        </p>
        <Button asChild size="sm" className="mt-4 rounded-xl">
          <Link href="/projects/org">
            <Building2Icon className="size-3.5" />
            Manage organization
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {rows.map((membership) => {
        const user = membership.publicUserData;
        const name =
          [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
          user?.identifier ||
          "Member";
        const roleKey = membership.role;
        return (
          <li
            key={membership.id}
            className="rounded-[20px] border border-border/60 bg-card/80 p-4 backdrop-blur-xl"
          >
            <div className="flex items-start gap-3">
              {user?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.imageUrl}
                  alt=""
                  className="size-11 shrink-0 rounded-2xl object-cover"
                />
              ) : (
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-sm font-semibold">
                  {initialsFrom(name)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold tracking-tight">
                    {name}
                  </p>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      orgRoleBadge[roleKey] ?? roleBadge.viewer,
                    )}
                  >
                    {roleKey.replace(/^org:/, "")}
                  </span>
                </div>
                {user?.identifier ? (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {user.identifier}
                  </p>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ProjectCollaboratorsSection() {
  const members = useTeamDirectory();

  if (members === undefined) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="rounded-[22px] border border-dashed border-border/70 bg-card/50 px-6 py-12 text-center backdrop-blur-xl">
        <h2 className="text-lg font-semibold tracking-tight">
          No project collaborators yet
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Invite someone to a project. They&apos;ll show up here across every
          project you share in this workspace.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {members.map((member) => (
        <li
          key={member.userId}
          className="rounded-[20px] border border-border/60 bg-card/80 p-4 backdrop-blur-xl"
        >
          <div className="flex items-start gap-3">
            <span
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold text-white"
              style={{ backgroundColor: member.color }}
            >
              {member.initials}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold tracking-tight">
                  {member.name}
                </p>
                {member.roles.map((memberRole) => (
                  <span
                    key={memberRole}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                      roleBadge[memberRole],
                    )}
                  >
                    {memberRole}
                  </span>
                ))}
              </div>
              {member.email ? (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {member.email}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {member.projects.map((project) => (
                  <Link
                    key={`${member.userId}-${project.id}`}
                    href={`/projects/${project.id}`}
                    className="rounded-full bg-muted/70 px-2.5 py-1 text-[11px] text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                  >
                    {project.name}
                    <span className="ml-1 opacity-60">· {project.role}</span>
                  </Link>
                ))}
              </div>
            </div>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {member.projects.length} project
              {member.projects.length === 1 ? "" : "s"}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function TeamHubView() {
  const { organization, isLoaded } = useOrganization();
  const { isLoaded: listLoaded } = useOrganizationList();
  const projects = useWorkspaceProjects();
  const [dialogOpen, setDialogOpen] = useState(false);

  const ownedProjects = useMemo(
    () => (projects ?? []).filter((project) => project.role === "owner"),
    [projects],
  );

  const inOrg = Boolean(organization);

  function openInviteDialog() {
    setDialogOpen(true);
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <TeamPendingRequestsSection />

      <HubPageHeader
        title="Team"
        description={
          inOrg
            ? "Organization members (Clerk roles) and project collaborators (editor / viewer)."
            : "Invite collaborators to a project. Create a team from the organization switcher for shared workspaces."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {inOrg ? (
              <Show when={{ permission: "org:sys_memberships:manage" }}>
                <Button asChild size="sm" variant="outline" className="rounded-xl">
                  <Link href="/projects/org">
                    <Building2Icon className="size-3.5" />
                    Add to org
                  </Link>
                </Button>
              </Show>
            ) : null}
            <Button
              size="sm"
              className="rounded-xl"
              onClick={openInviteDialog}
              disabled={
                projects !== undefined && ownedProjects.length === 0
              }
            >
              <UserPlusIcon className="size-3.5" />
              Invite to project
            </Button>
          </div>
        }
      />

      {!isLoaded || !listLoaded ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : inOrg ? (
        <div className="space-y-8">
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold tracking-tight">
                Organization members
              </h2>
              <Show when={{ permission: "org:sys_memberships:manage" }}>
                <Button asChild size="sm" variant="ghost" className="rounded-lg">
                  <Link href="/projects/org">Manage roles</Link>
                </Button>
              </Show>
            </div>
            <OrgMembersSection />
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold tracking-tight">
              Project collaborators
            </h2>
            <p className="text-xs text-muted-foreground">
              Org membership alone does not open projects. Invite people to each
              project with editor or viewer access.
            </p>
            <ProjectCollaboratorsSection />
          </section>
        </div>
      ) : (
        <ProjectCollaboratorsSection />
      )}

      <ProjectInviteDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
