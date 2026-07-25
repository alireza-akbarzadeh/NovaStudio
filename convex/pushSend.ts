"use node";

import { v } from "convex/values";
import webpush from "web-push";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

const soundKind = v.union(
  v.literal("notify"),
  v.literal("success"),
  v.literal("warning"),
  v.literal("error"),
  v.literal("message"),
  v.literal("aiDone"),
);

export const sendToUser = internalAction({
  args: {
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    href: v.optional(v.string()),
    soundKind: v.optional(soundKind),
    notificationId: v.optional(v.id("notifications")),
  },
  handler: async (ctx, args) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT ?? "mailto:support@polaris.app";

    if (!publicKey || !privateKey) {
      console.warn("VAPID keys missing — skip push send");
      return { sent: 0 };
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

    const subscriptions = await ctx.runQuery(
      internal.pushSubscriptions.listByUser,
      { userId: args.userId },
    );

    let sent = 0;
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({
            title: args.title,
            body: args.body,
            href: args.href ?? "/",
            soundKind: args.soundKind ?? "notify",
            notificationId: args.notificationId,
          }),
        );
        sent += 1;
      } catch (error) {
        const status =
          typeof error === "object" &&
          error &&
          "statusCode" in error &&
          typeof (error as { statusCode?: number }).statusCode === "number"
            ? (error as { statusCode: number }).statusCode
            : null;
        if (status === 404 || status === 410) {
          await ctx.runMutation(internal.pushSubscriptions.removeById, {
            subscriptionId: sub._id,
          });
        } else {
          console.error("Push send failed", error);
        }
      }
    }

    return { sent };
  },
});
