import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { colorForUserId } from "./projectAccess";
import {
  createNotification,
  type NotificationKind,
} from "./createNotification";

type ActivityType =
  | "updated"
  | "contributor"
  | "merged"
  | "comment"
  | "released"
  | "joined"
  | "sponsored";

type NotificationTone = "violet" | "green" | "blue" | "orange";

type RecordActivityArgs = {
  projectId: Id<"projects">;
  actorUserId: string;
  actorName?: string;
  type: ActivityType;
  title: string;
  detail?: string;
  hasSnapshot?: boolean;
  notifyUserIds?: string[];
  notificationTone?: NotificationTone;
  notificationKind?: NotificationKind;
  soundKind?: "notify" | "success" | "warning" | "error" | "message" | "aiDone";
};

export async function recordProjectActivity(
  ctx: MutationCtx,
  args: RecordActivityArgs,
): Promise<Id<"projectActivity">> {
  const activityId = await ctx.db.insert("projectActivity", {
    projectId: args.projectId,
    actorUserId: args.actorUserId,
    actorName: args.actorName,
    actorColor: colorForUserId(args.actorUserId),
    type: args.type,
    title: args.title,
    detail: args.detail,
    createdAt: Date.now(),
    hasSnapshot: args.hasSnapshot,
  });

  const recipients = (args.notifyUserIds ?? []).filter(
    (userId) => userId !== args.actorUserId,
  );
  for (const userId of recipients) {
    await createNotification(ctx, {
      userId,
      title: args.detail ? `${args.title}: ${args.detail}` : args.title,
      tone: args.notificationTone ?? "violet",
      projectId: args.projectId,
      href: `/projects/${args.projectId}`,
      kind:
        args.notificationKind ??
        (args.type === "comment" ? "comment" : "general"),
      soundKind: args.soundKind ?? "notify",
    });
  }

  return activityId;
}

/** Records activity only when the project is public (community-visible). */
export async function maybeRecordPublicCommunityActivity(
  ctx: MutationCtx,
  args: RecordActivityArgs,
) {
  const project = await ctx.db.get("projects", args.projectId);
  if (!project || project.visibility !== "public") return null;
  return recordProjectActivity(ctx, args);
}
