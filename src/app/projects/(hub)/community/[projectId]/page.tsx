import type { Metadata } from "next";
import { Suspense } from "react";

import { ConvexHttpClient } from "convex/browser";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { CommunityProjectDetailsClient } from "@/features/projects/views/community-project-details-client";

type Props = {
  params: Promise<{ projectId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!convexUrl) {
    return {
      title: "Community project · NovaStudio",
      description: "Discover public workspaces on NovaStudio Community.",
    };
  }

  try {
    const convex = new ConvexHttpClient(convexUrl);
    const meta = await convex.query(
      api.projectCommunity.getPublicProjectMetadata,
      { projectId: projectId as Id<"projects"> },
    );

    if (!meta) {
      return {
        title: "Project not found · NovaStudio",
        description: "This community project is unavailable.",
      };
    }

    const techSummary =
      meta.tech.length > 0 ? ` · ${meta.tech.slice(0, 4).join(", ")}` : "";
    const title = `${meta.name} · Community · NovaStudio`;
    const description = `${meta.description}${techSummary}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch {
    return {
      title: "Community project · NovaStudio",
      description: "Discover public workspaces on NovaStudio Community.",
    };
  }
}

export default async function CommunityProjectDetailsPage({ params }: Props) {
  const { projectId } = await params;
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-muted-foreground">
          Loading project…
        </div>
      }
    >
      <CommunityProjectDetailsClient projectId={projectId} />
    </Suspense>
  );
}
