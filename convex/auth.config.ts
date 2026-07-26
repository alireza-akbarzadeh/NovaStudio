import { AuthConfig } from "convex/server";

/**
 * Clerk JWT issuer for this Convex deployment.
 *
 * MUST match:
 * 1. `.env.local` → CLERK_JWT_ISSUER_DOMAIN (same Clerk app as the Next.js keys)
 * 2. Clerk JWT template named `convex` with `"aud": "convex"`
 *
 * Drift between (1) and this env causes:
 *   "No auth provider found matching the given token"
 *
 * Keep them aligned with: `npm run auth:sync`
 * (also runs automatically before `npm run backend`)
 */
const clerkIssuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN;

if (!clerkIssuerDomain) {
  throw new Error(
    "CLERK_JWT_ISSUER_DOMAIN is not set on this Convex deployment. " +
      "Run `npm run auth:sync` from the repo root.",
  );
}

export default {
  providers: [
    {
      domain: clerkIssuerDomain,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;