import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { colorForUserId } from "./projectAccess";
import { createNotification } from "./createNotification";

type ActivityType =
  | "updated"
  | "contributor"
  | "merged"
  | "comment"
  | "released"
  | "joined";

type NotificationTone = "violet" | "green" | "blue" | "orange";

type RecordActivityArgs = {
  projectId: Id<"projects">;
  actorUserId: string;
  actorName?: string;
  type: ActivityType;
  title: string;
  detail?: string;
  notifyUserIds?: string[];
  notificationTone?: NotificationTone;
};

export async function recordProjectActivity(
  ctx: MutationCtx,
  args: RecordActivityArgs,
) {
  await ctx.db.insert("projectActivity", {
    projectId: args.projectId,
    actorUserId: args.actorUserId,
    actorName: args.actorName,
    actorColor: colorForUserId(args.actorUserId),
    type: args.type,
    title: args.title,
    detail: args.detail,
    createdAt: Date.now(),
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
      soundKind: "notify",
    });
  }
}
