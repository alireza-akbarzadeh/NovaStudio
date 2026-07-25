import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { internal } from "../_generated/api";

export type NotificationSoundKind =
  | "notify"
  | "success"
  | "warning"
  | "error"
  | "message"
  | "aiDone";

type NotificationTone = "violet" | "green" | "blue" | "orange";

type CreateNotificationArgs = {
  userId: string;
  title: string;
  tone?: NotificationTone;
  href?: string;
  projectId?: Id<"projects">;
  soundKind?: NotificationSoundKind;
  body?: string;
};

export async function createNotification(
  ctx: MutationCtx,
  args: CreateNotificationArgs,
) {
  const notificationId = await ctx.db.insert("notifications", {
    userId: args.userId,
    title: args.title,
    tone: args.tone ?? "violet",
    href: args.href,
    projectId: args.projectId,
    soundKind: args.soundKind ?? "notify",
    createdAt: Date.now(),
  });

  await ctx.scheduler.runAfter(0, internal.pushSend.sendToUser, {
    userId: args.userId,
    title: args.title,
    body: args.body ?? args.title,
    href: args.href,
    soundKind: args.soundKind ?? "notify",
    notificationId,
  });

  return notificationId;
}
