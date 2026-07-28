import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  coverToneForProject,
  formatRelativeTime,
  techForProject,
} from "./lib/accessibleProjects";
import {
  colorForUserId,
  identityDisplayName,
  identityEmail,
  resolveProjectAccess,
  verifyProjectOwnerAccess,
} from "./lib/projectAccess";
import { verifyAuth } from "./auth";
import { notifyProjectFollowers } from "./lib/notifyProjectFollowers";
import { maybeRecordPublicCommunityActivity } from "./lib/recordActivity";
import { seedPublicProjectContent } from "./lib/seedPublicProjectContent";
import {
  PROJECT_DOC_SLOTS,
  type ProjectDocSlot,
} from "./lib/projectDocPaths";
import {
  isFileDirtyByHash,
  readFileContent,
} from "./lib/projectFileContents";
import type { Id } from "./_generated/dataModel";
import type { Doc } from "./_generated/dataModel";

function initialsFrom(value: string) {
  return (
    value
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "?"
  );
}

function publicStats(project: {
  starCount?: number;
  followCount?: number;
  viewCount?: number;
  forkCount?: number;
  downloadCount?: number;
}) {
  return {
    stars: project.starCount ?? 0,
    followers: project.followCount ?? 0,
    views: project.viewCount ?? 0,
    forks: project.forkCount ?? 0,
    downloads: project.downloadCount ?? 0,
  };
}

function normalizeDeployUrl(url: string | undefined | null) {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function resolveProjectLivePreview(
  deployments: Array<{
    status: string;
    url?: string;
    provider: "vercel" | "netlify";
    target: "preview" | "production";
    updatedAt: number;
  }>,
  deployTargets: Array<{
    url?: string;
    provider: "vercel" | "netlify";
    name: string;
    updatedAt: number;
  }>,
) {
  const readyDeployments = deployments.filter(
    (deployment) =>
      deployment.status === "ready" && normalizeDeployUrl(deployment.url),
  );
  const liveDeployment =
    readyDeployments.find((deployment) => deployment.target === "production") ??
    readyDeployments[0];

  if (liveDeployment) {
    const url = normalizeDeployUrl(liveDeployment.url);
    if (!url) return null;
    return {
      url,
      provider: liveDeployment.provider,
      label:
        liveDeployment.target === "production" ? "Production" : "Live preview",
      updatedAt: liveDeployment.updatedAt,
      updatedLabel: formatRelativeTime(liveDeployment.updatedAt),
    };
  }

  const liveTarget = deployTargets.find((target) =>
    normalizeDeployUrl(target.url),
  );
  if (!liveTarget) return null;

  const url = normalizeDeployUrl(liveTarget.url);
  if (!url) return null;

  return {
    url,
    provider: liveTarget.provider,
    label: liveTarget.name.trim() || "Live site",
    updatedAt: liveTarget.updatedAt,
    updatedLabel: formatRelativeTime(liveTarget.updatedAt),
  };
}

type RelatedProjectCandidate = {
  candidate: Doc<"projects">;
  matchedTech: string[];
  sameOwner: boolean;
  score: number;
};

async function buildRelatedPublicProjects(
  ctx: Parameters<typeof resolveProjectAccess>[0],
  currentProject: Doc<"projects">,
  limit = 6,
) {
  const currentTech = new Set(
    techForProject(currentProject).map((tag) => tag.toLowerCase()),
  );

  const publicProjects = await ctx.db
    .query("projects")
    .withIndex("by_visibility_updated", (q) => q.eq("visibility", "public"))
    .order("desc")
    .take(80);

  const scored: RelatedProjectCandidate[] = [];
  for (const candidate of publicProjects) {
    if (candidate._id === currentProject._id) continue;

    const tech = techForProject(candidate);
    const matchedTech = tech.filter((tag) =>
      currentTech.has(tag.toLowerCase()),
    );
    const sameOwner = candidate.ownerId === currentProject.ownerId;
    if (!sameOwner && matchedTech.length === 0) continue;

    const score =
      (sameOwner ? 100 : 0) +
      matchedTech.length * 10 +
      (candidate.starCount ?? 0) * 0.01;

    scored.push({ candidate, matchedTech, sameOwner, score });
  }

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      b.candidate.updatedAt - a.candidate.updatedAt,
  );

  const related = [];
  for (const { candidate, matchedTech, sameOwner } of scored.slice(0, limit)) {
    const members = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", candidate._id))
      .collect();
    const ownerMember =
      members.find((member) => member.role === "owner") ??
      members.find((member) => member.userId === candidate.ownerId);
    const ownerName = ownerMember?.name ?? ownerMember?.email ?? "Creator";

    related.push({
      id: candidate._id,
      name: candidate.name,
      description:
        candidate.description ?? `Public workspace · ${candidate.name}`,
      coverTone: coverToneForProject(candidate),
      tech: techForProject(candidate).slice(0, 3),
      stars: candidate.starCount ?? 0,
      lastUpdated: formatRelativeTime(candidate.updatedAt),
      owner: {
        name: ownerName,
        initials: initialsFrom(ownerName),
        color: ownerMember?.color ?? colorForUserId(candidate.ownerId),
      },
      relation:
        sameOwner && matchedTech.length > 0
          ? ("both" as const)
          : sameOwner
            ? ("same-owner" as const)
            : ("same-tech" as const),
      matchedTech: matchedTech.slice(0, 3),
    });
  }

  return related;
}

