import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { formatRelativeTime } from "./lib/accessibleProjects";
import {
  colorForUserId,
  identityDisplayName,
  resolveProjectAccess,
  verifyProjectAccess,
} from "./lib/projectAccess";
import { recordProjectActivity } from "./lib/recordActivity";

const MAX_MESSAGE_LENGTH = 4000;
const MAX_MENTIONS = 20;
const MAX_ATTACHMENTS = 8;
const MENTION_TOKEN = /@([^\s@]+)/g;

const chatAttachmentValidator = v.object({
  storageId: v.id("_storage"),
  filename: v.string(),
  mediaType: v.string(),
  kind: v.union(v.literal("file"), v.literal("voice")),
});

function fileBasename(path: string) {
  return path.split("/").pop() || path;
}

function extractMentionedPathsFromBody(
  body: string,
  projectFilePaths: Set<string>,
): string[] {
  const mentionedPaths: string[] = [];
  const regex = new RegExp(MENTION_TOKEN.source, "g");
  let match: RegExpExecArray | null;
  while ((match = regex.exec(body)) !== null) {
    const token = (match[1] ?? "").replace(/[.,;:!?)]+$/g, "");
    if (!token) continue;
    if (projectFilePaths.has(token)) {
      mentionedPaths.push(token);
      continue;
    }
    for (const path of projectFilePaths) {
      if (fileBasename(path) === token) {
        mentionedPaths.push(path);
        break;
      }
    }
  }
  return [...new Set(mentionedPaths)];
}

export const generateUploadUrl = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    await verifyProjectAccess(ctx, args.projectId);
    return await ctx.storage.generateUploadUrl();
  },
});

export const listMessages = query({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await verifyProjectAccess(ctx, args.projectId);
    const limit = Math.min(Math.max(args.limit ?? 80, 1), 200);
    const rows = await ctx.db
      .query("projectChatMessages")
      .withIndex("by_project_created", (q) =>
        q.eq("projectId", args.projectId),
      )
      .order("desc")
      .take(limit);

    return await Promise.all(
      rows.reverse().map(async (row) => {
        const attachments = await Promise.all(
          (row.attachments ?? []).map(async (attachment) => {
            const url = await ctx.storage.getUrl(attachment.storageId);
            return {
              ...attachment,
              url,
            };
          }),
        );

        return {
          id: row._id,
          body: row.body,
          filePath: row.filePath,
          mentionedPaths: row.mentionedPaths ?? [],
          attachments,
          createdAt: row.createdAt,
          time: formatRelativeTime(row.createdAt),
          author: {
            userId: row.authorUserId,
            name: row.authorName ?? "Someone",
            imageUrl: row.authorImageUrl,
            color: row.authorColor ?? colorForUserId(row.authorUserId),
            initials:
              (row.authorName ?? "U")
                .split(/\s+/)
                .map((part) => part[0] ?? "")
                .join("")
                .slice(0, 2)
                .toUpperCase() || "U",
          },
        };
      }),
    );
  },
});

export const sendMessage = mutation({
  args: {
    projectId: v.id("projects"),
    body: v.string(),
    filePath: v.optional(v.string()),
    mentionedPaths: v.optional(v.array(v.string())),
    attachments: v.optional(v.array(chatAttachmentValidator)),
  },
  handler: async (ctx, args) => {
    const access = await resolveProjectAccess(ctx, args.projectId);
    if (!access) {
      throw new Error("Unauthorized access to this project");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const body = args.body.trim();
    const attachments = (args.attachments ?? []).slice(0, MAX_ATTACHMENTS);

    if (!body && attachments.length === 0) {
      throw new Error("Message cannot be empty");
    }
    if (body.length > MAX_MESSAGE_LENGTH) {
      throw new Error(`Message must be under ${MAX_MESSAGE_LENGTH} characters`);
    }

    for (const attachment of attachments) {
      const meta = await ctx.db.system.get("_storage", attachment.storageId);
      if (!meta) {
        throw new Error("Attachment upload not found");
      }
    }

    const projectFiles = await ctx.db
      .query("projectFiles")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const projectFilePaths = new Set(
      projectFiles
        .filter((file) => file.kind === "file")
        .map((file) => file.path),
    );

    const mentionedPaths = [
      ...new Set(
        [
          ...(args.mentionedPaths ?? []),
          ...extractMentionedPathsFromBody(body, projectFilePaths),
        ]
          .map((path) => path.trim())
          .filter(Boolean),
      ),
    ].slice(0, MAX_MENTIONS);

    const member = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", access.userId),
      )
      .unique();

    const authorName =
      member?.name ?? identityDisplayName(identity);
    const authorImageUrl = member?.imageUrl ?? identity.pictureUrl;
    const authorColor = member?.color ?? colorForUserId(access.userId);
    const filePath = args.filePath?.trim() || undefined;

    const messageId = await ctx.db.insert("projectChatMessages", {
      projectId: args.projectId,
      authorUserId: access.userId,
      authorName,
      authorImageUrl,
      authorColor,
      body,
      filePath,
      mentionedPaths:
        mentionedPaths.length > 0 ? mentionedPaths : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      createdAt: Date.now(),
    });

    const name = authorName?.trim() || "Someone";
    const hasVoice = attachments.some((item) => item.kind === "voice");
    const hasFile = attachments.some((item) => item.kind === "file");
    const mentionLabel =
      mentionedPaths[0]?.split("/").pop() ??
      filePath?.split("/").pop();

    let title: string;
    if (hasVoice && !body && !hasFile) {
      title = `${name} sent a voice message`;
    } else if (hasFile && !body && !hasVoice) {
      title = `${name} shared a file`;
    } else if (mentionLabel) {
      title = `${name} left a chat message on ${mentionLabel}`;
    } else {
      title = `${name} left a chat message`;
    }

    const detail =
      body.slice(0, 120) ||
      attachments[0]?.filename ||
      (hasVoice ? "Voice message" : undefined);

    const members = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    const notifyUserIds = [
      ...new Set([
        access.project.ownerId,
        ...members.map((m) => m.userId),
      ]),
    ];

    await recordProjectActivity(ctx, {
      projectId: args.projectId,
      actorUserId: access.userId,
      actorName: authorName,
      type: "comment",
      title,
      detail,
      notifyUserIds,
      notificationTone: "blue",
      notificationKind: "chat",
      soundKind: "message",
    });

    return messageId;
  },
});
