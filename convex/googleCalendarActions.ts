"use node";

import { v } from "convex/values";

import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import {
  createGoogleCalendarEvent,
  fetchGoogleProfile,
  getClerkGoogleToken,
  listGoogleCalendarEvents,
  type GoogleCalendarEvent,
} from "./lib/googleCalendar";

async function requireGoogleAccess(ctx: {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
}) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Sign in to use Google Calendar");
  }

  const token = await getClerkGoogleToken(identity.subject);
  if (!token) {
    throw new Error(
      "Connect Google Calendar in Integrations first (approve Calendar access)",
    );
  }

  return { identity, token };
}

export const syncConnection = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const token = await getClerkGoogleToken(identity.subject);
    if (!token) {
      await ctx.runMutation(internal.googleCalendar.disconnectForUser, {
        userId: identity.subject,
      });
      return { connected: false as const };
    }

    const profile = await fetchGoogleProfile(token);

    await ctx.runMutation(internal.googleCalendar.upsertConnection, {
      userId: identity.subject,
      googleUserId: profile.id,
      email: profile.email,
      displayName: profile.name,
      avatarUrl: profile.picture,
    });

    return {
      connected: true as const,
      email: profile.email,
      displayName: profile.name,
    };
  },
});

export const listEvents = action({
  args: {
    timeMin: v.string(),
    timeMax: v.string(),
    maxResults: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<GoogleCalendarEvent[]> => {
    const { token } = await requireGoogleAccess(ctx);
    return await listGoogleCalendarEvents({
      accessToken: token,
      timeMin: args.timeMin,
      timeMax: args.timeMax,
      maxResults: args.maxResults,
    });
  },
});

export const createEvent = action({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    startIso: v.string(),
    endIso: v.string(),
    timeZone: v.optional(v.string()),
    addMeetLink: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<GoogleCalendarEvent> => {
    const { token } = await requireGoogleAccess(ctx);
    const title = args.title.trim();
    if (!title) {
      throw new Error("Meeting title is required");
    }

    return await createGoogleCalendarEvent({
      accessToken: token,
      title,
      description: args.description,
      startIso: args.startIso,
      endIso: args.endIso,
      timeZone: args.timeZone,
      addMeetLink: args.addMeetLink ?? true,
    });
  },
});
