import { v } from "convex/values";

import { action } from "./_generated/server";
import { meetNovaWelcomeEmail, sendEmail } from "./lib/email";

/**
 * Send the "Meet Nova" welcome email (Resend).
 * Useful for onboarding tests — call from the Convex dashboard or a button.
 *
 * Requires Convex env: RESEND_API_KEY, RESEND_FROM, APP_ORIGIN
 */
export const sendMeetNovaWelcome = action({
  args: {
    to: v.string(),
    firstName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const to = args.to.trim().toLowerCase();
    if (!to.includes("@")) {
      throw new Error("A valid email is required");
    }

    const template = meetNovaWelcomeEmail({
      firstName: args.firstName?.trim() || identity.givenName || null,
    });

    const result = await sendEmail({
      to,
      ...template,
    });

    if (!result.ok) {
      throw new Error(
        result.reason === "not_configured"
          ? "Email is not configured (set RESEND_API_KEY in Convex)"
          : result.detail ?? "Failed to send Meet Nova email",
      );
    }

    return { ok: true as const, id: result.id };
  },
});
