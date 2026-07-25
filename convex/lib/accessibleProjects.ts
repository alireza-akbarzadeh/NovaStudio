import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { verifyAuth } from "../auth";

export type AccessibleProject = Doc<"projects"> & {
  role: "owner" | "editor" | "viewer";
};

export async function listAccessibleProjects(
  ctx: QueryCtx | MutationCtx,
): Promise<AccessibleProject[]> {
  const identity = await verifyAuth(ctx);
  const userId = identity.subject;

  const owned = await ctx.db
    .query("projects")
    .withIndex("by_owner_updated", (q) => q.eq("ownerId", userId))
    .order("desc")
    .collect();

  const memberships = await ctx.db
    .query("projectMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  const shared: AccessibleProject[] = [];
  for (const membership of memberships) {
    if (membership.role === "owner") continue;
    const project = await ctx.db.get("projects", membership.projectId);
    if (project && project.ownerId !== userId) {
      shared.push({ ...project, role: membership.role });
    }
  }

  const ownedWithRole: AccessibleProject[] = owned.map((project) => ({
    ...project,
    role: "owner" as const,
  }));

  const byId = new Map(
    [...ownedWithRole, ...shared].map((project) => [project._id, project]),
  );
  return [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function listOwnedProjectIds(
  ctx: QueryCtx | MutationCtx,
  userId: string,
): Promise<Id<"projects">[]> {
  const owned = await ctx.db
    .query("projects")
    .withIndex("by_owner", (q) => q.eq("ownerId", userId))
    .collect();
  return owned.map((project) => project._id);
}

export function coverToneForProject(project: Doc<"projects">) {
  if (project.coverTone) return project.coverTone;
  const tones = [
    "bg-gradient-to-br from-violet-600 via-indigo-500 to-fuchsia-500",
    "bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600",
    "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600",
    "bg-gradient-to-br from-orange-500 via-rose-500 to-purple-600",
    "bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-600",
    "bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500",
  ];
  let hash = 0;
  for (let i = 0; i < project._id.length; i += 1) {
    hash = (hash * 31 + project._id.charCodeAt(i)) >>> 0;
  }
  return tones[hash % tones.length]!;
}

export function techForProject(project: Doc<"projects">) {
  if (project.tech && project.tech.length > 0) return project.tech;
  switch (project.templateId) {
    case "nextjs":
      return ["Next.js", "TypeScript"];
    case "react":
      return ["React", "Vite"];
    case "vite":
      return ["Vite", "TypeScript"];
    case "node":
      return ["Node", "TypeScript"];
    case "static":
      return ["HTML", "CSS", "JS"];
    case "tanstack":
      return ["TanStack", "TypeScript"];
    case "simple":
      return ["TypeScript"];
    default:
      return project.source === "github" ? ["GitHub"] : ["Blank"];
  }
}

export function formatRelativeTime(timestamp: number) {
  const delta = Date.now() - timestamp;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (delta < minute) return "Just now";
  if (delta < hour) return `${Math.floor(delta / minute)}m ago`;
  if (delta < day) return `${Math.floor(delta / hour)}h ago`;
  if (delta < 7 * day) return `${Math.floor(delta / day)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
