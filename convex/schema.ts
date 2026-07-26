import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const projectStatus = v.union(
  v.literal("in-progress"),
  v.literal("review"),
  v.literal("shipped"),
  v.literal("archived"),
);

const collectionIcon = v.union(
  v.literal("pin"),
  v.literal("sparkles"),
  v.literal("user"),
  v.literal("briefcase"),
  v.literal("archive"),
);

const activityType = v.union(
  v.literal("updated"),
  v.literal("contributor"),
  v.literal("merged"),
  v.literal("comment"),
  v.literal("released"),
  v.literal("joined"),
);

const deadlineTone = v.union(
  v.literal("orange"),
  v.literal("blue"),
  v.literal("violet"),
  v.literal("green"),
);

const notificationTone = v.union(
  v.literal("violet"),
  v.literal("green"),
  v.literal("blue"),
  v.literal("orange"),
);

export default defineSchema({
  projects: defineTable({
    name: v.string(),
    ownerId: v.string(),
    updatedAt: v.number(),
    description: v.optional(v.string()),
    visibility: v.optional(
      v.union(v.literal("private"), v.literal("public")),
    ),
    status: v.optional(projectStatus),
    tech: v.optional(v.array(v.string())),
    coverTone: v.optional(v.string()),
    lastOpenedAt: v.optional(v.number()),
    progress: v.optional(v.number()),
    importStatus: v.optional(
      v.union(
        v.literal("importing"),
        v.literal("completed"),
        v.literal("failed"),
      ),
    ),
    importStartedAt: v.optional(v.number()),
    importJobToken: v.optional(v.string()),
    exportStatus: v.optional(
      v.union(
        v.literal("exporting"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("cancelled"),
      ),
    ),
    exportRepoUrl: v.optional(v.string()),
    githubRepoUrl: v.optional(v.string()),
    githubBranch: v.optional(v.string()),
    lastCommitSha: v.optional(v.string()),
    syncedAt: v.optional(v.number()),
    source: v.optional(
      v.union(v.literal("blank"), v.literal("github"), v.literal("template")),
    ),
    templateId: v.optional(
      v.union(
        v.literal("empty"),
        v.literal("simple"),
        v.literal("static"),
        v.literal("vite"),
        v.literal("node"),
        v.literal("react"),
        v.literal("nextjs"),
        v.literal("tanstack"),
      ),
    ),
  })
    .index("by_owner", ["ownerId"])
    .index("by_owner_updated", ["ownerId", "updatedAt"])
    .index("by_visibility_updated", ["visibility", "updatedAt"]),

  githubConnections: defineTable({
    userId: v.string(),
    githubUserId: v.string(),
    username: v.string(),
    avatarUrl: v.optional(v.string()),
    connectedAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  /** Vercel / Netlify account links. Tokens are never returned to clients. */
  deployConnections: defineTable({
    userId: v.string(),
    provider: v.union(v.literal("vercel"), v.literal("netlify")),
    accessToken: v.string(),
    accountId: v.optional(v.string()),
    accountName: v.optional(v.string()),
    accountSlug: v.optional(v.string()),
    teamId: v.optional(v.string()),
    connectedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_provider", ["userId", "provider"]),

  /** Linked Vercel project / Netlify site per NovaStudio project. */
  projectDeployTargets: defineTable({
    projectId: v.id("projects"),
    provider: v.union(v.literal("vercel"), v.literal("netlify")),
    externalId: v.string(),
    name: v.string(),
    url: v.optional(v.string()),
    teamId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_provider", ["projectId", "provider"]),

  deployments: defineTable({
    projectId: v.id("projects"),
    provider: v.union(v.literal("vercel"), v.literal("netlify")),
    externalId: v.string(),
    status: v.string(),
    url: v.optional(v.string()),
    inspectorUrl: v.optional(v.string()),
    target: v.union(v.literal("preview"), v.literal("production")),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_project_created", ["projectId", "createdAt"]),

  projectFiles: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    parentId: v.optional(v.id("projectFiles")),
    kind: v.union(v.literal("file"), v.literal("folder")),
    content: v.optional(v.string()),
    syncedContent: v.optional(v.string()),
    staged: v.optional(v.boolean()),
    path: v.string(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_parent", ["projectId", "parentId"])
    .index("by_project_path", ["projectId", "path"]),

  userPreferences: defineTable({
    userId: v.string(),
    sidebarOpen: v.boolean(),
    terminalOpen: v.boolean(),
    aiPanelOpen: v.optional(v.boolean()),
    panelSizes: v.object({
      sidebar: v.number(),
      terminal: v.number(),
      ai: v.optional(v.number()),
    }),
    editor: v.optional(
      v.object({
        fontSize: v.number(),
        tabSize: v.number(),
        wordWrap: v.boolean(),
        lineNumbers: v.boolean(),
        highlightActiveLine: v.boolean(),
        bracketMatching: v.boolean(),
        lineHeight: v.number(),
      }),
    ),
    settingsJson: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  projectMembers: defineTable({
    projectId: v.id("projects"),
    userId: v.string(),
    role: v.union(
      v.literal("owner"),
      v.literal("editor"),
      v.literal("viewer"),
    ),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    color: v.string(),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_user", ["userId"])
    .index("by_project_user", ["projectId", "userId"]),

  projectInvites: defineTable({
    projectId: v.id("projects"),
    email: v.string(),
    role: v.union(v.literal("editor"), v.literal("viewer")),
    invitedBy: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("revoked"),
    ),
    token: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_email_status", ["email", "status"])
    .index("by_project_email", ["projectId", "email"])
    .index("by_token", ["token"]),

  collabDocuments: defineTable({
    projectId: v.id("projects"),
    path: v.string(),
    state: v.bytes(),
    updatedAt: v.number(),
  }).index("by_project_path", ["projectId", "path"]),

  collabCursors: defineTable({
    projectId: v.id("projects"),
    path: v.string(),
    userId: v.string(),
    sessionId: v.string(),
    name: v.string(),
    color: v.string(),
    anchor: v.number(),
    head: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project_path", ["projectId", "path"])
    .index("by_session", ["sessionId"]),

  projectPins: defineTable({
    userId: v.string(),
    projectId: v.id("projects"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_project", ["userId", "projectId"])
    .index("by_project", ["projectId"]),

  collections: defineTable({
    userId: v.string(),
    name: v.string(),
    color: v.string(),
    icon: collectionIcon,
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  collectionProjects: defineTable({
    collectionId: v.id("collections"),
    projectId: v.id("projects"),
    addedAt: v.number(),
  })
    .index("by_collection", ["collectionId"])
    .index("by_collection_project", ["collectionId", "projectId"])
    .index("by_project", ["projectId"]),

  projectActivity: defineTable({
    projectId: v.id("projects"),
    actorUserId: v.string(),
    actorName: v.optional(v.string()),
    actorColor: v.optional(v.string()),
    type: activityType,
    title: v.string(),
    detail: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_project_created", ["projectId", "createdAt"]),

  projectDeadlines: defineTable({
    projectId: v.id("projects"),
    title: v.string(),
    dueAt: v.number(),
    tone: v.optional(deadlineTone),
    createdBy: v.string(),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_dueAt", ["dueAt"]),

  projectAccessRequests: defineTable({
    projectId: v.id("projects"),
    requesterUserId: v.string(),
    requesterName: v.optional(v.string()),
    requesterEmail: v.optional(v.string()),
    roleLabel: v.optional(v.string()),
    experienceLevel: v.optional(v.string()),
    message: v.optional(v.string()),
    portfolioUrl: v.optional(v.string()),
    github: v.optional(v.string()),
    linkedin: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("denied"),
    ),
    createdAt: v.number(),
  })
    .index("by_project_status", ["projectId", "status"])
    .index("by_requester", ["requesterUserId"]),

  notifications: defineTable({
    userId: v.string(),
    title: v.string(),
    tone: v.optional(notificationTone),
    href: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    soundKind: v.optional(
      v.union(
        v.literal("notify"),
        v.literal("success"),
        v.literal("warning"),
        v.literal("error"),
        v.literal("message"),
        v.literal("aiDone"),
      ),
    ),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_user_created", ["userId", "createdAt"]),

  pushSubscriptions: defineTable({
    userId: v.string(),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_endpoint", ["endpoint"]),

  userStorageQuotas: defineTable({
    userId: v.string(),
    limitBytes: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  userExtensions: defineTable({
    userId: v.string(),
    extensionId: v.string(),
    version: v.string(),
    enabled: v.boolean(),
    installedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_extension", ["userId", "extensionId"]),
});

