"use client";

import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Id } from "@/convex/_generated/dataModel";
import {
  CUSTOMIZE_USER_ITEM_META,
  type CustomizeUserItem,
  type CustomizeUserItemKind,
} from "@/features/customize/lib/customize-user-items";

type CustomizeUserItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: CustomizeUserItemKind;
  item?: CustomizeUserItem | null;
  onSave: (args: {
    itemId?: Id<"userCustomizeItems">;
    kind: CustomizeUserItemKind;
    name: string;
    description: string;
    content: string;
    hookPhase?: "pre" | "post";
    enabled?: boolean;
  }) => Promise<void>;
};

export function CustomizeUserItemDialog({
  open,
  onOpenChange,
  kind,
  item,
  onSave,
}: CustomizeUserItemDialogProps) {
  const meta = CUSTOMIZE_USER_ITEM_META[kind];
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [hookPhase, setHookPhase] = useState<"pre" | "post">("pre");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(item?.name ?? "");
    setDescription(item?.description ?? "");
    setContent(item?.content ?? "");
    setHookPhase(item?.hookPhase ?? "pre");
  }, [open, item]);

  const reset = () => {
    setName("");
    setDescription("");
    setContent("");
    setHookPhase("pre");
  };

  const onOpenChangeInternal = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const onSubmit = async () => {
    setSaving(true);
    try {
      await onSave({
        itemId: item?._id as Id<"userCustomizeItems"> | undefined,
        kind,
        name,
        description,
        content,
        hookPhase: kind === "hook" ? hookPhase : undefined,
        enabled: item?.enabled ?? true,
      });
      toast.success(item ? `Updated “${name.trim()}”` : `Added “${name.trim()}”`);
      onOpenChangeInternal(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `Could not save ${meta.singular.toLowerCase()}`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChangeInternal}>
      <DialogContent className="border-ws-border-subtle bg-ws-panel text-ws-text sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {item ? `Edit ${meta.singular.toLowerCase()}` : meta.addLabel}
          </DialogTitle>
          <DialogDescription className="text-ws-text-muted">
            {kind === "subagent"
              ? "Define a specialist persona NovaStudio can adopt during chat."
              : kind === "hook"
                ? "Run instructions before or after each AI response."
                : kind === "command"
                  ? "Reusable prompt templates you can insert into chat."
                  : "Always-on guidance appended to NovaStudio AI."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="customize-item-name" className="text-ws-text-secondary">
              Name
            </Label>
            <Input
              id="customize-item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="security-reviewer"
              disabled={Boolean(item)}
              className="border-ws-border-subtle bg-ws-bg font-mono text-[12px]"
            />
            {!item ? (
              <p className="text-[10px] text-ws-text-muted">
                Lowercase letters, numbers, and hyphens
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="customize-item-description"
              className="text-ws-text-secondary"
            >
              Description
            </Label>
            <Input
              id="customize-item-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={meta.descriptionPlaceholder}
              className="border-ws-border-subtle bg-ws-bg text-[12px]"
            />
          </div>

          {kind === "hook" ? (
            <div className="space-y-1.5">
              <Label className="text-ws-text-secondary">Phase</Label>
              <Select
                value={hookPhase}
                onValueChange={(value) =>
                  setHookPhase(value as "pre" | "post")
                }
              >
                <SelectTrigger className="border-ws-border-subtle bg-ws-bg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-ws-border-subtle bg-ws-panel">
                  <SelectItem value="pre">Pre-response (before answering)</SelectItem>
                  <SelectItem value="post">Post-response (when finishing)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="customize-item-content" className="text-ws-text-secondary">
              {meta.contentLabel}
            </Label>
            <Textarea
              id="customize-item-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={meta.contentPlaceholder}
              rows={8}
              className="min-h-40 resize-y border-ws-border-subtle bg-ws-bg text-[12px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChangeInternal(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void onSubmit()}
            disabled={
              saving || !name.trim() || !description.trim() || !content.trim()
            }
            className="bg-ws-accent text-white hover:bg-ws-accent-hover"
          >
            {saving ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Saving…
              </>
            ) : item ? (
              "Save changes"
            ) : (
              meta.addLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
