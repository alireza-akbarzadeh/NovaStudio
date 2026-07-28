export async function getClerkGoogleToken(
  userId: string,
): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("CLERK_SECRET_KEY is not configured in Convex");
  }

  const response = await fetch(
    `https://api.clerk.com/v1/users/${userId}/oauth_access_tokens/oauth_google`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to fetch Google token from Clerk: ${body}`);
  }

  const tokens = (await response.json()) as Array<{ token?: string }>;
  return tokens[0]?.token ?? null;
}

export type GoogleProfile = {
  id: string;
  email: string;
  name?: string;
  picture?: string;
};

export type GoogleCalendarEvent = {
  id: string;
  title: string;
  description?: string | null;
  htmlLink?: string | null;
  hangoutLink?: string | null;
  location?: string | null;
  start: string;
  end: string;
  allDay: boolean;
  status?: string | null;
};

async function googleFetch<T>(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`https://www.googleapis.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    let message = body || `Google Calendar API failed (${response.status})`;
    try {
      const parsed = JSON.parse(body) as {
        error?: { message?: string };
      };
      if (parsed.error?.message) {
        message = parsed.error.message;
      }
    } catch {
      // keep raw body
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function fetchGoogleProfile(
  accessToken: string,
): Promise<GoogleProfile> {
  const data = await googleFetch<{
    id: string;
    email: string;
    name?: string;
    picture?: string;
  }>(accessToken, "/oauth2/v2/userinfo");

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    picture: data.picture,
  };
}

function mapEvent(event: {
  id?: string | null;
  summary?: string | null;
  description?: string | null;
  htmlLink?: string | null;
  hangoutLink?: string | null;
  location?: string | null;
  status?: string | null;
  start?: { dateTime?: string | null; date?: string | null };
  end?: { dateTime?: string | null; date?: string | null };
}): GoogleCalendarEvent | null {
  if (!event.id) return null;
  const start = event.start?.dateTime || event.start?.date;
  const end = event.end?.dateTime || event.end?.date;
  if (!start || !end) return null;

  return {
    id: event.id,
    title: event.summary?.trim() || "(No title)",
    description: event.description ?? null,
    htmlLink: event.htmlLink ?? null,
    hangoutLink: event.hangoutLink ?? null,
    location: event.location ?? null,
    start,
    end,
    allDay: Boolean(event.start?.date && !event.start?.dateTime),
    status: event.status ?? null,
  };
}

export async function listGoogleCalendarEvents(args: {
  accessToken: string;
  timeMin: string;
  timeMax: string;
  maxResults?: number;
}): Promise<GoogleCalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin: args.timeMin,
    timeMax: args.timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: String(Math.min(Math.max(args.maxResults ?? 40, 1), 100)),
  });

  const data = await googleFetch<{
    items?: Array<{
      id?: string | null;
      summary?: string | null;
      description?: string | null;
      htmlLink?: string | null;
      hangoutLink?: string | null;
      location?: string | null;
      status?: string | null;
      start?: { dateTime?: string | null; date?: string | null };
      end?: { dateTime?: string | null; date?: string | null };
    }>;
  }>(
    args.accessToken,
    `/calendar/v3/calendars/primary/events?${params.toString()}`,
  );

  return (data.items ?? [])
    .map(mapEvent)
    .filter((event): event is GoogleCalendarEvent => event !== null);
}

export async function createGoogleCalendarEvent(args: {
  accessToken: string;
  title: string;
  description?: string;
  startIso: string;
  endIso: string;
  timeZone?: string;
  addMeetLink?: boolean;
}): Promise<GoogleCalendarEvent> {
  const timeZone = args.timeZone?.trim() || "UTC";
  const body: Record<string, unknown> = {
    summary: args.title,
    start: { dateTime: args.startIso, timeZone },
    end: { dateTime: args.endIso, timeZone },
  };
  if (args.description?.trim()) {
    body.description = args.description.trim();
  }
  if (args.addMeetLink) {
    body.conferenceData = {
      createRequest: {
        requestId: `nova-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }

  const query = args.addMeetLink ? "?conferenceDataVersion=1" : "";
  const data = await googleFetch<{
    id?: string | null;
    summary?: string | null;
    description?: string | null;
    htmlLink?: string | null;
    hangoutLink?: string | null;
    location?: string | null;
    status?: string | null;
    start?: { dateTime?: string | null; date?: string | null };
    end?: { dateTime?: string | null; date?: string | null };
  }>(args.accessToken, `/calendar/v3/calendars/primary/events${query}`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  const mapped = mapEvent(data);
  if (!mapped) {
    throw new Error("Google Calendar created an event without an id");
  }
  return mapped;
}