async function assertProjectDiscoverable(
  ctx: Parameters<typeof resolveProjectAccess>[0],
  projectId: Id<"projects">,
) {
  const access = await resolveProjectAccess(ctx, projectId);
  if (access) return access;

  const project = await ctx.db.get("projects", projectId);
  if (!project) throw new Error("Project not found");
  if (project.visibility !== "public") {
    throw new Error("This project is not public");
  }
  return null;
}

const COMMUNITY_ACTIVITY_TYPES = new Set([
  "released",
  "sponsored",
  "joined",
  "contributor",
]);

export const listCommunityProjectActivity = query({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertProjectDiscoverable(ctx, args.projectId);
    const limit = Math.min(Math.max(args.limit ?? 20, 1), 50);
    const rows = await ctx.db
      .query("projectActivity")
      .withIndex("by_project_created", (q) =>
        q.eq("projectId", args.projectId),
      )
      .order("desc")
      .take(limit * 4);

    return rows
      .filter((row) => COMMUNITY_ACTIVITY_TYPES.has(row.type))
      .slice(0, limit)
      .map((row) => ({
        id: row._id,
        type: row.type as "released" | "sponsored" | "joined" | "contributor",
        title: row.title,
        detail: row.detail,
        time: formatRelativeTime(row.createdAt),
        createdAt: row.createdAt,
        avatar: {
          initials: initialsFrom(row.actorName ?? "Someone"),
          color: row.actorColor ?? colorForUserId(row.actorUserId),
          name: row.actorName ?? "Someone",
        },
      }));
  },
});

export const getPublicProjectMetadata = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get("projects", args.projectId);
    if (!project || project.visibility !== "public") return null;

    return {
      name: project.name,
      description:
        project.description ?? `Public workspace · ${project.name}`,
      tech: techForProject(project),
      updatedAt: project.updatedAt,
    };
  },
});

