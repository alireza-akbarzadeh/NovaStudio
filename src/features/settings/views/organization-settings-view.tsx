"use client";

import { OrganizationProfile, Show, useOrganization } from "@clerk/nextjs";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { clerkAppearance } from "@/features/billing/lib/clerk-appearance";
import { HubPageHeader } from "@/features/projects/components/workspace/hub-page-header";

export function OrganizationSettingsView() {
  const { organization, isLoaded } = useOrganization();

  return (
    <div className="mx-auto w-full max-w-4xl">
      <HubPageHeader
        title="Organization"
        description={
          organization
            ? `Manage ${organization.name} — members, roles, and profile.`
            : "Select or create a team with the organization switcher to manage members and roles."
        }
      />

      {!isLoaded ? (
        <div className="rounded-[22px] border border-border/60 bg-card/70 p-8 text-sm text-muted-foreground">
          Loading organization…
        </div>
      ) : !organization ? (
        <div className="rounded-[22px] border border-dashed border-border/70 bg-card/50 px-6 py-16 text-center backdrop-blur-xl">
          <h2 className="text-lg font-semibold tracking-tight">
            No team selected
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Use the organization switcher in the header to create a team or
            switch into an existing one. Personal projects stay under Personal
            Account.
          </p>
          <Button asChild size="sm" className="mt-4 rounded-xl">
            <Link href="/projects">Back to projects</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Show
            when={{ permission: "org:sys_memberships:manage" }}
            fallback={
              <p className="rounded-xl border border-border/50 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                You can view this organization. Ask an admin to invite members
                or change roles.
              </p>
            }
          >
            <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
              As an admin you can invite teammates and assign{" "}
              <span className="font-medium text-foreground">org:admin</span> or{" "}
              <span className="font-medium text-foreground">org:member</span>.
              Project edit access is still managed per project (owner / editor /
              viewer).
            </p>
          </Show>

          <div className="overflow-hidden rounded-[22px] border border-border/60 bg-card/70 shadow-[0_16px_48px_-32px_rgba(76,29,149,0.4)] backdrop-blur-xl">
            <OrganizationProfile
              appearance={{
                ...clerkAppearance,
                elements: {
                  ...(clerkAppearance.elements as Record<string, string>),
                  rootBox: "w-full",
                  cardBox: "w-full shadow-none border-0",
                  navbar: "border-border/50",
                },
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
