"use client";

import {
  ClipboardPasteIcon,
  CloudDownloadIcon,
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useAction, useConvexAuth, useQuery } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useDeployConnection } from "@/features/deploy/hooks/use-deploy-connection";
import {
  useCreateProjectFile,
  useProjectFile,
  useProjectFileMetadata,
  useUpdateProjectFileContent,
} from "@/features/workspace/hooks/use-project-files";
import {
  loadFileContentDraft,
  saveFileContentDraft,
} from "@/features/workspace/lib/file-content-drafts";
import {
  listEnvFilePaths,
  mergeEnvEntries,
  parseEnvBulk,
  serializeEnvEntries,
} from "@/features/workspace/lib/parse-env-file";
import { cn } from "@/lib/utils";
import { useOptionalPreviewServer } from "@/features/workspace/components/preview-server-provider";

type WorkspaceEnvPanelProps = {
  projectId: string;
};

const DEFAULT_ENV_FILES = [".env.local", ".env", ".env.development"];

type EnvRow = {
  key: string;
  value: string;
  id: string;
};

type DeployEnvPullResult =
  | {
      ok: true;
      variables: Array<{ key: string; value: string }>;
      projectName: string;
    }
  | {
      ok: false;
      reason: "not_connected" | "no_target" | "provider_error";
      message?: string;
    };

function rowsFromContent(content: string, filePath: string): EnvRow[] {
  return parseEnvBulk(content, filePath).map((entry, index) => ({
    key: entry.key,
    value: entry.value,
    id: `${entry.key}:${index}`,
  }));
}

function rowsToEntries(rows: EnvRow[]) {
  return rows
    .filter((row) => row.key.trim())
    .map((row) => ({ key: row.key.trim(), value: row.value }));
}

function entriesToRows(
  entries: Array<{ key: string; value: string }>,
): EnvRow[] {
  return entries.map((entry, index) => ({
    key: entry.key,
    value: entry.value,
    id: `${entry.key}:${index}:${Date.now()}`,
  }));
}

