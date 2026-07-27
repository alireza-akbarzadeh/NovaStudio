"use client";

import {
  Loader2Icon,
  PackageIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOptionalWebContainer } from "@/features/workspace/components/webcontainer-provider";
import {
  useProjectFile,
  useProjectFileMetadata,
} from "@/features/workspace/hooks/use-project-files";
import {
  searchNpmPackages,
  type NpmSearchHit,
} from "@/features/workspace/lib/npm-search";
import {
  parsePackageDependencies,
  type PackageDependency,
} from "@/features/workspace/lib/terminal/package-json";
import { resolvePackageJson } from "@/features/workspace/lib/terminal/package-scripts";
import {
  addPackageCommandLine,
  removePackageCommandLine,
} from "@/features/workspace/lib/webcontainer/package-manager";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";

type WorkspaceDependenciesPanelProps = {
  projectId: string;
};

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export function WorkspaceDependenciesPanel({
  projectId,
}: WorkspaceDependenciesPanelProps) {
  const metadata = useProjectFileMetadata(projectId);
  const packageJsonPath = useMemo(() => {
    if (!metadata) return null;
    return resolvePackageJson(metadata, "/")?.path ?? null;
  }, [metadata]);
  const packageJsonFile = useProjectFile(projectId, packageJsonPath ?? "");
  const webcontainer = useOptionalWebContainer();
  const requestTerminalCommand = useWorkspaceStore(
    (s) => s.requestTerminalCommand,
  );

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 280);
  const [npmHits, setNpmHits] = useState<NpmSearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const pm = webcontainer?.packageManager ?? "npm";
  const ready = webcontainer?.ready ?? false;

  const { dependencies } = useMemo(() => {
    if (!packageJsonPath || !packageJsonFile?.content) {
      return { dependencies: [] as PackageDependency[] };
    }
    return {
      dependencies: parsePackageDependencies(packageJsonFile.content),
    };
  }, [packageJsonFile?.content, packageJsonPath]);

  const installedNames = useMemo(
    () => new Set(dependencies.map((d) => d.name)),
    [dependencies],
  );

  const filteredInstalled = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return dependencies;
    return dependencies.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.version.toLowerCase().includes(q),
    );
  }, [dependencies, query]);

  const prodDeps = filteredInstalled.filter((d) => d.kind === "dependencies");
  const devDeps = filteredInstalled.filter(
    (d) => d.kind === "devDependencies",
  );

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (q.length < 2) {
      setNpmHits([]);
      setSearchError(null);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    setSearching(true);
    setSearchError(null);

    void searchNpmPackages(q, { signal: controller.signal })
      .then((hits) => {
        setNpmHits(hits);
        setSearching(false);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setNpmHits([]);
        setSearching(false);
        setSearchError(
          error instanceof Error ? error.message : "Search failed",
        );
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  const runPackageCommand = (command: string, label: string) => {
    if (!ready) {
      toast.error("WebContainer is not ready", {
        description: "Wait for Node: ready in the status bar, then retry.",
      });
      return;
    }
    toast.message(label, { description: `Running \`${command}\`` });
    requestTerminalCommand(command);
  };

  const onAdd = (name: string, dev?: boolean) => {
    const command = addPackageCommandLine(pm, name, { dev });
    runPackageCommand(
      command,
      dev ? `Add ${name} (dev)` : `Add ${name}`,
    );
  };

  const onRemove = (dep: PackageDependency) => {
    const command = removePackageCommandLine(pm, dep.name);
    runPackageCommand(command, `Remove ${dep.name}`);
  };

  if (metadata === undefined) {
    return (
      <div className="flex items-center gap-2 px-3 py-5 text-[11px] text-ws-text-muted">
        <Loader2Icon className="size-3.5 animate-spin" />
        Loading project files…
      </div>
    );
  }

  if (!packageJsonPath) {
    return (
      <div className="px-3 py-5">
        <p className="text-[12px] font-medium text-ws-text">No package.json</p>
        <p className="mt-1 text-[11px] text-ws-text-muted">
          Add a package.json to manage dependencies, or scaffold with{" "}
          <code className="text-ws-text">npx create-next-app</code> in the
          terminal.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-ws-border-subtle p-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search installed or npm…"
          className="h-7 border-ws-border-subtle bg-ws-bg text-[12px]"
          aria-label="Search dependencies"
        />
        <p className="mt-1.5 px-0.5 text-[10px] text-ws-text-muted">
          {ready
            ? `Using ${pm} · installs run in the terminal`
            : "Node runtime not ready — add/remove disabled"}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <DepSection title="Dependencies" count={prodDeps.length}>
          {prodDeps.length === 0 ? (
            <EmptyRows
              text={
                query.trim()
                  ? "No matching dependencies"
                  : "No production dependencies"
              }
            />
          ) : (
            prodDeps.map((dep) => (
              <InstalledRow
                key={`${dep.kind}:${dep.name}`}
                dep={dep}
                disabled={!ready}
                onRemove={() => onRemove(dep)}
              />
            ))
          )}
        </DepSection>

        <DepSection title="Dev Dependencies" count={devDeps.length}>
          {devDeps.length === 0 ? (
            <EmptyRows
              text={
                query.trim()
                  ? "No matching dev dependencies"
                  : "No dev dependencies"
              }
            />
          ) : (
            devDeps.map((dep) => (
              <InstalledRow
                key={`${dep.kind}:${dep.name}`}
                dep={dep}
                disabled={!ready}
                onRemove={() => onRemove(dep)}
              />
            ))
          )}
        </DepSection>

        {debouncedQuery.trim().length >= 2 ? (
          <DepSection
            title="npm Registry"
            count={npmHits.length}
            trailing={
              searching ? (
                <Loader2Icon className="size-3 animate-spin text-ws-text-muted" />
              ) : null
            }
          >
            {searchError ? (
              <EmptyRows text={searchError} />
            ) : searching && npmHits.length === 0 ? (
              <EmptyRows text="Searching npm…" />
            ) : npmHits.length === 0 ? (
              <EmptyRows text="No packages found" />
            ) : (
              npmHits.map((hit) => (
                <NpmHitRow
                  key={hit.name}
                  hit={hit}
                  installed={installedNames.has(hit.name)}
                  disabled={!ready}
                  onAdd={() => onAdd(hit.name)}
                  onAddDev={() => onAdd(hit.name, true)}
                />
              ))
            )}
          </DepSection>
        ) : null}
      </div>
    </div>
  );
}

function DepSection({
  title,
  count,
  trailing,
  children,
}: {
  title: string;
  count: number;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-ws-border-subtle last:border-b-0">
      <div className="flex h-7 items-center gap-2 px-3">
        <span className="text-[10px] font-semibold tracking-wide text-ws-text-muted uppercase">
          {title}
        </span>
        <span className="text-[10px] text-ws-text-muted">{count}</span>
        {trailing}
      </div>
      <ul className="pb-1">{children}</ul>
    </section>
  );
}

function EmptyRows({ text }: { text: string }) {
  return (
    <li className="px-3 py-2 text-[11px] text-ws-text-muted">{text}</li>
  );
}

function InstalledRow({
  dep,
  disabled,
  onRemove,
}: {
  dep: PackageDependency;
  disabled: boolean;
  onRemove: () => void;
}) {
  return (
    <li className="group flex items-center gap-1 px-1.5">
      <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-sm px-1.5 py-1">
        <PackageIcon className="size-3.5 shrink-0 text-ws-text-muted" />
        <span className="min-w-0 flex-1 truncate text-[12px] text-ws-text">
          {dep.name}
        </span>
        <span className="shrink-0 text-[10px] text-ws-text-muted">
          {dep.version}
        </span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={disabled}
        title={`Remove ${dep.name}`}
        aria-label={`Remove ${dep.name}`}
        onClick={onRemove}
        className={cn(
          "size-6 shrink-0 text-ws-text-muted opacity-0 group-hover:opacity-100 hover:text-ws-danger-soft focus-visible:opacity-100",
          disabled && "opacity-40",
        )}
      >
        <Trash2Icon className="size-3.5" />
      </Button>
    </li>
  );
}

function NpmHitRow({
  hit,
  installed,
  disabled,
  onAdd,
  onAddDev,
}: {
  hit: NpmSearchHit;
  installed: boolean;
  disabled: boolean;
  onAdd: () => void;
  onAddDev: () => void;
}) {
  return (
    <li className="px-2 py-1.5">
      <div className="flex items-start gap-2">
        <PackageIcon className="mt-0.5 size-3.5 shrink-0 text-ws-text-muted" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="truncate text-[12px] font-medium text-ws-text">
              {hit.name}
            </span>
            <span className="shrink-0 text-[10px] text-ws-text-muted">
              {hit.version}
            </span>
          </div>
          {hit.description ? (
            <p className="mt-0.5 line-clamp-2 text-[10px] text-ws-text-muted">
              {hit.description}
            </p>
          ) : null}
          <div className="mt-1.5 flex flex-wrap gap-1">
            {installed ? (
              <span className="rounded-sm bg-ws-hover px-1.5 py-0.5 text-[10px] text-ws-text-muted">
                Installed
              </span>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={onAdd}
                  className="h-6 gap-1 px-1.5 text-[10px] text-ws-text"
                >
                  <PlusIcon className="size-3" />
                  Add
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={onAddDev}
                  className="h-6 px-1.5 text-[10px] text-ws-text-muted"
                >
                  Add as dev
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
