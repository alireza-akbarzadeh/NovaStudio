"use client";

import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2Icon,
  CircleAlertIcon,
  CloudUploadIcon,
  ExternalLinkIcon,
  KeyRoundIcon,
  Loader2Icon,
  RocketIcon,
  Settings2Icon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { ConnectDeployDialog } from "@/features/deploy/components/connect-deploy-dialog";
import {
  useDeployConnection,
  useDeployProject,
  useProjectDeployments,
  useProjectDeployTarget,
  useRefreshDeploymentStatus,
  type DeployProvider,
} from "@/features/deploy/hooks/use-deploy-connection";
import {
  classifyDeployError,
  deploymentOpenUrl,
  netlifyDeploysUrl,
  netlifyEnvVarsUrl,
  netlifySiteAdminUrl,
} from "@/features/deploy/lib/provider-urls";
import {
  useConnectGitHub,
  useGitHubConnection,
} from "@/features/github/hooks/use-github-connection";
import { useProject } from "@/features/projects/hooks/use-projects";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";

type WorkspaceDeployMenuProps = {
  projectId: string;
};

function statusMeta(status: string) {
  switch (status) {
    case "ready":
      return {
        label: "Live",
        tone: "text-emerald-400",
        dot: "bg-emerald-400",
        Icon: CheckCircle2Icon,
      };
    case "error":
    case "failed":
      return {
        label: "Failed",
        tone: "text-rose-400",
        dot: "bg-rose-400",
        Icon: CircleAlertIcon,
      };
    case "needs_setup":
      return {
        label: "Needs setup",
        tone: "text-amber-400",
        dot: "bg-amber-400",
        Icon: CircleAlertIcon,
      };
    case "cancelled":
      return {
        label: "Cancelled",
        tone: "text-ws-text-muted",
        dot: "bg-ws-text-muted",
        Icon: CircleAlertIcon,
      };
    default:
      return {
        label: "Building",
        tone: "text-sky-400",
        dot: "bg-sky-400 animate-pulse",
        Icon: Loader2Icon,
      };
  }
}