export const getProjectDetails = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const userId = identity.subject;
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) return null;

    const access = await resolveProjectAccess(ctx, args.projectId);
    const isPublic = project.visibility === "public";
    if (!access && !isPublic) return null;

    const members = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const ownerMember =
      members.find((member) => member.role === "owner") ??
      members.find((member) => member.userId === project.ownerId);
    const ownerName = ownerMember?.name ?? ownerMember?.email ?? "Creator";

    const contributorCards = members.map((member) => ({
      id: member._id,
      userId: member.userId,
      name: member.name ?? member.email ?? "Member",
      initials: initialsFrom(member.name ?? member.email ?? "M"),
      color: member.color,
      imageUrl: member.imageUrl,
      role: member.role,
    }));

    const star = await ctx.db
      .query("projectStars")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", userId),
      )
      .unique();

    const follow = await ctx.db
      .query("projectFollows")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", userId),
      )
      .unique();

    const myRequests = await ctx.db
      .query("projectAccessRequests")
      .withIndex("by_requester", (q) => q.eq("requesterUserId", userId))
      .collect();
    const accessRequest = myRequests
      .filter((row) => row.projectId === args.projectId)
      .sort((a, b) => b.createdAt - a.createdAt)[0];

    const todos = await ctx.db
      .query("projectPublicTodos")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const features = await ctx.db
      .query("projectFeatureIdeas")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const myFeatureUpvotes = await ctx.db
      .query("projectFeatureUpvotes")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", userId),
      )
      .collect();
    const upvotedFeatureIds = new Set(
      myFeatureUpvotes.map((row) => row.featureId),
    );

    const sponsors = await ctx.db
      .query("projectSponsors")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const sponsorIds = new Set(sponsors.map((sponsor) => sponsor.userId));
    for (const feature of features) {
      if (feature.sponsorUserId) {
        sponsorIds.add(feature.sponsorUserId);
      }
    }

    const stats = publicStats(project);
    const memberCount = members.length;
    const isOwner = project.ownerId === userId;
    const isMember = Boolean(access) && access?.role !== undefined;

    const demoVideoUrl = project.demoVideoStorageId
      ? await ctx.storage.getUrl(project.demoVideoStorageId)
      : null;

    const deployments = await ctx.db
      .query("deployments")
      .withIndex("by_project_created", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(20);

    const deployTargets = await ctx.db
      .query("projectDeployTargets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const preview = resolveProjectLivePreview(deployments, deployTargets);

    const relatedProjects =
      project.visibility === "public"
        ? await buildRelatedPublicProjects(ctx, project)
        : [];

    return {
      id: project._id,
      name: project.name,
      description:
        project.description ?? `Public workspace · ${project.name}`,
      coverTone: coverToneForProject(project),
      tech: techForProject(project),
      status: project.status ?? "in-progress",
      visibility: project.visibility ?? "private",
      communityFeatured: Boolean(project.communityFeaturedAt),
      source: project.source,
      templateId: project.templateId,
      githubRepoUrl:
        project.source === "github" ? project.githubRepoUrl : undefined,
      githubBranch: project.githubBranch?.trim() || "main",
      progress: project.progress ?? 45,
      updatedAt: project.updatedAt,
      lastUpdated: formatRelativeTime(project.updatedAt),
      owner: {
        name: ownerName,
        initials: initialsFrom(ownerName),
        color: ownerMember?.color ?? colorForUserId(project.ownerId),
        imageUrl: ownerMember?.imageUrl,
      },
      contributors: contributorCards,
      contributorCount: memberCount,
      stats: {
        ...stats,
        forks: Math.max(stats.forks, Math.max(0, memberCount - 1)),
        sponsors: sponsorIds.size,
      },
      viewer: {
        hasStarred: Boolean(star),
        isFollowing: Boolean(follow),
        isOwner,
        isMember,
        canEdit: access?.canEdit ?? false,
        canManage: access?.canManage ?? false,
        accessRequestStatus: isMember
          ? undefined
          : accessRequest?.status,
      },
      todos: todos
        .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt - b.createdAt)
        .map((todo) => ({
          id: todo._id,
          title: todo.title,
          status: todo.status,
        })),
      features: features
        .sort(
          (a, b) =>
            (b.upvotes ?? 0) - (a.upvotes ?? 0) ||
            b.createdAt - a.createdAt,
        )
        .map((feature) => ({
          id: feature._id,
          title: feature.title,
          description: feature.description,
          status: feature.status,
          sponsorName: feature.sponsorName,
          sponsorMessage: feature.sponsorMessage,
          sponsorAmount: feature.sponsorAmount,
          upvotes: feature.upvotes ?? 0,
          viewerHasUpvoted: upvotedFeatureIds.has(feature._id),
          createdAt: feature.createdAt,
        })),
      demo: demoVideoUrl
        ? {
            url: demoVideoUrl,
            filename: project.demoVideoFilename ?? "demo.mp4",
            mediaType: project.demoVideoMediaType ?? "video/mp4",
          }
        : null,
      preview,
      relatedProjects,
    };
  },
});

export const generateDemoUploadUrl = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    await verifyProjectOwnerAccess(ctx, args.projectId);
    return await ctx.storage.generateUploadUrl();
  },
});

export const setProjectDemoVideo = mutation({
  args: {
    projectId: v.id("projects"),
    storageId: v.id("_storage"),
    filename: v.string(),
    mediaType: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyProjectOwnerAccess(ctx, args.projectId);
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) throw new Error("Project not found");

    const mediaType = args.mediaType.trim();
    if (!mediaType.startsWith("video/")) {
      throw new Error("Demo must be a video file");
    }

    const filename = args.filename.trim();
    if (!filename) {
      throw new Error("Filename is required");
    }

    const previousStorageId = project.demoVideoStorageId;

    await ctx.db.patch(args.projectId, {
      demoVideoStorageId: args.storageId,
      demoVideoFilename: filename,
      demoVideoMediaType: mediaType,
      updatedAt: project.updatedAt,
    });

    if (previousStorageId && previousStorageId !== args.storageId) {
      await ctx.storage.delete(previousStorageId);
    }
  },
});

