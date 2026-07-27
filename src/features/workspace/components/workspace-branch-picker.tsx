"use client";

import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  GitBranchIcon,
  GitCommitHorizontalIcon,
  Loader2Icon,
  PlusIcon,
  TagIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useGitBranches,
  usePullFromGitHub,
} from "@/features/github/hooks/use-git-sync";
import {
  normalizeBranchName,
  validateBranchName,
} from "@/features/github/lib/git-branch-name";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";

type BranchRow = {
  name: string;
  protected: boolean;
  isCurrent: boolean;
};

type WorkspaceBranchPickerProps = {
  projectId: string;
  branch: string;
  changeCount?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

function Shortcut({ children }: { children: string }) {
  return (
    <span className="ml-auto shrink-0 pl-3 text-[11px] tabular-nums text-ws-text-muted/80">
      {children}
    </span>
  );
}

export function WorkspaceBranchPicker({
  projectId,
  branch,
  changeCount = 0,
  open: controlledOpen,
  onOpenChange,
  className,
}: WorkspaceBranchPickerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const showGitPanel = useWorkspaceStore((s) => s.showGitPanel);
  const { pull, isPulling } = usePullFromGitHub(projectId);
  const { loadBranches, checkout, createBranch, isLoading, isMutating } =
    useGitBranches(projectId);
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [creating, setCreating] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");

  useEffect(() => {
    if (!open) {
      setCreating(false);
      setNewBranchName("");
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const next = await loadBranches();
        if (!cancelled) setBranches(next);
      } catch {
        if (!cancelled) setBranches([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, loadBranches]);

  const onCheckout = async (name: string) => {
    if (name === branch) {
      setOpen(false);
      return;
    }
    try {
      await checkout(name);
      setOpen(false);
    } catch {
      // toast handled in hook
    }
  };

  const onCreate = async () => {
    const name = normalizeBranchName(newBranchName);
    if (!name || validateBranchName(newBranchName)) return;
    try {
      await createBranch(name, { checkout: true });
      setOpen(false);
    } catch {
      // toast handled in hook
    }
  };

  const normalizedBranchName = normalizeBranchName(newBranchName);
  const branchNameError = newBranchName.trim()
    ? validateBranchName(newBranchName)
    : null;
  const branchNamePreview =
    newBranchName.trim() &&
    normalizedBranchName &&
    normalizedBranchName !== newBranchName.trim()
      ? normalizedBranchName
      : null;

  const closeAnd = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  const busy = isLoading || isMutating || isPulling;
  const isDirty = changeCount > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-6 max-w-[240px] items-center gap-1.5 truncate rounded-full bg-ws-chip px-2.5 text-[11px] text-ws-text-muted transition-colors hover:bg-ws-hover hover:text-ws-text",
            open && "bg-ws-hover text-ws-text",
            isDirty && "text-ws-text",
            className,
          )}
          title="Git branches and actions"
        >
          {busy && open ? (
            <Loader2Icon className="size-3 shrink-0 animate-spin" />
          ) : (
            <GitBranchIcon className="size-3 shrink-0" strokeWidth={1.75} />
          )}
          <span className="truncate font-medium text-ws-text">{branch}</span>
          {isDirty ? (
            <span className="shrink-0 text-ws-success">
              {changeCount} change{changeCount === 1 ? "" : "s"}
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-0.5 text-ws-text-muted">
              <CheckIcon className="size-3" strokeWidth={2.25} />
              clean
            </span>
          )}
          <ChevronDownIcon
            className={cn(
              "size-3 shrink-0 text-ws-text-muted transition-transform",
              open && "rotate-180",
            )}
            strokeWidth={2}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        sideOffset={6}
        className="w-[320px] overflow-hidden rounded-lg border-ws-border-subtle bg-ws-panel p-0 text-ws-text shadow-xl"
      >
        {creating ? (
          <div className="space-y-2 p-3">
            <p className="text-[12px] font-medium text-ws-text">New Branch</p>
            <p className="text-[11px] text-ws-text-muted">
              From{" "}
              <span className="font-mono text-ws-text-secondary">{branch}</span>
            </p>
            <Input
              autoFocus
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void onCreate();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setCreating(false);
                }
              }}
              placeholder="feature/my-branch"
              className="h-8 border-ws-border bg-ws-bg text-[12px] text-ws-text"
              disabled={isMutating}
            />
            {branchNamePreview ? (
              <p className="text-[10px] text-ws-text-muted">
                Will create{" "}
                <span className="font-mono text-ws-text-secondary">
                  {branchNamePreview}
                </span>
              </p>
            ) : null}
            {branchNameError ? (
              <p className="text-[10px] text-ws-danger-soft">{branchNameError}</p>
            ) : null}
            <div className="flex items-center justify-end gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
                onClick={() => setCreating(false)}
                disabled={isMutating}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-7 bg-ws-accent text-[11px] text-white hover:bg-ws-accent-hover"
                disabled={
                  !normalizedBranchName || Boolean(branchNameError) || isMutating
                }
                onClick={() => void onCreate()}
              >
                {isMutating ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  "Create & Checkout"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <Command className="bg-transparent text-ws-text">
            <CommandInput
              placeholder="Search for branches and actions"
              className="h-9 text-[12px]"
            />
            <CommandList className="max-h-[360px]">
              <CommandEmpty className="py-4 text-[11px] text-ws-text-muted">
                {isLoading ? "Loading…" : "No matching branches or actions"}
              </CommandEmpty>

              <CommandGroup className="p-1">
                <CommandItem
                  value="Update Project pull sync"
                  disabled={isPulling}
                  onSelect={() => {
                    closeAnd(() => {
                      void pull();
                    });
                  }}
                  className="gap-2 rounded-md px-2 py-1.5 text-[12px] data-[selected=true]:bg-[#3574F0]/data-[selected=true]:text-white"
                >
                  <ArrowDownLeftIcon className="size-3.5 shrink-0 opacity-90" />
                  <span className="truncate">
                    {isPulling ? "Updating…" : "Update Project…"}
                  </span>
                  <Shortcut>Ctrl+T</Shortcut>
                </CommandItem>
                <CommandItem
                  value="Commit changes"
                  onSelect={() =>
                    closeAnd(() => showGitPanel("changes"))
                  }
                  className="group gap-2 rounded-md px-2 py-1.5 text-[12px] data-[selected=true]:bg-[#3574F0]/data-[selected=true]:text-white"
                >
                  <GitCommitHorizontalIcon className="size-3.5 shrink-0 opacity-90" />
                  <span className="truncate">Commit…</span>
                  {changeCount > 0 ? (
                    <span className="ml-auto shrink-0 rounded-full bg-ws-accent px-1.5 text-[9px] text-white group-data-[selected=true]:bg-white/25">
                      {changeCount}
                    </span>
                  ) : (
                    <Shortcut>Ctrl+K</Shortcut>
                  )}
                </CommandItem>
                <CommandItem
                  value="Push to remote"
                  onSelect={() =>
                    closeAnd(() => showGitPanel("changes"))
                  }
                  className="gap-2 rounded-md px-2 py-1.5 text-[12px] data-[selected=true]:bg-[#3574F0]/data-[selected=true]:text-white"
                >
                  <ArrowUpRightIcon className="size-3.5 shrink-0 opacity-90" />
                  <span className="truncate">Push…</span>
                  <Shortcut>Ctrl+Shift+K</Shortcut>
                </CommandItem>
              </CommandGroup>

              <CommandSeparator className="bg-ws-border-subtle" />

              <CommandGroup className="p-1">
                <CommandItem
                  value="New Branch create"
                  disabled={isMutating}
                  onSelect={() => setCreating(true)}
                  className="gap-2 rounded-md px-2 py-1.5 text-[12px] data-[selected=true]:bg-[#3574F0]/data-[selected=true]:text-white"
                >
                  <PlusIcon className="size-3.5 shrink-0 opacity-90" />
                  <span className="truncate">New Branch…</span>
                  <Shortcut>Ctrl+Alt+N</Shortcut>
                </CommandItem>
              </CommandGroup>

              <CommandSeparator className="bg-ws-border-subtle" />

              <CommandGroup
                heading="Local"
                className="p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-ws-text-muted"
              >
                {branches.map((item) => (
                  <CommandItem
                    key={item.name}
                    value={`branch ${item.name}`}
                    disabled={isMutating}
                    onSelect={() => void onCheckout(item.name)}
                    className="gap-2 rounded-md px-2 py-1.5 text-[12px] data-[selected=true]:bg-[#3574F0]/data-[selected=true]:text-white"
                  >
                    {item.isCurrent ? (
                      <TagIcon
                        className="size-3.5 shrink-0 text-amber-400 data-[selected=true]:text-amber-200"
                        strokeWidth={1.75}
                      />
                    ) : (
                      <GitBranchIcon
                        className="size-3.5 shrink-0 opacity-70"
                        strokeWidth={1.75}
                      />
                    )}
                    <span className="min-w-0 flex-1 truncate font-mono text-[12px]">
                      {item.name}
                    </span>
                    {item.isCurrent ? (
                      <CheckIcon className="size-3.5 shrink-0 opacity-90" />
                    ) : (
                      <ChevronRightIcon className="size-3.5 shrink-0 opacity-50" />
                    )}
                  </CommandItem>
                ))}
                {!isLoading && branches.length === 0 ? (
                  <p className="px-2 py-2 text-[11px] text-ws-text-muted">
                    No local branches loaded
                  </p>
                ) : null}
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}
