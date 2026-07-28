"use client";

import { useUser } from "@clerk/nextjs";
import { ChevronDownIcon, Loader2Icon, PlusIcon, SearchIcon, UserIcon } from "lucide-react";
import { Manrope } from "next/font/google";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AgentBackendSettingsPanel } from "@/features/customize/components/agent-backend-settings";
import { AddMcpServerDialog } from "@/features/customize/components/add-mcp-server-dialog";
import { CustomMcpServersSection } from "@/features/customize/components/custom-mcp-server-row";
import { CustomizeConnectionsProvider } from "@/features/customize/components/customize-connections-provider";
import { CustomizeIcon } from "@/features/customize/components/customize-icon";
import { CustomizeItemRow } from "@/features/customize/components/customize-item-row";
import { CustomizePluginRow } from "@/features/customize/components/customize-plugin-row";
import { CustomizeUserItemsPanel } from "@/features/customize/components/customize-user-items-panel";
import { useUserCustomizeItems } from "@/features/customize/hooks/use-user-customize-items";
import { useUserMcpServers } from "@/features/customize/hooks/use-user-mcp-servers";
import { useUserPlugins } from "@/features/customize/hooks/use-user-plugins";
import type { CustomizeUserItemKind } from "@/features/customize/lib/customize-user-items";
import {
  CUSTOMIZE_CATEGORIES,
  CUSTOMIZE_PLUGINS,
  getInstalledPluginItems,
  getMcpPlugins,
  type CustomizeCategory,
  type CustomizePlugin,
  type CustomizePluginId,
} from "@/features/customize/lib/customize-catalog";
import { useEditorTabs } from "@/features/workspace/hooks/use-editor-tabs";
import { useWorkspaceBreadcrumb } from "@/features/workspace/hooks/use-workspace-breadcrumb";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";

const display = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const CUSTOMIZE_BREADCRUMB = [{ label: "Customize" }] as const;

const USER_ITEM_CATEGORY_KIND: Record<
  "subagents" | "hooks" | "commands",
  CustomizeUserItemKind
> = {
  subagents: "subagent",
  hooks: "hook",
  commands: "command",
};

type WorkspaceCustomizeViewProps = {
  projectId: string;
};

