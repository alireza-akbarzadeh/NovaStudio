"use client";

import {
  BlocksIcon,
  CheckIcon,
  Loader2Icon,
  PuzzleIcon,
  Trash2Icon,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserExtensions } from "@/features/extensions/hooks/use-user-extensions";
import type { ExtensionCatalogEntry } from "@/features/extensions/lib/types";
import { cn } from "@/lib/utils";

type Tab = "installed" | "marketplace";
type CategoryFilter = "all" | "theme" | "language";

export function WorkspaceExtensionsPanel() {
  const {
    ready,
    installById,
    activeThemeId,
    catalog,
    install: installExtension,
    uninstall,
    setEnabled,
    activateTheme,
  } = useUserExtensions();

  const [tab, setTab] = useState<Tab>("marketplace");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const installedEntries = useMemo(() => {
    return catalog.filter((entry) => installById.has(entry.id));
  }, [catalog, installById]);

  const filterEntry = (entry: ExtensionCatalogEntry) => {
    if (category !== "all" && entry.category !== category) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      entry.name.toLowerCase().includes(q) ||
      entry.description.toLowerCase().includes(q) ||
      entry.id.toLowerCase().includes(q) ||
      entry.category.toLowerCase().includes(q)
    );
  };

  const marketplaceEntries = useMemo(
    () => catalog.filter(filterEntry),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filterEntry closes over query/category
    [catalog, query, category],
  );

  const installedFiltered = useMemo(
    () => installedEntries.filter(filterEntry),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [installedEntries, query, category],
  );

  const runBusy = async (id: string, action: () => Promise<void>) => {
    setBusyId(id);
    try {
      await action();
    } finally {
      setBusyId(null);
    }
  };

  const list =
    tab === "installed" ? installedFiltered : marketplaceEntries;

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 space-y-2 border-b border-ws-border-subtle bg-ws-panel px-2 py-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search extensions"
          className="h-7 border-ws-border-subtle bg-ws-bg text-[12px]"
        />
        <div className="flex gap-1">
          {(
            [
              ["marketplace", "Marketplace"],
              ["installed", "Installed"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "h-6 flex-1 rounded-md text-[11px] font-medium transition-colors",
                tab === id
                  ? "bg-ws-accent/15 text-ws-accent"
                  : "text-ws-text-muted hover:bg-ws-hover hover:text-ws-text",
              )}
            >
              {label}
              {id === "installed" && ready
                ? ` (${installedEntries.length})`
                : null}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(
            [
              ["all", "All"],
              ["theme", "Themes"],
              ["language", "Languages"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setCategory(id)}
              className={cn(
                "h-5 rounded px-1.5 text-[10px] font-medium transition-colors",
                category === id
                  ? "bg-ws-hover text-ws-text"
                  : "text-ws-text-muted hover:text-ws-text",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-1 py-1">
        {!ready ? (
          <div className="flex items-center justify-center gap-2 py-10 text-[12px] text-ws-text-muted">
            <Loader2Icon className="size-3.5 animate-spin" />
            Loading extensions…
          </div>
        ) : list.length === 0 ? (
          <EmptyState tab={tab} hasQuery={query.trim().length > 0} />
        ) : (
          <ul className="space-y-0.5">
            {list.map((entry) => {
              const row = installById.get(entry.id);
              const installed = Boolean(row);
              const enabled = row?.enabled ?? false;
              const isActiveTheme =
                entry.category === "theme" && activeThemeId === entry.id;
              const busy = busyId === entry.id;

              return (
                <li
                  key={entry.id}
                  className="rounded-md px-2 py-2 hover:bg-ws-hover/60"
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-ws-bg text-ws-accent">
                      {entry.category === "theme" ? (
                        <BlocksIcon className="size-3.5" strokeWidth={1.75} />
                      ) : (
                        <PuzzleIcon className="size-3.5" strokeWidth={1.75} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-[12px] font-medium text-ws-text">
                          {entry.name}
                        </p>
                        {isActiveTheme ? (
                          <span className="rounded bg-ws-accent/15 px-1 text-[9px] font-semibold uppercase tracking-wide text-ws-accent">
                            Active
                          </span>
                        ) : null}
                        {installed &&
                        entry.category === "language" &&
                        enabled ? (
                          <span className="rounded bg-emerald-500/15 px-1 text-[9px] font-semibold uppercase tracking-wide text-emerald-400">
                            On
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-ws-text-muted">
                        {entry.description}
                      </p>
                      <p className="mt-1 text-[10px] text-ws-text-muted">
                        {entry.author} · v{entry.version} · {entry.category}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {!installed ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-6 px-2 text-[11px]"
                            disabled={busy}
                            onClick={() =>
                              void runBusy(entry.id, () =>
                                installExtension(entry.id),
                              )
                            }
                          >
                            {busy ? (
                              <Loader2Icon className="size-3 animate-spin" />
                            ) : (
                              "Install"
                            )}
                          </Button>
                        ) : (
                          <>
                            {entry.category === "theme" && !isActiveTheme ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="h-6 px-2 text-[11px]"
                                disabled={busy}
                                onClick={() =>
                                  void runBusy(entry.id, () =>
                                    activateTheme(entry.id),
                                  )
                                }
                              >
                                Activate
                              </Button>
                            ) : null}
                            {entry.category === "theme" && isActiveTheme ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-[11px] text-ws-text-muted"
                                disabled={busy}
                                onClick={() =>
                                  void runBusy(entry.id, () =>
                                    setEnabled(entry.id, false),
                                  )
                                }
                              >
                                <CheckIcon className="mr-1 size-3" />
                                Active
                              </Button>
                            ) : null}
                            {entry.category === "language" ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="h-6 px-2 text-[11px]"
                                disabled={busy}
                                onClick={() =>
                                  void runBusy(entry.id, () =>
                                    setEnabled(entry.id, !enabled),
                                  )
                                }
                              >
                                {enabled ? "Disable" : "Enable"}
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-[11px] text-ws-text-muted hover:text-red-400"
                              disabled={busy}
                              onClick={() =>
                                void runBusy(entry.id, () =>
                                  uninstall(entry.id),
                                )
                              }
                            >
                              <Trash2Icon className="size-3" />
                              <span className="sr-only">Uninstall</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  tab,
  hasQuery,
}: {
  tab: Tab;
  hasQuery: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <PuzzleIcon className="size-6 text-ws-text-muted" strokeWidth={1.5} />
      <p className="text-[12px] font-medium text-ws-text">
        {hasQuery
          ? "No matching extensions"
          : tab === "installed"
            ? "No extensions installed"
            : "No extensions"}
      </p>
      <p className="max-w-[220px] text-[11px] leading-snug text-ws-text-muted">
        {tab === "installed" && !hasQuery
          ? "Browse the Marketplace tab to install themes and language packs. They sync to your account."
          : "Try a different search or category."}
      </p>
    </div>
  );
}
