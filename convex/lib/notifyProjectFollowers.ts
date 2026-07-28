import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import {
  createNotification,
  type NotificationKind,
  type NotificationSoundKind,
} from "./createNotification";

type NotifyProjectFollowersArgs = {
  projectId: Id<"projects">;
  excludeUserId?: string;
  title: string;
  body?: string;
  href?: string;
  kind?: NotificationKind;
  tone?: "violet" | "green" | "blue" | "orange";
  soundKind?: NotificationSoundKind;
};

export async function notifyProjectFollowers(
  ctx: MutationCtx,
  args: NotifyProjectFollowersArgs,
) {
  const followers = await ctx.db
    .query("projectFollows")
    .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
    .collect();

  const href = args.href ?? `/projects/community/${args.projectId}`;

  for (const follower of followers) {
    if (follower.userId === args.excludeUserId) continue;
    await createNotification(ctx, {
      userId: follower.userId,
      title: args.title,
      body: args.body ?? args.title,
      href,
      projectId: args.projectId,
      kind: args.kind ?? "general",
      tone: args.tone,
      soundKind: args.soundKind,
    });
  }
}