export const removeProjectDemoVideo = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    await verifyProjectOwnerAccess(ctx, args.projectId);
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) throw new Error("Project not found");
    if (!project.demoVideoStorageId) return;

    await ctx.storage.delete(project.demoVideoStorageId);
    await ctx.db.patch(args.projectId, {
      demoVideoStorageId: undefined,
      demoVideoFilename: undefined,
      demoVideoMediaType: undefined,
      updatedAt: project.updatedAt,
    });
  },
});

export const recordProjectView = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    await assertProjectDiscoverable(ctx, args.projectId);
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) return { recorded: false, views: 0 };

    const existing = await ctx.db
      .query("projectViews")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", identity.subject),
      )
      .unique();

    const currentViews = project.viewCount ?? 0;
    if (existing) {
      return { recorded: false, views: currentViews };
    }

    await ctx.db.insert("projectViews", {
      projectId: args.projectId,
      userId: identity.subject,
      createdAt: Date.now(),
    });
    const nextViews = currentViews + 1;
    await ctx.db.patch(args.projectId, {
      viewCount: nextViews,
      updatedAt: project.updatedAt,
    });
    return { recorded: true, views: nextViews };
  },
});

export const toggleProjectStar = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    await assertProjectDiscoverable(ctx, args.projectId);
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) throw new Error("Project not found");

    const existing = await ctx.db
      .query("projectStars")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", identity.subject),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      const next = Math.max(0, (project.starCount ?? 0) - 1);
      await ctx.db.patch(args.projectId, { starCount: next });
      return { starred: false, stars: next };
    }

    await ctx.db.insert("projectStars", {
      projectId: args.projectId,
      userId: identity.subject,
      createdAt: Date.now(),
    });
    const next = (project.starCount ?? 0) + 1;
    await ctx.db.patch(args.projectId, { starCount: next });
    return { starred: true, stars: next };
  },
});

export const toggleProjectFollow = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    await assertProjectDiscoverable(ctx, args.projectId);
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) throw new Error("Project not found");
    if (project.ownerId === identity.subject) {
      throw new Error("You cannot follow your own project");
    }

    const existing = await ctx.db
      .query("projectFollows")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", identity.subject),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      const next = Math.max(0, (project.followCount ?? 0) - 1);
      await ctx.db.patch(args.projectId, { followCount: next });
      return { following: false, followers: next };
    }

    await ctx.db.insert("projectFollows", {
      projectId: args.projectId,
      userId: identity.subject,
      createdAt: Date.now(),
    });
    const next = (project.followCount ?? 0) + 1;
    await ctx.db.patch(args.projectId, { followCount: next });
    return { following: true, followers: next };
  },
});

export const recordProjectDownload = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    await verifyAuth(ctx);
    await assertProjectDiscoverable(ctx, args.projectId);
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) return;
    await ctx.db.patch(args.projectId, {
      downloadCount: (project.downloadCount ?? 0) + 1,
      updatedAt: project.updatedAt,
    });
  },
});

