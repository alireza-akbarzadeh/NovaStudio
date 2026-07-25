import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * WebContainers need SharedArrayBuffer → cross-origin isolation.
 * Apply COOP/COEP on workspace project routes (not marketing / auth).
 */
function withWebContainerHeaders(request: Request, response: NextResponse) {
  const path = new URL(request.url).pathname;
  const isProjectWorkspace =
    /^\/projects\/[^/]+/.test(path) && !path.startsWith("/projects/new");

  if (isProjectWorkspace) {
    response.headers.set("Cross-Origin-Embedder-Policy", "credentialless");
    response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  }

  return response;
}

export default clerkMiddleware((_auth, request) => {
  return withWebContainerHeaders(request, NextResponse.next());
});

export const config = {
  matcher: [
    // Skip Next.js internals, Sentry tunnel, and static files
    "/((?!monitoring|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Always run for Clerk-specific frontend API routes
    "/__clerk/(.*)",
  ],
};
