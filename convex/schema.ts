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
  v.literal("sponsored"),
);

const sponsorTier = v.union(
  v.literal("supporter"),
  v.literal("backer"),
  v.literal("feature"),
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
    /** Clerk organization id when this project belongs to a team tenant. Absent = personal. */
    orgId: v.optional(v.string()),
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
    /** Progress while cloning / pulling from GitHub. */
    importTotalFiles: v.optional(v.number()),
    importDoneFiles: v.optional(v.number()),
    /** True when file bodies live in projectFileContents (not inline on projectFiles). */
    fileContentSplit: v.optional(v.boolean()),
    /** Non-interactive CLI to run once WebContainer boots (e.g. create-next-app). */
    pendingScaffoldCommand: v.optional(v.string()),
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
    starCount: v.optional(v.number()),
    followCount: v.optional(v.number()),
    viewCount: v.optional(v.number()),
    forkCount: v.optional(v.number()),
    downloadCount: v.optional(v.number()),
    demoVideoStorageId: v.optional(v.id("_storage")),
    demoVideoFilename: v.optional(v.string()),
    demoVideoMediaType: v.optional(v.string()),
    /** When set, project is pinned in the community hub featured row. */
    communityFeaturedAt: v.optional(v.number()),
  })
    .index("by_owner", ["ownerId"])
    .index("by_owner_updated", ["ownerId", "updatedAt"])
    .index("by_visibility_updated", ["visibility", "updatedAt"])
    .index("by_community_featured", ["communityFeaturedAt"])
    .index("by_org", ["orgId"])
    .index("by_org_updated", ["orgId", "updatedAt"]),

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

  /** Slack / Discord incoming webhooks. URLs are never returned to clients. */
  integrationConnections: defineTable({
    userId: v.string(),
    provider: v.union(v.literal("slack"), v.literal("discord")),
    webhookUrl: v.string(),
    channelLabel: v.optional(v.string()),
    notifyOnDeploy: v.optional(v.boolean()),
    connectedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_provider", ["userId", "provider"]),

  /** Linear API key per user. Keys are never returned to clients. */
  linearConnections: defineTable({
    userId: v.string(),
    apiKey: v.string(),
    organizationName: v.optional(v.string()),
    viewerName: v.optional(v.string()),
    connectedAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  /**
   * Google Calendar link metadata. Access tokens come from Clerk
   * (`oauth_google`) at call time — never stored here.
   */
  googleCalendarConnections: defineTable({
    userId: v.string(),
    googleUserId: v.string(),
    email: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    connectedAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  /** Linked Linear issue per NovaStudio project. */
  projectLinearLinks: defineTable({
    projectId: v.id("projects"),
    issueId: v.string(),
    issueIdentifier: v.string(),
    issueTitle: v.string(),
    issueUrl: v.string(),
    linkedBy: v.string(),
    linkedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_issue", ["issueId"]),

  /** Notion internal integration per user. Token never returned to clients. */
  notionConnections: defineTable({
    userId: v.string(),
    apiKey: v.string(),
    parentPageId: v.string(),
    parentPageTitle: v.optional(v.string()),
    workspaceName: v.optional(v.string()),
    viewerName: v.optional(v.string()),
    connectedAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

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
    errorMessage: v.optional(v.string()),
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
    /** @deprecated — content lives in projectFileContents. */
    content: v.optional(v.string()),
    /** @deprecated — synced baseline lives in projectFileContents. */
    syncedContent: v.optional(v.string()),
    contentHash: v.optional(v.string()),
    syncedContentHash: v.optional(v.string()),
    staged: v.optional(v.boolean()),
    path: v.string(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_parent", ["projectId", "parentId"])
    .index("by_project_path", ["projectId", "path"]),

  /** File bodies stored separately so tree listings stay under Convex read limits. */
  projectFileContents: defineTable({
    projectId: v.id("projects"),
    path: v.string(),
    content: v.string(),
    syncedContent: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_project_path", ["projectId", "path"]),

  /** Per-line search index (updated on file write; backfilled after import). */
  projectFileSearchLines: defineTable({
    projectId: v.id("projects"),
    path: v.string(),
    line: v.number(),
    lineText: v.string(),
    updatedAt: v.number(),
  })
    .index("by_project_path", ["projectId", "path"])
    .searchIndex("search_line_text", {
      searchField: "lineText",
      filterFields: ["projectId"],
    }),

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
        formatOnSave: v.optional(v.boolean()),
        autoSave: v.optional(v.boolean()),
        formatOnSaveAll: v.optional(v.boolean()),
        liveCollaboration: v.optional(v.boolean()),
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

  /** Workspace Live Share focus — open file / preview path / terminal cwd. */
  workspaceFocus: defineTable({
    projectId: v.id("projects"),
    userId: v.string(),
    openFile: v.union(v.string(), v.null()),
    view: v.union(
      v.literal("code"),
      v.literal("preview"),
      v.literal("other"),
    ),
    previewPath: v.union(v.string(), v.null()),
    terminalCwd: v.union(v.string(), v.null()),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_user", ["projectId", "userId"]),

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
    /** True when a before/after content snapshot exists for timeline diffs. */
    hasSnapshot: v.optional(v.boolean()),
  }).index("by_project_created", ["projectId", "createdAt"]),

  /** Content snapshots for activity timeline diffs (VS Code local-history style). */
  projectActivitySnapshots: defineTable({
    activityId: v.id("projectActivity"),
    projectId: v.id("projects"),
    path: v.string(),
    beforeContent: v.string(),
    afterContent: v.string(),
  }).index("by_activity", ["activityId"]),

  /** Temporary snapshots of local file changes (stash/apply workflow). */
  projectStashes: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    createdBy: v.string(),
    createdAt: v.number(),
    fileCount: v.number(),
    files: v.array(
      v.object({
        path: v.string(),
        content: v.string(),
        syncedContent: v.optional(v.string()),
        staged: v.boolean(),
      }),
    ),
  }).index("by_project_created", ["projectId", "createdAt"]),

  /** Unresolved 3-way merge conflicts after a merge pull. */
  projectMergeConflicts: defineTable({
    projectId: v.id("projects"),
    path: v.string(),
    base: v.string(),
    local: v.string(),
    remote: v.string(),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_path", ["projectId", "path"]),

  /** Project-level team chat messages (live via Convex subscriptions). */
  projectChatMessages: defineTable({
    projectId: v.id("projects"),
    authorUserId: v.string(),
    authorName: v.optional(v.string()),
    authorImageUrl: v.optional(v.string()),
    authorColor: v.optional(v.string()),
    body: v.string(),
    /** Optional file context when chatting about a specific file. */
    filePath: v.optional(v.string()),
    /** File paths mentioned with @ in the message body. */
    mentionedPaths: v.optional(v.array(v.string())),
    /** Uploaded files / voice notes shared in chat. */
    attachments: v.optional(
      v.array(
        v.object({
          storageId: v.id("_storage"),
          filename: v.string(),
          mediaType: v.string(),
          kind: v.union(v.literal("file"), v.literal("voice")),
        }),
      ),
    ),
    createdAt: v.number(),
  }).index("by_project_created", ["projectId", "createdAt"]),

  /** Figma-style line comment threads on project files. */
  projectCommentThreads: defineTable({
    projectId: v.id("projects"),
    filePath: v.string(),
    /** 1-based line number in the file. */
    line: v.number(),
    body: v.string(),
    resolved: v.boolean(),
    authorUserId: v.string(),
    authorName: v.optional(v.string()),
    authorImageUrl: v.optional(v.string()),
    authorColor: v.optional(v.string()),
    /** Project members mentioned with @ in the body. */
    mentionedUserIds: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project_updated", ["projectId", "updatedAt"])
    .index("by_project_file", ["projectId", "filePath"]),

  projectCommentReplies: defineTable({
    threadId: v.id("projectCommentThreads"),
    projectId: v.id("projects"),
    body: v.string(),
    authorUserId: v.string(),
    authorName: v.optional(v.string()),
    authorImageUrl: v.optional(v.string()),
    authorColor: v.optional(v.string()),
    mentionedUserIds: v.optional(v.array(v.string())),
    createdAt: v.number(),
  }).index("by_thread_created", ["threadId", "createdAt"]),

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

  projectStars: defineTable({
    projectId: v.id("projects"),
    userId: v.string(),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_user", ["projectId", "userId"])
    .index("by_user", ["userId"]),

  projectFollows: defineTable({
    projectId: v.id("projects"),
    userId: v.string(),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_user", ["projectId", "userId"])
    .index("by_user", ["userId"]),

  projectCommunityDiscussions: defineTable({
    projectId: v.id("projects"),
    parentId: v.optional(v.id("projectCommunityDiscussions")),
    authorUserId: v.string(),
    authorName: v.optional(v.string()),
    authorImageUrl: v.optional(v.string()),
    authorColor: v.optional(v.string()),
    body: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_parent", ["parentId"]),

  projectViews: defineTable({
    projectId: v.id("projects"),
    userId: v.string(),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_user", ["projectId", "userId"])
    .index("by_user", ["userId"]),

  projectPublicTodos: defineTable({
    projectId: v.id("projects"),
    title: v.string(),
    status: v.union(
      v.literal("todo"),
      v.literal("in-progress"),
      v.literal("done"),
    ),
    bountyAmount: v.optional(v.string()),
    sortOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_project", ["projectId"]),

  projectFeatureIdeas: defineTable({
    projectId: v.id("projects"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("open"),
      v.literal("planned"),
      v.literal("funded"),
      v.literal("shipped"),
    ),
    sponsorUserId: v.optional(v.string()),
    sponsorName: v.optional(v.string()),
    sponsorMessage: v.optional(v.string()),
    sponsorAmount: v.optional(v.string()),
    upvotes: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_project", ["projectId"]),

  projectFeatureUpvotes: defineTable({
    projectId: v.id("projects"),
    featureId: v.id("projectFeatureIdeas"),
    userId: v.string(),
    createdAt: v.number(),
  })
    .index("by_feature", ["featureId"])
    .index("by_feature_user", ["featureId", "userId"])
    .index("by_project_user", ["projectId", "userId"]),

  projectSponsors: defineTable({
    projectId: v.id("projects"),
    userId: v.string(),
    sponsorName: v.optional(v.string()),
    sponsorMessage: v.optional(v.string()),
    sponsorAmount: v.optional(v.string()),
    sponsorTier: v.optional(sponsorTier),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_user", ["projectId", "userId"]),

  notifications: defineTable({
    userId: v.string(),
    title: v.string(),
    tone: v.optional(notificationTone),
    href: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    /** Used to badge chat / comments / deploy icons separately from the bell. */
    kind: v.optional(
      v.union(
        v.literal("chat"),
        v.literal("comment"),
        v.literal("deploy"),
        v.literal("general"),
      ),
    ),
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

  contactMessages: defineTable({
    name: v.string(),
    email: v.string(),
    company: v.optional(v.string()),
    topic: v.union(
      v.literal("General"),
      v.literal("Sales"),
      v.literal("Support"),
      v.literal("Press"),
    ),
    message: v.string(),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_created", ["createdAt"]),

  waitlistSignups: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    source: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  blogPosts: defineTable({
    slug: v.string(),
    title: v.string(),
    category: v.union(
      v.literal("Engineering"),
      v.literal("AI"),
      v.literal("Product"),
      v.literal("Company"),
      v.literal("Tutorials"),
    ),
    author: v.string(),
    excerpt: v.string(),
    body: v.string(),
    readTimeMinutes: v.number(),
    publishedAt: v.number(),
    gradient: v.string(),
    featured: v.boolean(),
    published: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_published_publishedAt", ["published", "publishedAt"])
    .index("by_category_published", ["category", "published", "publishedAt"])
    .index("by_featured_published", ["featured", "published", "publishedAt"]),
});

