"use client";

import { PackageIcon } from "lucide-react";
import { Manrope } from "next/font/google";
import Link from "next/link";
import { useMemo, useState } from "react";

import { CustomizeConnectionsProvider } from "@/features/customize/components/customize-connections-provider";
import { CustomizeItemRow } from "@/features/customize/components/customize-item-row";
import { CustomizePluginActions } from "@/features/customize/components/customize-plugin-actions";
import { CustomizePluginIcon } from "@/features/customize/components/customize-plugin-icon";
import { usePluginConnectionFromContext } from "@/features/customize/components/customize-connections-provider";
import { useUserPlugins } from "@/features/customize/hooks/use-user-plugins";
import {
  getCustomizePlugin,
  pluginNeedsConnect,
} from "@/features/customize/lib/customize-catalog";
import { useEditorTabs } from "@/features/workspace/hooks/use-editor-tabs";
import { useWorkspaceBreadcrumb } from "@/features/workspace/hooks/use-workspace-breadcrumb";
import { cn } from "@/lib/utils";

const display = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const PREVIEW_COUNT = 5;

type WorkspaceCustomizePluginViewProps = {
  projectId: string;
  pluginId: string;
};

export function WorkspaceCustomizePluginView({
  projectId,
  pluginId,
}: WorkspaceCustomizePluginViewProps) {
  const plugin = getCustomizePlugin(pluginId);
  const { openTab } = useEditorTabs(projectId);
  const { installedIds } = useUserPlugins();
  const [skillsExpanded, setSkillsExpanded] = useState(false);
  const [rulesExpanded, setRulesExpanded] = useState(false);

  useWorkspaceBreadcrumb(
    plugin
      ? [
          { label: "Marketplace", href: `/projects/${projectId}/customize` },
          { label: plugin.name },
        ]
      : [{ label: "Marketplace", href: `/projects/${projectId}/customize` }],
  );

  if (!plugin) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-8 md:px-8">
        <p className="text-[13px] text-ws-text-muted">Plugin not found.</p>
        <Link
          href={`/projects/${projectId}/customize`}
          className="mt-3 inline-block text-[12px] text-ws-accent hover:underline"
        >
          Back to Customize
        </Link>
      </div>
    );
  }

  return (
    <CustomizeConnectionsProvider>
      <WorkspaceCustomizePluginDetail
        projectId={projectId}
        plugin={plugin}
        installedIds={installedIds}
        openTab={openTab}
        skillsExpanded={skillsExpanded}
        setSkillsExpanded={setSkillsExpanded}
        rulesExpanded={rulesExpanded}
        setRulesExpanded={setRulesExpanded}
      />
    </CustomizeConnectionsProvider>
  );
}

function WorkspaceCustomizePluginDetail({
  projectId,
  plugin,
  installedIds,
  openTab,
  skillsExpanded,
  setSkillsExpanded,
  rulesExpanded,
  setRulesExpanded,
}: {
  projectId: string;
  plugin: NonNullable<ReturnType<typeof getCustomizePlugin>>;
  installedIds: Set<string>;
  openTab: ReturnType<typeof useEditorTabs>["openTab"];
  skillsExpanded: boolean;
  setSkillsExpanded: (value: boolean) => void;
  rulesExpanded: boolean;
  setRulesExpanded: (value: boolean) => void;
}) {
  const { isConnected } = usePluginConnectionFromContext(plugin.id);
  const isInstalled = installedIds.has(plugin.id);
  const needsConnect = pluginNeedsConnect(plugin);

  const visibleSkills = useMemo(() => {
    return skillsExpanded
      ? plugin.skills
      : plugin.skills.slice(0, PREVIEW_COUNT);
  }, [plugin, skillsExpanded]);

  const visibleRules = useMemo(() => {
    return rulesExpanded ? plugin.rules : plugin.rules.slice(0, PREVIEW_COUNT);
  }, [plugin, rulesExpanded]);

  const hiddenSkills = Math.max(0, plugin.skills.length - PREVIEW_COUNT);
  const hiddenRules = Math.max(0, plugin.rules.length - PREVIEW_COUNT);

  const statusLabel = !isInstalled
    ? "Not installed"
    : needsConnect
      ? isConnected
        ? "Connected"
        : "Install · connect account"
      : "Installed";

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8 md:px-8">
      <nav className="mb-4 text-[11px] text-ws-text-muted">
        <Link
          href={`/projects/${projectId}/customize`}
          className="hover:text-ws-text"
        >
          Marketplace
        </Link>
        <span className="mx-1.5">›</span>
        <span className="text-ws-text-secondary">{plugin.name}</span>
      </nav>

      <header className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <CustomizePluginIcon pluginId={plugin.id} />
            <div className="min-w-0">
              <h1
                className={cn(
                  display.className,
                  "text-xl font-semibold tracking-tight text-ws-text",
                )}
              >
                {plugin.name}
              </h1>
              <p className="mt-2 max-w-2xl text-[12px] leading-relaxed text-ws-text-muted">
                {plugin.description}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-ws-text-muted">
                  <PackageIcon className="size-3.5" />
                  {plugin.publisher}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    isInstalled && (!needsConnect || isConnected)
                      ? "bg-emerald-500/15 text-emerald-400"
                      : isInstalled
                        ? "bg-amber-500/15 text-amber-400"
                        : "bg-ws-hover text-ws-text-muted",
                  )}
                >
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>

          <CustomizePluginActions
            plugin={plugin}
            onTryInChat={() => openTab({ kind: "welcome" })}
          />
        </div>
      </header>

      <section className="mb-8">
        <div className="mb-3 flex items-baseline gap-2">
          <h2
            className={cn(
              display.className,
              "text-sm font-semibold tracking-tight text-ws-text",
            )}
          >
            Skills
          </h2>
          <span className="text-[12px] text-ws-text-muted">
            {plugin.skills.length}
          </span>
        </div>
        <div className="space-y-2">
          {visibleSkills.map((item) => (
            <CustomizeItemRow key={item.id} item={item} variant="skill" />
          ))}
        </div>
        {!skillsExpanded && hiddenSkills > 0 ? (
          <button
            type="button"
            onClick={() => setSkillsExpanded(true)}
            className="mt-3 text-[11px] text-ws-text-muted hover:text-ws-text"
          >
            View {hiddenSkills} More
          </button>
        ) : null}
      </section>

      <section>
        <div className="mb-3 flex items-baseline gap-2">
          <h2
            className={cn(
              display.className,
              "text-sm font-semibold tracking-tight text-ws-text",
            )}
          >
            Rules
          </h2>
          <span className="text-[12px] text-ws-text-muted">
            {plugin.rules.length}
          </span>
        </div>
        <div className="space-y-2">
          {visibleRules.map((item) => (
            <CustomizeItemRow key={item.id} item={item} variant="rule" />
          ))}
        </div>
        {!rulesExpanded && hiddenRules > 0 ? (
          <button
            type="button"
            onClick={() => setRulesExpanded(true)}
            className="mt-3 text-[11px] text-ws-text-muted hover:text-ws-text"
          >
            View {hiddenRules} More
          </button>
        ) : null}
      </section>
    </div>
  );
}