export function WorkspaceEnvPanel({ projectId }: WorkspaceEnvPanelProps) {
  const { isAuthenticated } = useConvexAuth();
  const metadata = useProjectFileMetadata(projectId);
  const createFile = useCreateProjectFile();
  const updateContent = useUpdateProjectFileContent();
  const previewServer = useOptionalPreviewServer();
  const pasteRef = useRef<HTMLTextAreaElement>(null);
  const pullVercelEnv = useAction(api.deployActions.pullVercelEnv);
  const pullNetlifyEnv = useAction(api.deployActions.pullNetlifyEnv);
  const { isConnected: isVercelConnected } = useDeployConnection("vercel");
  const { isConnected: isNetlifyConnected } = useDeployConnection("netlify");
  const vercelTarget = useQuery(
    api.deploy.getProjectTarget,
    isAuthenticated
      ? {
          projectId: projectId as Id<"projects">,
          provider: "vercel" as const,
        }
      : "skip",
  );
  const netlifyTarget = useQuery(
    api.deploy.getProjectTarget,
    isAuthenticated
      ? {
          projectId: projectId as Id<"projects">,
          provider: "netlify" as const,
        }
      : "skip",
  );
  const [importingFromVercel, setImportingFromVercel] = useState(false);
  const [importingFromNetlify, setImportingFromNetlify] = useState(false);

  const envPaths = useMemo(() => {
    if (!metadata) return [];
    const paths = metadata
      .filter((file) => file.kind === "file")
      .map((file) => file.path);
    const existing = listEnvFilePaths(paths);
    return existing.length > 0 ? existing : [".env.local"];
  }, [metadata]);

  const [selectedPath, setSelectedPath] = useState(".env.local");
  const [rows, setRows] = useState<EnvRow[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [hiddenValues, setHiddenValues] = useState<Set<string>>(new Set());
  const [pasteText, setPasteText] = useState("");
  const [importOpen, setImportOpen] = useState(true);
  const effectivePath = envPaths.includes(selectedPath)
    ? selectedPath
    : (envPaths[0] ?? ".env.local");

  const parsedPreviewCount = useMemo(() => {
    if (!pasteText.trim()) return null;
    return parseEnvBulk(pasteText, effectivePath).length;
  }, [pasteText, effectivePath]);

  const envFile = useProjectFile(projectId, effectivePath);
  const fileExists = Boolean(
    metadata?.some(
      (file) => file.kind === "file" && file.path === effectivePath,
    ),
  );

  useEffect(() => {
    if (!fileExists) {
      setRows([]);
      setDirty(false);
      return;
    }

    const draft = loadFileContentDraft(projectId, effectivePath);
    const serverContent =
      envFile && envFile.kind === "file" ? (envFile.content ?? "") : "";
    const content =
      draft && draft.updatedAt >= (envFile?.updatedAt ?? 0)
        ? draft.content
        : serverContent;
    setRows(rowsFromContent(content, effectivePath));
    setDirty(false);
  }, [envFile, fileExists, projectId, effectivePath]);

  const onSave = async () => {
    const valid = rowsToEntries(rows);
    const seen = new Set<string>();
    for (const row of valid) {
      if (seen.has(row.key)) {
        toast.error("Duplicate key", { description: row.key });
        return;
      }
      seen.add(row.key);
    }

    const content = serializeEnvEntries(valid);

    setSaving(true);
    try {
      if (!fileExists) {
        await createFile({
          projectId: projectId as Id<"projects">,
          name: effectivePath,
          kind: "file",
          content,
        });
      } else {
        saveFileContentDraft(projectId, effectivePath, content);
        await updateContent({
          projectId: projectId as Id<"projects">,
          path: effectivePath,
          content,
        });
      }
      setDirty(false);
      toast.success("Environment saved", {
        description: `${effectivePath} · ${valid.length} variable${valid.length === 1 ? "" : "s"}`,
      });
      if (previewServer?.hot) {
        previewServer.restart();
        toast.message("Preview restarted", {
          description: "Dev server reloaded with updated environment variables.",
        });
      }
    } catch (error) {
      toast.error("Save failed", {
        description:
          error instanceof Error ? error.message : "Could not save env file.",
      });
    } finally {
      setSaving(false);
    }
  };

  const onCreateEnvFile = async (path: string) => {
    if (metadata?.some((file) => file.path === path)) {
      setSelectedPath(path);
      return;
    }

    setCreating(true);
    try {
      await createFile({
        projectId: projectId as Id<"projects">,
        name: path,
        kind: "file",
        content: "",
      });
      setSelectedPath(path);
      toast.success("Created env file", { description: path });
    } catch (error) {
      toast.error("Could not create file", {
        description:
          error instanceof Error ? error.message : "Create failed.",
      });
    } finally {
      setCreating(false);
    }
  };

  const onImportPaste = (mode: "merge" | "replace") => {
    const imported = parseEnvBulk(pasteText, effectivePath);
    if (imported.length === 0) {
      toast.error("No variables found", {
        description:
          "Paste KEY=VALUE lines from a .env file (one per line or space-separated).",
      });
      return;
    }

    applyImportedEntries(imported, mode);
    setPasteText("");
  };

  const applyImportedEntries = (
    imported: Array<{ key: string; value: string }>,
    mode: "merge" | "replace",
  ) => {
    const merged =
      mode === "replace"
        ? imported.map((entry) => ({ key: entry.key, value: entry.value }))
        : mergeEnvEntries(rowsToEntries(rows), imported);

    setRows(entriesToRows(merged));
    setDirty(true);
    toast.success(`Imported ${imported.length} variable${imported.length === 1 ? "" : "s"}`, {
      description:
        mode === "merge"
          ? `Merged into ${effectivePath} — click Save to persist.`
          : `Replaced rows in ${effectivePath} — click Save to persist.`,
    });
  };

  const onImportFromDeployProvider = async (
    provider: "Vercel" | "Netlify",
    pull: () => Promise<DeployEnvPullResult>,
    setLoading: (loading: boolean) => void,
  ) => {
    setLoading(true);
    try {
      const result = await pull();

      if (!result.ok) {
        if (result.reason === "not_connected") {
          toast.error(`${provider} is not connected`, {
            description: `Connect ${provider} from the Deploy panel first.`,
          });
          return;
        }
        if (result.reason === "no_target") {
          toast.error(`No linked ${provider} project`, {
            description:
              result.message ??
              `Deploy this project to ${provider} once, then try again.`,
          });
          return;
        }
        toast.error(`${provider} import failed`, {
          description: result.message ?? "Could not load environment variables.",
        });
        return;
      }

      if (result.variables.length === 0) {
        toast.message(`No ${provider} variables found`, {
          description: `Linked project: ${result.projectName}`,
        });
        return;
      }

      applyImportedEntries(result.variables, "merge");
      setImportOpen(true);
    } catch (error) {
      toast.error(`${provider} import failed`, {
        description:
          error instanceof Error
            ? error.message
            : "Could not load environment variables.",
      });
    } finally {
      setLoading(false);
    }
  };

  const onImportFromVercel = () =>
    void onImportFromDeployProvider(
      "Vercel",
      () =>
        pullVercelEnv({
          projectId: projectId as Id<"projects">,
        }),
      setImportingFromVercel,
    );

  const onImportFromNetlify = () =>
    void onImportFromDeployProvider(
      "Netlify",
      () =>
        pullNetlifyEnv({
          projectId: projectId as Id<"projects">,
        }),
      setImportingFromNetlify,
    );

  const onPasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        toast.message("Clipboard is empty");
        return;
      }
      setPasteText(text);
      setImportOpen(true);
      pasteRef.current?.focus();
    } catch {
      toast.error("Could not read clipboard", {
        description: "Paste manually with Ctrl+V in the box below.",
      });
    }
  };

  const updateRow = (id: string, patch: Partial<Pick<EnvRow, "key" | "value">>) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
    setDirty(true);
  };

  const addRow = () => {
    setRows((current) => [
      ...current,
      { key: "", value: "", id: `new:${Date.now()}` },
    ]);
    setDirty(true);
  };

  const removeRow = (id: string) => {
    setRows((current) => current.filter((row) => row.id !== id));
    setDirty(true);
  };

  if (metadata === undefined) {
    return (
      <div className="flex items-center gap-2 px-3 py-5 text-[11px] text-ws-text-muted">
        <Loader2Icon className="size-3.5 animate-spin" />
        Loading project files…
      </div>
    );
  }

  const missingSuggested = DEFAULT_ENV_FILES.filter(
    (path) => !envPaths.includes(path),
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-ws-border-subtle p-2">
        <div className="flex flex-wrap gap-1">
          {envPaths.map((path) => (
            <button
              key={path}
              type="button"
              onClick={() => setSelectedPath(path)}
              className={cn(
                "rounded-md px-2 py-1 font-mono text-[10px] transition-colors",
                effectivePath === path
                  ? "bg-ws-accent/15 text-ws-text shadow-[inset_0_0_0_1px] shadow-ws-accent/35"
                  : "text-ws-text-muted hover:bg-ws-hover hover:text-ws-text",
              )}
            >
              {path}
            </button>
          ))}
        </div>
        {!fileExists ? (
          <p className="mt-2 px-0.5 text-[10px] text-ws-text-muted">
            {effectivePath} does not exist yet — import or add variables, then
            Save to create it.
          </p>
        ) : null}
        {missingSuggested.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {missingSuggested.map((path) => (
              <Button
                key={path}
                type="button"
                variant="ghost"
                size="sm"
                disabled={creating}
                onClick={() => void onCreateEnvFile(path)}
                className="h-6 px-1.5 font-mono text-[10px] text-ws-text-muted"
              >
                + {path}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <section className="border-b border-ws-border-subtle p-2">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium text-ws-text">
              Import variables
            </p>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={
                  importingFromVercel ||
                  !isVercelConnected ||
                  vercelTarget === undefined
                }
                title={
                  !isVercelConnected
                    ? "Connect Vercel in the Deploy panel"
                    : vercelTarget
                      ? `Import from ${vercelTarget.name}`
                      : "Deploy to Vercel first to link a project"
                }
                onClick={onImportFromVercel}
                className="h-6 gap-1 px-1.5 text-[10px] text-ws-text-muted"
              >
                {importingFromVercel ? (
                  <Loader2Icon className="size-3 animate-spin" />
                ) : (
                  <CloudDownloadIcon className="size-3" />
                )}
                Vercel
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={
                  importingFromNetlify ||
                  !isNetlifyConnected ||
                  netlifyTarget === undefined
                }
                title={
                  !isNetlifyConnected
                    ? "Connect Netlify in the Deploy panel"
                    : netlifyTarget
                      ? `Import from ${netlifyTarget.name}`
                      : "Deploy to Netlify first to link a site"
                }
                onClick={onImportFromNetlify}
                className="h-6 gap-1 px-1.5 text-[10px] text-ws-text-muted"
              >
                {importingFromNetlify ? (
                  <Loader2Icon className="size-3 animate-spin" />
                ) : (
                  <CloudDownloadIcon className="size-3" />
                )}
                Netlify
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void onPasteFromClipboard()}
                className="h-6 gap-1 px-1.5 text-[10px] text-ws-text-muted"
              >
                <ClipboardPasteIcon className="size-3" />
                Paste
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setImportOpen((open) => !open)}
                className="h-6 px-1.5 text-[10px] text-ws-text-muted"
              >
                {importOpen ? "Hide" : "Show"}
              </Button>
            </div>
          </div>
          {importOpen ? (
            <>
              <p className="mb-1.5 text-[10px] leading-relaxed text-ws-text-muted">
                Paste your entire{" "}
                <code className="text-ws-text">.env</code> file — like Vercel.
                Works with one variable per line or space-separated on one line.
              </p>
              <Textarea
                ref={pasteRef}
                value={pasteText}
                onChange={(event) => setPasteText(event.target.value)}
                placeholder={`NEXT_PUBLIC_API_URL=https://example.com\nCLERK_SECRET_KEY=sk_test_...\n# comments are ignored`}
                rows={5}
                className="min-h-[88px] resize-y border-ws-border-subtle bg-ws-bg font-mono text-[11px] leading-relaxed text-ws-text"
                aria-label="Paste .env contents"
              />
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {parsedPreviewCount !== null ? (
                  <span className="text-[10px] text-ws-text-muted">
                    {parsedPreviewCount} variable
                    {parsedPreviewCount === 1 ? "" : "s"} detected
                  </span>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  disabled={!pasteText.trim()}
                  onClick={() => onImportPaste("merge")}
                  className="ml-auto h-6 px-2 text-[10px]"
                >
                  Merge
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!pasteText.trim()}
                  onClick={() => onImportPaste("replace")}
                  className="h-6 border-ws-border-subtle px-2 text-[10px]"
                >
                  Replace all
                </Button>
              </div>
            </>
          ) : null}
        </section>

        <div className="p-2">
          {rows.length === 0 ? (
            <p className="px-1 py-3 text-[11px] text-ws-text-muted">
              No variables yet. Paste a <code className="text-ws-text">.env</code>{" "}
              above or add keys manually.
            </p>
          ) : (
            <ul className="space-y-1">
              {rows.map((row) => {
                const hidden = hiddenValues.has(row.id);
                return (
                  <li
                    key={row.id}
                    className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] items-center gap-1"
                  >
                    <Input
                      value={row.key}
                      onChange={(event) =>
                        updateRow(row.id, { key: event.target.value })
                      }
                      placeholder="KEY"
                      className="h-7 border-ws-border-subtle bg-ws-bg font-mono text-[11px]"
                      aria-label="Environment variable key"
                    />
                    <div className="relative">
                      <Input
                        value={row.value}
                        type={hidden ? "password" : "text"}
                        onChange={(event) =>
                          updateRow(row.id, { value: event.target.value })
                        }
                        placeholder="value"
                        className="h-7 border-ws-border-subtle bg-ws-bg pr-7 font-mono text-[11px]"
                        aria-label="Environment variable value"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setHiddenValues((current) => {
                            const next = new Set(current);
                            if (next.has(row.id)) next.delete(row.id);
                            else next.add(row.id);
                            return next;
                          })
                        }
                        className="absolute top-1/2 right-1.5 -translate-y-1/2 text-ws-text-muted hover:text-ws-text"
                        aria-label={hidden ? "Show value" : "Hide value"}
                      >
                        {hidden ? (
                          <EyeOffIcon className="size-3.5" />
                        ) : (
                          <EyeIcon className="size-3.5" />
                        )}
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeRow(row.id)}
                      className="size-7 text-ws-text-muted hover:text-ws-danger-soft"
                      aria-label="Remove variable"
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-ws-border-subtle p-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addRow}
          className="h-7 gap-1 px-2 text-[11px] text-ws-text"
        >
          <PlusIcon className="size-3.5" />
          Add variable
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={
            saving ||
            rowsToEntries(rows).length === 0 ||
            (!dirty && fileExists)
          }
          onClick={() => void onSave()}
          className="ml-auto h-7 px-3 text-[11px]"
        >
          {saving ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </div>
  );
}
