export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
] as const;

export function hasGoogleCalendarScope(
  approvedScopes: string | string[] | undefined | null,
): boolean {
  if (!approvedScopes) return false;
  const scopes = Array.isArray(approvedScopes)
    ? approvedScopes
    : approvedScopes.split(/[\s,]+/).filter(Boolean);
  return scopes.some(
    (scope) =>
      scope === "https://www.googleapis.com/auth/calendar" ||
      scope === "https://www.googleapis.com/auth/calendar.events",
  );
}