function DeployRow({
  deployment,
  siteName,
  onRefresh,
}: {
  deployment: Doc<"deployments">;
  siteName?: string;
  onRefresh?: (id: Id<"deployments">) => void;
}) {
  const meta = statusMeta(deployment.status);
  const Icon = meta.Icon;
  const spinning = meta.label === "Building";
  const isLive = deployment.status === "ready";
  const openUrl =
    deploymentOpenUrl(deployment) ||
    (deployment.provider === "netlify" && siteName
      ? isLive
        ? deployment.url
        : `${netlifyDeploysUrl(siteName)}/${encodeURIComponent(deployment.externalId)}`
      : undefined);
  const openLabel = isLive
    ? "Open live site"
    : meta.label === "Failed" || meta.label === "Needs setup"
      ? "Open build logs"
      : "Open in provider";
  const errorInfo = classifyDeployError(deployment.errorMessage);

  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-ws-border/70 bg-ws-stage/40 px-2.5 py-2">
      <span
        className={cn(
          "mt-1 flex size-6 shrink-0 items-center justify-center rounded-md bg-ws-hover",
          meta.tone,
        )}
      >
        <Icon
          className={cn("size-3.5", spinning && "animate-spin")}
          strokeWidth={1.75}
        />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn("text-[11px] font-medium", meta.tone)}>
            {meta.label}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-ws-text-muted">
            {deployment.provider} · {deployment.target}
          </span>
        </div>
        {isLive && deployment.url ? (
          <a
            href={deployment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 block truncate text-[11px] text-sky-400 hover:underline"
          >
            {deployment.url.replace(/^https?:\/\//, "")}
          </a>
        ) : errorInfo ? (
          <div className="mt-0.5 space-y-0.5">
            <p className="text-[11px] leading-snug text-rose-300/90">
              {errorInfo.title}
            </p>
            <p className="text-[10px] leading-snug text-ws-text-muted">
              {errorInfo.hint}
            </p>
            {openUrl ? (
              <button
                type="button"
                className="text-[11px] text-sky-400 hover:underline"
                onClick={() => window.open(openUrl, "_blank", "noopener")}
              >
                {errorInfo.kind === "repo_access"
                  ? "Open Netlify → fix Git access"
                  : "View build logs"}
              </button>
            ) : null}
          </div>
        ) : openUrl ? (
          <button
            type="button"
            className="mt-0.5 block truncate text-left text-[11px] text-sky-400 hover:underline"
            onClick={() => window.open(openUrl, "_blank", "noopener")}
          >
            {meta.label === "Failed"
              ? `View build logs on ${deployment.provider === "vercel" ? "Vercel" : "Netlify"}`
              : meta.label === "Building"
                ? `Watch build on ${deployment.provider === "vercel" ? "Vercel" : "Netlify"}`
                : formatDistanceToNow(deployment.createdAt, { addSuffix: true })}
          </button>
        ) : (
          <p className="mt-0.5 text-[11px] text-ws-text-muted">
            {formatDistanceToNow(deployment.createdAt, { addSuffix: true })}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {deployment.status === "building" && onRefresh ? (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="size-6 text-ws-text-muted hover:text-ws-text"
            aria-label="Refresh status"
            onClick={() => onRefresh(deployment._id)}
          >
            <Loader2Icon className="size-3" strokeWidth={1.75} />
          </Button>
        ) : null}
        {openUrl ? (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="size-6 text-ws-text-muted hover:text-ws-text"
            aria-label={openLabel}
            onClick={() => window.open(openUrl, "_blank", "noopener")}
          >
            <ExternalLinkIcon className="size-3" strokeWidth={1.75} />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function WorkspaceDeployMenu({ projectId }: WorkspaceDeployMenuProps) {
  const project = useProject({ projectId });
  const netlify = useDeployConnection("netlify");
  const vercel = useDeployConnection("vercel");
  const { isConnected: isGitHubConnected, hasRepoScope } =
    useGitHubConnection();
  const { connect: connectGitHub, isConnecting: isConnectingGitHub } =
    useConnectGitHub();
  const openGitInitDialog = useWorkspaceStore((s) => s.openGitInitDialog);
  const { deploy, deployingProvider, isDeploying } =
    useDeployProject(projectId);
  const deployments = useProjectDeployments(projectId, 6);
  const netlifyTarget = useProjectDeployTarget(projectId, "netlify");
  const refreshStatus = useRefreshDeploymentStatus();
  const [open, setOpen] = useState(false);
  const [connectProvider, setConnectProvider] = useState<DeployProvider | null>(
    null,
  );
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  // Account integrations ≠ this project having a repo Netlify/Vercel can build.
  const hasLinkedRepo = Boolean(project?.githubRepoUrl);
  const latest = deployments?.[0];
  const latestMeta = latest ? statusMeta(latest.status) : null;
  const hasLiveSite = Boolean(
    netlifyTarget?.url &&
      deployments?.some((d) => d.provider === "netlify" && d.status === "ready"),
  );
  const netlifySiteName = netlifyTarget?.name;
  const netlifyAdminUrl = netlifySiteName
    ? netlifySiteAdminUrl(netlifySiteName)
    : undefined;
  const netlifyEnvUrl = netlifySiteName
    ? netlifyEnvVarsUrl(netlifySiteName)
    : undefined;

  const buildingIds = useMemo(
    () =>
      (deployments ?? [])
        .filter((d) => d.status === "building" && d.provider === "netlify")
        .map((d) => d._id),
    [deployments],
  );

  // Poll in-progress Netlify deploys while the popover is open (or always lightly).
  useEffect(() => {
    if (buildingIds.length === 0) return;

    let cancelled = false;
    const tick = async () => {
      for (const id of buildingIds) {
        if (cancelled) return;
        try {
          await refreshStatus(id);
        } catch {
          // Keep polling; transient API errors are fine.
        }
      }
    };

    void tick();
    const interval = window.setInterval(() => void tick(), 8_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [buildingIds, refreshStatus]);

  const onPublishProjectToGitHub = () => {
    if (!isGitHubConnected || !hasRepoScope) {
      void connectGitHub();
      return;
    }
    setOpen(false);
    openGitInitDialog();
  };

  const onDeploy = async (
    provider: DeployProvider,
    target: "preview" | "production",
  ) => {
    if (!hasLinkedRepo) {
      toast.message("Link this project to GitHub first", {
        description:
          "Integrations are connected, but Netlify and Vercel build from a repository on this project.",
        action: {
          label: "Publish",
          onClick: onPublishProjectToGitHub,
        },
      });
      return;
    }
    const connection = provider === "vercel" ? vercel : netlify;
    if (!connection.isConnected) {
      setConnectProvider(provider);
      return;
    }
    await deploy(provider, target);
  };

  const onRefresh = async (id: Id<"deployments">) => {
    setRefreshingId(id);
    try {
      await refreshStatus(id);
    } finally {
      setRefreshingId(null);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Deploy"
                className={cn(
                  "relative size-7 rounded-sm text-ws-text-muted hover:bg-ws-hover hover:text-ws-text",
                  latestMeta?.label === "Live" && "text-emerald-400",
                  latestMeta?.label === "Failed" && "text-rose-400",
                  latestMeta?.label === "Building" && "text-sky-400",
                )}
              >
                {isDeploying || refreshingId ? (
                  <Loader2Icon
                    className="size-3.5 animate-spin"
                    strokeWidth={1.75}
                  />
                ) : (
                  <RocketIcon className="size-3.5" strokeWidth={1.75} />
                )}
                {latestMeta ? (
                  <span
                    className={cn(
                      "absolute top-0.5 right-0.5 size-1.5 rounded-full",
                      latestMeta.dot,
                    )}
                  />
                ) : null}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            sideOffset={6}
            className="border border-ws-border-strong bg-ws-hover px-2.5 py-1.5 text-xs text-ws-text [&_svg]:hidden"
          >
            Deploy
          </TooltipContent>
        </Tooltip>

        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-[340px] border-ws-border bg-ws-panel p-0 text-ws-text shadow-xl"
        >
          <div className="border-b border-ws-border px-3.5 py-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[13px] font-semibold tracking-tight">Deploy</p>
                <p className="mt-0.5 text-[11px] text-ws-text-muted">
                  Publish to Netlify or Vercel and watch build status.
                </p>
              </div>
              <RocketIcon className="size-4 text-ws-accent" strokeWidth={1.75} />
            </div>
          </div>

          <div className="space-y-3 px-3.5 py-3">
            {!hasLinkedRepo ? (
              <div className="rounded-lg border border-dashed border-ws-border bg-ws-stage/50 px-3 py-3">
                <p className="text-[12px] leading-relaxed text-ws-text-muted">
                  Your Netlify / GitHub accounts are connected, but this project
                  still needs a GitHub repository. Publish it once, then deploy
                  from here.
                </p>
                <Button
                  type="button"
                  size="sm"
                  className="mt-2.5 h-8 w-full rounded-md bg-ws-accent text-[11px] text-white hover:bg-ws-accent-hover"
                  disabled={isConnectingGitHub}
                  onClick={onPublishProjectToGitHub}
                >
                  {isConnectingGitHub ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : (
                    <CloudUploadIcon className="size-3.5" />
                  )}
                  {!isGitHubConnected || !hasRepoScope
                    ? "Connect GitHub & publish"
                    : "Publish this project to GitHub"}
                </Button>
              </div>
            ) : null}

            <div className="rounded-lg border border-ws-border/80 bg-ws-stage/40 p-2.5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Image
                    src="/netlify.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="size-4"
                  />
                  <div>
                    <p className="text-[12px] font-medium">Netlify</p>
                    <p className="text-[10px] text-ws-text-muted">
                      {netlify.isConnected
                        ? `Connected${netlify.connection?.accountName ? ` · ${netlify.connection.accountName}` : ""}`
                        : "Not connected"}
                    </p>
                  </div>
                </div>
                {hasLiveSite && netlifyTarget?.url ? (
                  <a
                    href={netlifyTarget.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-sky-400 hover:underline"
                  >
                    Site
                    <ExternalLinkIcon className="size-3" />
                  </a>
                ) : netlifyAdminUrl ? (
                  <a
                    href={netlifyAdminUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-sky-400 hover:underline"
                  >
                    Dashboard
                    <ExternalLinkIcon className="size-3" />
                  </a>
                ) : null}
              </div>
              <div className="flex gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  className="h-8 flex-1 rounded-md bg-ws-accent text-[11px] text-white hover:bg-ws-accent-hover"
                  disabled={deployingProvider === "netlify"}
                  onClick={() => void onDeploy("netlify", "production")}
                >
                  {deployingProvider === "netlify" ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : (
                    <RocketIcon className="size-3.5" />
                  )}
                  {netlify.isConnected || !hasLinkedRepo
                    ? "Deploy production"
                    : "Connect & deploy"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-md border-ws-border bg-transparent text-[11px] text-ws-text hover:bg-ws-hover"
                  disabled={
                    !hasLinkedRepo ||
                    !netlify.isConnected ||
                    deployingProvider === "netlify"
                  }
                  onClick={() => void onDeploy("netlify", "preview")}
                >
                  Preview
                </Button>
              </div>
              {netlifyEnvUrl ? (
                <a
                  href={netlifyEnvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-[10px] text-ws-text-muted hover:text-ws-text"
                >
                  <KeyRoundIcon className="size-3" strokeWidth={1.75} />
                  Add env vars in Netlify
                </a>
              ) : null}
            </div>

            <div className="rounded-lg border border-ws-border/80 bg-ws-stage/40 p-2.5">
              <div className="mb-2 flex items-center gap-2">
                <Image
                  src="/vercel.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="size-4 dark:invert"
                />
                <div>
                  <p className="text-[12px] font-medium">Vercel</p>
                  <p className="text-[10px] text-ws-text-muted">
                    {vercel.isConnected
                      ? `Connected${vercel.connection?.accountName ? ` · ${vercel.connection.accountName}` : ""}`
                      : "Not connected"}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 w-full rounded-md border-ws-border bg-transparent text-[11px] text-ws-text hover:bg-ws-hover"
                disabled={deployingProvider === "vercel"}
                onClick={() => void onDeploy("vercel", "production")}
              >
                {deployingProvider === "vercel" ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  <RocketIcon className="size-3.5" />
                )}
                {vercel.isConnected || !hasLinkedRepo
                  ? "Deploy production"
                  : "Connect & deploy"}
              </Button>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-[10px] font-semibold tracking-[0.14em] text-ws-text-muted uppercase">
                  Recent deploys
                </p>
                {latest?.status === "building" ? (
                  <span className="text-[10px] text-sky-400">
                    Auto-refreshing…
                  </span>
                ) : null}
              </div>
              {deployments === undefined ? (
                <p className="text-[11px] text-ws-text-muted">Loading…</p>
              ) : deployments.length === 0 ? (
                <p className="rounded-lg border border-dashed border-ws-border px-3 py-3 text-[11px] text-ws-text-muted">
                  No deploys yet. Kick off a production deploy above.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {deployments.map((deployment) => (
                    <DeployRow
                      key={deployment._id}
                      deployment={deployment}
                      siteName={
                        deployment.provider === "netlify"
                          ? netlifySiteName
                          : undefined
                      }
                      onRefresh={(id) => void onRefresh(id)}
                    />
                  ))}
                  {latest &&
                  (latest.status === "error" || latest.status === "failed") &&
                  latest.provider === "netlify" &&
                  !classifyDeployError(latest.errorMessage) ? (
                    <p className="px-0.5 text-[10px] leading-relaxed text-ws-text-muted">
                      If logs say “Unable to access repository” / “Host key
                      verification failed”, Netlify’s GitHub App can’t read this
                      repo. Authorize it in Netlify, then redeploy.
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-ws-border px-3.5 py-2.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-[11px] text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
              asChild
            >
              <Link href="/projects/integrations">
                <Settings2Icon className="size-3.5" />
                Manage tokens
              </Link>
            </Button>
            {latest?.status === "ready" && latest.url ? (
              <Button
                type="button"
                size="sm"
                className="h-7 rounded-md bg-emerald-500/15 px-2.5 text-[11px] text-emerald-400 hover:bg-emerald-500/25"
                onClick={() =>
                  window.open(latest.url, "_blank", "noopener")
                }
              >
                Open live site
                <ExternalLinkIcon className="size-3" />
              </Button>
            ) : latest &&
              (latest.status === "error" || latest.status === "failed") &&
              (latest.inspectorUrl ||
                (netlifySiteName && latest.provider === "netlify")) ? (
              <Button
                type="button"
                size="sm"
                className="h-7 rounded-md bg-rose-500/15 px-2.5 text-[11px] text-rose-400 hover:bg-rose-500/25"
                onClick={() => {
                  const href =
                    latest.inspectorUrl ||
                    (netlifySiteName
                      ? `${netlifyDeploysUrl(netlifySiteName)}/${encodeURIComponent(latest.externalId)}`
                      : undefined);
                  if (href) window.open(href, "_blank", "noopener");
                }}
              >
                View build logs
                <ExternalLinkIcon className="size-3" />
              </Button>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>

      <ConnectDeployDialog
        provider={connectProvider ?? "netlify"}
        open={connectProvider !== null}
        onOpenChange={(next) => {
          if (!next) setConnectProvider(null);
        }}
        onConnect={async (token, teamId) => {
          if (!connectProvider) return;
          const connection =
            connectProvider === "vercel" ? vercel : netlify;
          await connection.connect(token, teamId);
          await deploy(connectProvider, "production");
        }}
        isConnecting={
          connectProvider === "vercel"
            ? vercel.isConnecting
            : netlify.isConnecting
        }
      />
    </>
  );
}
