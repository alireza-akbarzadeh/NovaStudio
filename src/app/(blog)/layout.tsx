import type { ReactNode } from "react";

/**
 * Route group for marketing blog surfaces (`/blog`, future post pages).
 * Does not affect the URL — keeps blog routes isolated from app/workspace trees.
 */
export default function BlogRouteGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