function filterPlugins(plugins: CustomizePlugin[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return plugins;
  return plugins.filter(
    (plugin) =>
      plugin.name.toLowerCase().includes(q) ||
      plugin.publisher.toLowerCase().includes(q) ||
      plugin.description.toLowerCase().includes(q),
  );
}

export function WorkspaceCustomizeView({ projectId }: WorkspaceCustomizeViewProps) {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const { openTab } = useEditorTabs(projectId);
  const { installedIds, ready } = useUserPlugins();
  const {
    servers: customMcpServers,
    ready: mcpReady,
    remove: removeMcpServer,
    setEnabled: setMcpEnabled,
  } = useUserMcpServers();
  const { byKind: userCustomizeByKind } = useUserCustomizeItems();
  const editorTabs = useWorkspaceStore((s) => s.editorTabs);
  const activeEditorTabId = useWorkspaceStore((s) => s.activeEditorTabId);
  const [query, setQuery] = useState("");
  const initialCategory = (() => {
    const raw = searchParams.get("category");
    if (
      raw === "mcps" ||
      raw === "subagents" ||
      raw === "hooks" ||
      raw === "commands" ||
      raw === "rules" ||
      raw === "skills"
    ) {
      return raw as CustomizeCategory;
    }
    return "plugins";
  })();
  const [category, setCategory] = useState<CustomizeCategory>(initialCategory);

  useEffect(() => {
    const raw = searchParams.get("category");
    if (
      raw === "mcps" ||
      raw === "subagents" ||
      raw === "hooks" ||
      raw === "commands" ||
      raw === "rules" ||
      raw === "skills"
    ) {
      setCategory(raw as CustomizeCategory);
    }
  }, [searchParams]);
  const initialView =
    searchParams.get("view") === "marketplace" ? "marketplace" : "installed";
  const [view, setView] = useState<"installed" | "marketplace">(initialView);
  const [expandedPluginId, setExpandedPluginId] =
    useState<CustomizePluginId | null>(null);
  const [mcpDialogOpen, setMcpDialogOpen] = useState(false);

  const activePluginTabId = useMemo(() => {
    const activeTab = editorTabs.find((tab) => tab.id === activeEditorTabId);
    if (activeTab?.kind === "customize" && activeTab.pluginId) {
      return activeTab.pluginId as CustomizePluginId;
    }
    return null;
  }, [activeEditorTabId, editorTabs]);

  useWorkspaceBreadcrumb([...CUSTOMIZE_BREADCRUMB]);

  const userName =
    user?.fullName?.trim() ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "your account";

  const marketplacePlugins = useMemo(
    () => filterPlugins(CUSTOMIZE_PLUGINS, query),
    [query],
  );

  const installedPlugins = useMemo(
    () =>
      filterPlugins(
        CUSTOMIZE_PLUGINS.filter((plugin) => installedIds.has(plugin.id)),
        query,
      ),
    [installedIds, query],
  );

  const listPlugins =
    view === "installed" ? installedPlugins : marketplacePlugins;

  const mcpPlugins = useMemo(
    () => filterPlugins(getMcpPlugins(), query),
    [query],
  );

  const installedSkills = useMemo(
    () => getInstalledPluginItems(installedIds, "skills"),
    [installedIds],
  );

  const installedRules = useMemo(
    () => getInstalledPluginItems(installedIds, "rules"),
    [installedIds],
  );

  const filteredSkills = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return installedSkills;
    return installedSkills.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.pluginName.toLowerCase().includes(q),
    );
  }, [installedSkills, query]);

  const filteredRules = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return installedRules;
    return installedRules.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.pluginName.toLowerCase().includes(q),
    );
  }, [installedRules, query]);

  const openPlugin = (pluginId: string) => {
    setExpandedPluginId(pluginId as CustomizePluginId);
    openTab({ kind: "customize", pluginId });
  };

  const togglePlugin = (pluginId: CustomizePluginId) => {
    setExpandedPluginId((current) => (current === pluginId ? null : pluginId));
  };

  const listCount =
    category === "plugins"
      ? listPlugins.length
      : category === "mcps"
        ? mcpPlugins.length + customMcpServers.length
        : category === "skills"
          ? filteredSkills.length
          : category === "rules"
            ? filteredRules.length + userCustomizeByKind.rule.length
            : category === "subagents"
              ? userCustomizeByKind.subagent.length
              : category === "hooks"
                ? userCustomizeByKind.hook.length
                : category === "commands"
                  ? userCustomizeByKind.command.length
                  : 0;

  return (
    <CustomizeConnectionsProvider>
      <div className="mx-auto w-full max-w-3xl px-6 py-8 md:px-8">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <CustomizeIcon className="size-5 text-ws-accent" strokeWidth={1.75} />
          <h1
            className={cn(
              display.className,
              "text-lg font-semibold tracking-tight text-ws-accent",
            )}
          >
            Customize
          </h1>
        </div>
      </header>

      <div className="mb-4 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ws-text-muted" />
          <Input
            id="customize-plugin-search"
            name="customize-plugin-search"
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-1p-ignore
            data-lpignore="true"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              category === "plugins" || category === "mcps"
                ? "Search plugins…"
                : "Search customize items…"
            }
            aria-label={
              category === "plugins" || category === "mcps"
                ? "Search plugins"
                : "Search customize items"
            }
            className="h-9 border-ws-border-subtle bg-ws-panel pl-8 text-[12px] shadow-none"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-9 shrink-0 rounded-full border-ws-border-subtle px-4 text-[12px]",
            view === "marketplace"
              ? "bg-ws-hover text-ws-text"
              : "bg-ws-bg text-ws-text hover:bg-ws-hover",
          )}
          onClick={() =>
            setView((current) =>
              current === "installed" ? "marketplace" : "installed",
            )
          }
        >
          {view === "installed" ? "Browse Marketplace" : "Installed"}
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-ws-border-subtle bg-ws-panel px-3 text-[11px] text-ws-text hover:bg-ws-hover"
        >
          <UserIcon className="size-3.5 text-ws-text-muted" />
          <span className="max-w-40 truncate">{userName}</span>
          <ChevronDownIcon className="size-3 text-ws-text-muted" />
        </button>

        {CUSTOMIZE_CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCategory(item.id)}
            className={cn(
              "h-8 rounded-full border px-3 text-[11px] font-medium transition-colors",
              category === item.id
                ? "border-ws-border-strong bg-ws-hover text-ws-text"
                : "border-transparent text-ws-text-muted hover:border-ws-border-subtle hover:bg-ws-hover/60 hover:text-ws-text",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {category === "plugins" || category === "mcps" ? (
        <>
          {category === "mcps" ? (
            <div className="mb-4 space-y-4">
              <AgentBackendSettingsPanel />
              <CustomMcpServersSection
                servers={customMcpServers}
                ready={mcpReady}
                onRemove={removeMcpServer}
                onToggleEnabled={setMcpEnabled}
                onAdd={() => setMcpDialogOpen(true)}
              />
            </div>
          ) : null}
        <section className="overflow-hidden rounded-xl border border-ws-border-subtle bg-ws-panel/40">
          <div className="flex items-center justify-between border-b border-ws-border-subtle px-4 py-3">
            <p className="text-[12px] text-ws-text-muted">
              {category === "mcps" ? "Catalog MCPs" : view === "installed" ? "Installed" : "Marketplace"}{" "}
              {!ready ? (
                <Loader2Icon className="ml-1 inline size-3 animate-spin" />
              ) : (
                <span className="text-ws-text">{listCount}</span>
              )}
            </p>
            <div className="flex items-center gap-2">
              {category === "plugins" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-full border-ws-border-subtle bg-transparent px-3 text-[11px]"
                  onClick={() => setView("marketplace")}
                >
                  <PlusIcon className="size-3" />
                  Add
                </Button>
              ) : category === "mcps" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-full border-ws-border-subtle bg-transparent px-3 text-[11px]"
                  onClick={() => setMcpDialogOpen(true)}
                >
                  <PlusIcon className="size-3" />
                  Add MCP
                </Button>
              ) : null}
            </div>
          </div>

          {view === "marketplace" && category === "plugins" ? (
            <div className="border-b border-ws-border-subtle px-4 py-2">
              <p className="text-[11px] text-ws-text-muted">
                Install integrations to extend NovaStudio AI. Connect your account
                on each plugin page.
              </p>
            </div>
          ) : null}

          <ul className="group/list">
            {(category === "mcps" ? mcpPlugins : listPlugins).map(
              (plugin, index, arr) => (
                <li key={plugin.id}>
                  <CustomizePluginRow
                    plugin={plugin}
                    expanded={expandedPluginId === plugin.id}
                    isActiveTab={activePluginTabId === plugin.id}
                    onToggle={() => togglePlugin(plugin.id)}
                    onOpenDetails={() => openPlugin(plugin.id)}
                    onTryInChat={() => openTab({ kind: "welcome" })}
                    showInstallAction={view === "marketplace"}
                  />
                  {index < arr.length - 1 ? (
                    <div className="mx-4 border-b border-ws-border-subtle" />
                  ) : null}
                </li>
              ),
            )}
          </ul>

          {listCount === 0 ? (
            <div className="px-4 py-10 text-center text-[12px] text-ws-text-muted">
              {!ready
                ? "Loading plugins…"
                : view === "installed"
                  ? (
                      <div className="space-y-3">
                        <p>No plugins installed yet. Browse the marketplace to add one.</p>
                        <Button
                          type="button"
                          size="sm"
                          className="h-7 bg-ws-accent px-3 text-[11px] text-white hover:bg-ws-accent-hover"
                          onClick={() => setView("marketplace")}
                        >
                          <PlusIcon className="size-3.5" />
                          Browse marketplace
                        </Button>
                      </div>
                    )
                  : "No plugins match your search."}
            </div>
          ) : null}
        </section>
        </>
      ) : category === "skills" ? (
        <section className="overflow-hidden rounded-xl border border-ws-border-subtle bg-ws-panel/40">
          <div className="border-b border-ws-border-subtle px-4 py-3">
            <p className="text-[12px] text-ws-text-muted">
              Skills{" "}
              <span className="text-ws-text">{listCount}</span>
              <span className="ml-2 text-[11px]">
                from installed plugins
              </span>
            </p>
          </div>
          <div className="space-y-2 p-3">
            {filteredSkills.map((item) => (
              <CustomizeItemRow
                key={`${item.pluginId}-${item.id}`}
                item={item}
                variant="skill"
              />
            ))}
          </div>
          {filteredSkills.length === 0 ? (
            <div className="px-4 py-10 text-center text-[12px] text-ws-text-muted">
              Install a plugin to see its skills.
            </div>
          ) : null}
        </section>
      ) : category === "rules" ? (
        <div className="space-y-4">
          <CustomizeUserItemsPanel
            projectId={projectId}
            kind="rule"
            query={query}
          />
          <section className="overflow-hidden rounded-xl border border-ws-border-subtle bg-ws-panel/40">
            <div className="border-b border-ws-border-subtle px-4 py-3">
              <p className="text-[12px] text-ws-text-muted">
                Plugin rules{" "}
                <span className="text-ws-text">{filteredRules.length}</span>
                <span className="ml-2 text-[11px]">from installed plugins</span>
              </p>
            </div>
            <div className="space-y-2 p-3">
              {filteredRules.map((item) => (
                <CustomizeItemRow
                  key={`${item.pluginId}-${item.id}`}
                  item={item}
                  variant="rule"
                />
              ))}
            </div>
            {filteredRules.length === 0 ? (
              <div className="px-4 py-10 text-center text-[12px] text-ws-text-muted">
                Install a plugin to see its rules.
              </div>
            ) : null}
          </section>
        </div>
      ) : category === "subagents" ||
        category === "hooks" ||
        category === "commands" ? (
        <CustomizeUserItemsPanel
          projectId={projectId}
          kind={USER_ITEM_CATEGORY_KIND[category]}
          query={query}
        />
      ) : (
        <section className="rounded-xl border border-dashed border-ws-border-subtle px-6 py-12 text-center">
          <p className="text-[13px] font-medium text-ws-text">
            {CUSTOMIZE_CATEGORIES.find((item) => item.id === category)?.label}{" "}
            coming soon
          </p>
          <p className="mt-1 text-[12px] text-ws-text-muted">
            Manage {category} from this panel in a future update.
          </p>
        </section>
      )}
      </div>
      <AddMcpServerDialog open={mcpDialogOpen} onOpenChange={setMcpDialogOpen} />
    </CustomizeConnectionsProvider>
  );
}