export const upsertPublicTodo = mutation({
  args: {
    projectId: v.id("projects"),
    todoId: v.optional(v.id("projectPublicTodos")),
    title: v.string(),
    status: v.union(
      v.literal("todo"),
      v.literal("in-progress"),
      v.literal("done"),
    ),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, project } = await verifyProjectOwnerAccess(
      ctx,
      args.projectId,
    );
    const title = args.title.trim();
    if (!title) throw new Error("Title is required");

    let todoId: typeof args.todoId;
    let isNew = false;
    let previousStatus: "todo" | "in-progress" | "done" | undefined;

    if (args.todoId) {
      const existing = await ctx.db.get("projectPublicTodos", args.todoId);
      if (!existing || existing.projectId !== args.projectId) {
        throw new Error("Todo not found");
      }
      previousStatus = existing.status;
      await ctx.db.patch(args.todoId, {
        title,
        status: args.status,
        sortOrder: args.sortOrder ?? existing.sortOrder,
        updatedAt: Date.now(),
      });
      todoId = args.todoId;
    } else {
      isNew = true;
      const siblings = await ctx.db
        .query("projectPublicTodos")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect();

      todoId = await ctx.db.insert("projectPublicTodos", {
        projectId: args.projectId,
        title,
        status: args.status,
        sortOrder: args.sortOrder ?? siblings.length,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    if (project.visibility === "public") {
      await notifyProjectFollowers(ctx, {
        projectId: args.projectId,
        excludeUserId: userId,
        title: isNew
          ? `${project.name} added a roadmap item`
          : `${project.name} updated its roadmap`,
        body: isNew ? `New item: ${title}` : `Updated: ${title}`,
        href: `/projects/community/${args.projectId}`,
        tone: "violet",
      });

      const shippedNow =
        args.status === "done" &&
        (isNew || previousStatus !== "done");
      if (shippedNow) {
        const ownerMember = await ctx.db
          .query("projectMembers")
          .withIndex("by_project_user", (q) =>
            q.eq("projectId", args.projectId).eq("userId", userId),
          )
          .unique();
        await maybeRecordPublicCommunityActivity(ctx, {
          projectId: args.projectId,
          actorUserId: userId,
          actorName: ownerMember?.name ?? ownerMember?.email,
          type: "released",
          title: `Shipped: ${title}`,
          detail: project.name,
        });
      }
    }

    return todoId;
  },
});

export const deletePublicTodo = mutation({
  args: {
    projectId: v.id("projects"),
    todoId: v.id("projectPublicTodos"),
  },
  handler: async (ctx, args) => {
    await verifyProjectOwnerAccess(ctx, args.projectId);
    const todo = await ctx.db.get("projectPublicTodos", args.todoId);
    if (!todo || todo.projectId !== args.projectId) {
      throw new Error("Todo not found");
    }
    await ctx.db.delete(args.todoId);
  },
});

export const proposeFeature = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    description: v.optional(v.string()),
    sponsorMessage: v.optional(v.string()),
    sponsorAmount: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    await assertProjectDiscoverable(ctx, args.projectId);
    const title = args.title.trim();
    if (!title) throw new Error("Feature title is required");

    const project = await ctx.db.get("projects", args.projectId);
    if (!project) throw new Error("Project not found");

    const sponsorName = identityDisplayName(identity);
    const sponsorMessage = args.sponsorMessage?.trim() || undefined;
    const sponsorAmount = args.sponsorAmount?.trim() || undefined;

    const existingSponsor = await ctx.db
      .query("projectSponsors")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", identity.subject),
      )
      .unique();

    if (!existingSponsor) {
      await ctx.db.insert("projectSponsors", {
        projectId: args.projectId,
        userId: identity.subject,
        sponsorName,
        sponsorMessage,
        sponsorAmount,
        createdAt: Date.now(),
      });
    }

    const featureId = await ctx.db.insert("projectFeatureIdeas", {
      projectId: args.projectId,
      title,
      description: args.description?.trim() || undefined,
      status: "open",
      sponsorUserId: identity.subject,
      sponsorName,
      sponsorMessage,
      sponsorAmount,
      upvotes: 1,
      createdAt: Date.now(),
    });

    await ctx.db.insert("projectFeatureUpvotes", {
      projectId: args.projectId,
      featureId,
      userId: identity.subject,
      createdAt: Date.now(),
    });

    if (project.visibility === "public") {
      await maybeRecordPublicCommunityActivity(ctx, {
        projectId: args.projectId,
        actorUserId: identity.subject,
        actorName: sponsorName,
        type: "sponsored",
        title: existingSponsor
          ? `${sponsorName} proposed a feature`
          : `${sponsorName} became a sponsor`,
        detail: sponsorAmount ? `${title} · ${sponsorAmount}` : title,
      });
    }

    return featureId;
  },
});

