"use client";

import { HeartHandshakeIcon, SparklesIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProjectDetailsSponsorWallEntry } from "@/features/projects/lib/project-details-types";
import { sponsorTierMeta, sponsorTierOrder } from "@/features/projects/lib/project-details-utils";
import { cn } from "@/lib/utils";

type ProjectDetailsSponsorWallSectionProps = {
  sponsors: ProjectDetailsSponsorWallEntry[];
  onBecomeSponsor: () => void;
};

const tierOrder = sponsorTierOrder;

function SponsorCard({ sponsor }: { sponsor: ProjectDetailsSponsorWallEntry }) {
  const meta = sponsorTierMeta[sponsor.tier];

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-2xl border p-4 shadow-[0_12px_40px_-28px_rgba(76,29,149,0.45)]",
        meta.cardClass,
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar
          size="lg"
          style={{ boxShadow: `0 0 0 2px ${sponsor.color}` }}
        >
          <AvatarFallback className="text-sm font-semibold">
            {sponsor.initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold tracking-tight">{sponsor.name}</p>
            <Badge
              variant="outline"
              className={cn("rounded-full text-[10px]", meta.badgeClass)}
            >
              {meta.shortLabel}
            </Badge>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Supporting since {sponsor.since}
          </p>
        </div>
      </div>

      {sponsor.amount ? (
        <p className="mt-3 text-sm font-medium text-foreground/90">
          {sponsor.amount}
        </p>
      ) : null}

      {sponsor.message ? (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          &ldquo;{sponsor.message}&rdquo;
        </p>
      ) : null}

      {sponsor.featureCount > 0 ? (
        <div className="mt-3 space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Proposed
          </p>
          <ul className="space-y-1">
            {sponsor.featureTitles.map((title) => (
              <li
                key={title}
                className="truncate text-xs text-foreground/85 before:mr-1.5 before:text-primary before:content-['•']"
              >
                {title}
              </li>
            ))}
            {sponsor.featureCount > sponsor.featureTitles.length ? (
              <li className="text-[11px] text-muted-foreground">
                +{sponsor.featureCount - sponsor.featureTitles.length} more
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

export function ProjectDetailsSponsorWallSection({
  sponsors,
  onBecomeSponsor,
}: ProjectDetailsSponsorWallSectionProps) {
  const grouped = tierOrder
    .map((tier) => ({
      tier,
      items: sponsors.filter((sponsor) => sponsor.tier === tier),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <section className="rounded-[24px] border border-border/60 bg-card/85 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <HeartHandshakeIcon className="size-4 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">Sponsor wall</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            People backing this project — supporters, backers, and feature sponsors.
          </p>
        </div>
        <Button type="button" variant="outline" className="rounded-xl" onClick={onBecomeSponsor}>
          <SparklesIcon className="size-4" />
          Join the wall
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {sponsorTierOrder.map((tier) => {
          const meta = sponsorTierMeta[tier];
          return (
            <span
              key={tier}
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px]",
                meta.badgeClass,
              )}
            >
              {meta.label}
            </span>
          );
        })}
      </div>

      {sponsors.length > 0 ? (
        <div className="mt-6 space-y-8">
          {grouped.map((group) => {
            const meta = sponsorTierMeta[group.tier];
            return (
              <div key={group.tier}>
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="text-sm font-semibold tracking-tight">
                    {meta.label}s
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {group.items.length}
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((sponsor) => (
                    <SponsorCard key={sponsor.userId} sponsor={sponsor} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-border/70 px-4 py-10 text-center">
          <HeartHandshakeIcon className="mx-auto size-8 text-muted-foreground/60" />
          <p className="mt-3 text-sm font-medium">No sponsors yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Be the first to support this project and appear on the wall.
          </p>
          <Button
            type="button"
            className="mt-4 rounded-xl"
            onClick={onBecomeSponsor}
          >
            Become a sponsor
          </Button>
        </div>
      )}
    </section>
  );
}
