/**
 * Active Clerk Organization context from the Convex JWT (convex template claims).
 *
 * Requires the Clerk `convex` JWT template to include:
 *   org_id: {{org.id}}
 *   org_role: {{org.role}}
 *   org_slug: {{org.slug}}  (optional)
 *
 * When the user has Personal Account selected, these claims are absent/null.
 */

export type OrgContext = {
  /** Active Clerk organization id (`org_…`), or null for Personal Account. */
  orgId: string | null;
  /** Active org role slug, e.g. `org:admin` / `org:member`. */
  orgRole: string | null;
  /** Active org slug when present on the token. */
  orgSlug: string | null;
};

type IdentityLike = Record<string, unknown> & {
  subject: string;
};

function asOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Read org claims from `ctx.auth.getUserIdentity()` (custom JWT fields). */
export function getOrgContext(identity: IdentityLike): OrgContext {
  return {
    orgId:
      asOptionalString(identity.org_id) ??
      asOptionalString(identity.orgId) ??
      null,
    orgRole:
      asOptionalString(identity.org_role) ??
      asOptionalString(identity.orgRole) ??
      null,
    orgSlug:
      asOptionalString(identity.org_slug) ??
      asOptionalString(identity.orgSlug) ??
      null,
  };
}

/**
 * Whether a project belongs in the current session tenant.
 * Personal context → projects without orgId; org context → matching orgId.
 */
export function projectMatchesTenant(
  project: { orgId?: string },
  orgId: string | null,
): boolean {
  if (orgId) {
    return project.orgId === orgId;
  }
  return !project.orgId;
}

/**
 * Org-owned projects require the session's active org to match.
 * Personal projects (no orgId) are allowed regardless of active org —
 * callers that list projects should still filter by tenant via
 * `projectMatchesTenant`; this guard is for direct project access.
 */
export function assertOrgAccessForProject(
  project: { orgId?: string },
  identity: IdentityLike,
): void {
  if (!project.orgId) return;
  const { orgId } = getOrgContext(identity);
  if (orgId !== project.orgId) {
    throw new Error("Unauthorized access to this project");
  }
}

/** True when the identity can access this org-scoped project (or it is personal). */
export function canAccessProjectInOrg(
  project: { orgId?: string },
  identity: IdentityLike,
): boolean {
  if (!project.orgId) return true;
  const { orgId } = getOrgContext(identity);
  return orgId === project.orgId;
}