export const toggleFeatureUpvote = mutation({
  args: {
    projectId: v.id("projects"),
    featureId: v.id("projectFeatureIdeas"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    await assertProjectDiscoverable(ctx, args.projectId);

    const feature = await ctx.db.get("projectFeatureIdeas", args.featureId);
    if (!feature || feature.projectId !== args.projectId) {
      throw new Error("Feature not found");
    }

    const existing = await ctx.db
      .query("projectFeatureUpvotes")
      .withIndex("by_feature_user", (q) =>
        q.eq("featureId", args.featureId).eq("userId", identity.subject),
      )
      .unique();

    const currentUpvotes = feature.upvotes ?? 0;

    if (existing) {
      await ctx.db.delete(existing._id);
      const nextUpvotes = Math.max(0, currentUpvotes - 1);
      await ctx.db.patch(args.featureId, { upvotes: nextUpvotes });
      return { upvoted: false, upvotes: nextUpvotes };
    }

    await ctx.db.insert("projectFeatureUpvotes", {
      projectId: args.projectId,
      featureId: args.featureId,
      userId: identity.subject,
      createdAt: Date.now(),
    });
    const nextUpvotes = currentUpvotes + 1;
    await ctx.db.patch(args.featureId, { upvotes: nextUpvotes });
    return { upvoted: true, upvotes: nextUpvotes };
  },
});

export const setCommunityFeatured = mutation({
  args: {
    projectId: v.id("projects"),
    featured: v.boolean(),
  },
  handler: async (ctx, args) => {
    await verifyProjectOwnerAccess(ctx, args.projectId);
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) throw new Error("Project not found");
    if (project.visibility !== "public") {
      throw new Error("Only public projects can be featured on the community hub");
    }

    await ctx.db.patch(args.projectId, {
      communityFeaturedAt: args.featured ? Date.now() : undefined,
      updatedAt: project.updatedAt,
    });

    return { featured: args.featured };
  },
});

export const updateFeatureStatus = mutation({
  args: {
    projectId: v.id("projects"),
    featureId: v.id("projectFeatureIdeas"),
    status: v.union(
      v.literal("open"),
      v.literal("planned"),
      v.literal("funded"),
      v.literal("shipped"),
    ),
  },
  handler: async (ctx, args) => {
    const { userId, project } = await verifyProjectOwnerAccess(
      ctx,
      args.projectId,
    );
    const feature = await ctx.db.get("projectFeatureIdeas", args.featureId);
    if (!feature || feature.projectId !== args.projectId) {
      throw new Error("Feature not found");
    }
    const wasShipped = feature.status === "shipped";
    await ctx.db.patch(args.featureId, { status: args.status });

    if (
      project.visibility === "public" &&
      !wasShipped &&
      args.status === "shipped"
    ) {
      const ownerMember = await ctx.db
        .query("projectMembers")
        .withIndex("by_project_user", (q) =>
          q.eq("projectId", args.projectId).eq("userId", userId),
        )
        .unique();
      await maybeRecordPublicCommunityActivity(ctx, {
        projectId: args.projectId,
        actorUserId: userId,
        actorName: ownerMember?.name ?? ownerMember?.email,
        type: "released",
        title: `Feature shipped: ${feature.title}`,
        detail: feature.sponsorName
          ? `Sponsored by ${feature.sponsorName}`
          : project.name,
      });
    }
  },
});

export const seedDefaultPublicContent = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    await verifyProjectOwnerAccess(ctx, args.projectId);
    await seedPublicProjectContent(ctx, args.projectId);
  },
});

export const getProjectDocs = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    await assertProjectDiscoverable(ctx, args.projectId);
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) return null;

    const access = await resolveProjectAccess(ctx, args.projectId);

    const docs = [];
    for (const slotDef of PROJECT_DOC_SLOTS) {
      let matchedPath: string | null = null;
      let content = "";
      let exists = false;
      let isDirty = false;
      let isStaged = false;

      for (const candidate of slotDef.paths) {
        const file = await ctx.db
          .query("projectFiles")
          .withIndex("by_project_path", (q) =>
            q.eq("projectId", args.projectId).eq("path", candidate),
          )
          .unique();
        if (!file || file.kind !== "file") continue;

        const body = await readFileContent(ctx, args.projectId, file.path, file);
        matchedPath = file.path;
        content = body.content;
        exists = content.length > 0 || Boolean(body.syncedContent);
        isDirty = isFileDirtyByHash(file.contentHash, file.syncedContentHash);
        isStaged = file.staged === true;
        break;
      }

      docs.push({
        slot: slotDef.slot as ProjectDocSlot,
        label: slotDef.label,
        path: matchedPath,
        defaultPath: slotDef.defaultPath,
        content,
        exists,
        isDirty,
        isStaged,
        isMarkdown: slotDef.isMarkdown,
        defaultContent: slotDef.defaultContent,
      });
    }

    return {
      source: project.source,
      githubRepoUrl:
        project.source === "github" ? project.githubRepoUrl : undefined,
      githubBranch: project.githubBranch?.trim() || "main",
      canEdit: access?.canEdit ?? false,
      canManage: access?.canManage ?? false,
      docs,
    };
  },
});
