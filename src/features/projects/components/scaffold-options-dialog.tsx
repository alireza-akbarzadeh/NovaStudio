"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildScaffoldCommand,
  DEFAULT_SCAFFOLD_OPTIONS,
  NEXT_VERSION_PRESETS,
  PACKAGE_MANAGER_OPTIONS,
  scaffoldDialogDescription,
  scaffoldDialogTitle,
  VERSION_PRESETS,
  type PackageManager,
  type ScaffoldOptions,
  type ScaffoldTemplateId,
} from "@/features/projects/lib/scaffold-commands";
import { cn } from "@/lib/utils";

function ToggleChip({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={checked}
      onClick={onChange}
      className={cn(
        "rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors",
        "outline-none focus-visible:ring-1 focus-visible:ring-ring/40",
        checked
          ? "border-ring/50 bg-foreground/5 text-foreground"
          : "border-border/60 text-muted-foreground hover:text-foreground",
        disabled && "opacity-50",
      )}
    >
      {label}
    </button>
  );
}

type ScaffoldOptionsDialogProps = {
  open: boolean;
  templateId: ScaffoldTemplateId | null;
  projectName: string;
  creating: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (options: ScaffoldOptions) => void;
};

export function ScaffoldOptionsDialog({
  open,
  templateId,
  projectName,
  creating,
  onOpenChange,
  onConfirm,
}: ScaffoldOptionsDialogProps) {
  const [options, setOptions] = useState<ScaffoldOptions>(
    DEFAULT_SCAFFOLD_OPTIONS,
  );

  useEffect(() => {
    if (open) {
      setOptions(DEFAULT_SCAFFOLD_OPTIONS);
    }
  }, [open, templateId]);

  const isNext = templateId === "nextjs";
  const versionPresets = isNext ? NEXT_VERSION_PRESETS : VERSION_PRESETS;
  const preview = templateId
    ? buildScaffoldCommand(templateId, options)
    : "";

  if (!templateId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border/60 px-6 py-5 text-left">
          <DialogTitle>{scaffoldDialogTitle(templateId)}</DialogTitle>
          <DialogDescription>
            {scaffoldDialogDescription(templateId)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 overflow-y-auto px-6 py-5">
          <p className="text-[12px] text-muted-foreground">
            Project{" "}
            <span className="font-medium text-foreground">{projectName}</span>
          </p>

          <div className="space-y-2">
            <Label>Package manager</Label>
            <div className="flex flex-wrap gap-1.5">
              {PACKAGE_MANAGER_OPTIONS.map((item) => (
                <ToggleChip
                  key={item.id}
                  label={item.label}
                  checked={options.packageManager === item.id}
                  disabled={creating}
                  onChange={() =>
                    setOptions((prev) => ({
                      ...prev,
                      packageManager: item.id as PackageManager,
                    }))
                  }
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scaffold-version">Version</Label>
            <Input
              id="scaffold-version"
              value={options.version}
              disabled={creating}
              placeholder="latest, 15.2.4, canary…"
              onChange={(event) =>
                setOptions((prev) => ({
                  ...prev,
                  version: event.target.value,
                }))
              }
            />
            <div className="flex flex-wrap gap-1.5">
              {versionPresets.map((item) => (
                <ToggleChip
                  key={item.id}
                  label={item.label}
                  checked={options.version === item.id}
                  disabled={creating}
                  onChange={() =>
                    setOptions((prev) => ({
                      ...prev,
                      version: item.id,
                    }))
                  }
                />
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Use a preset or type any npm dist-tag / semver (e.g.{" "}
              <code className="text-foreground/80">15.1.0</code>).
            </p>
          </div>

          <div className="space-y-2">
            <Label>Features</Label>
            <div className="flex flex-wrap gap-1.5">
              <ToggleChip
                label="TypeScript"
                checked={options.typescript}
                disabled={creating}
                onChange={() =>
                  setOptions((prev) => ({
                    ...prev,
                    typescript: !prev.typescript,
                  }))
                }
              />
              {isNext ? (
                <>
                  <ToggleChip
                    label="ESLint"
                    checked={options.eslint}
                    disabled={creating}
                    onChange={() =>
                      setOptions((prev) => ({
                        ...prev,
                        eslint: !prev.eslint,
                      }))
                    }
                  />
                  <ToggleChip
                    label="Tailwind"
                    checked={options.tailwind}
                    disabled={creating}
                    onChange={() =>
                      setOptions((prev) => ({
                        ...prev,
                        tailwind: !prev.tailwind,
                      }))
                    }
                  />
                  <ToggleChip
                    label="App Router"
                    checked={options.appRouter}
                    disabled={creating}
                    onChange={() =>
                      setOptions((prev) => ({
                        ...prev,
                        appRouter: !prev.appRouter,
                      }))
                    }
                  />
                  <ToggleChip
                    label="src/ directory"
                    checked={options.srcDir}
                    disabled={creating}
                    onChange={() =>
                      setOptions((prev) => ({
                        ...prev,
                        srcDir: !prev.srcDir,
                      }))
                    }
                  />
                  <ToggleChip
                    label="Turbopack"
                    checked={options.turbopack}
                    disabled={creating}
                    onChange={() =>
                      setOptions((prev) => ({
                        ...prev,
                        turbopack: !prev.turbopack,
                      }))
                    }
                  />
                </>
              ) : null}
            </div>
          </div>

          <div className="rounded-md border border-border/50 bg-muted/40 px-3 py-2 font-mono text-[11px] leading-relaxed break-all text-muted-foreground">
            {preview}
          </div>
        </div>

        <DialogFooter className="border-t border-border/60 px-6 py-4 sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            disabled={creating}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            loading={creating}
            disabled={creating || !options.version.trim()}
            onClick={() => onConfirm(options)}
          >
            {creating ? "Creating…" : "Create & scaffold"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
