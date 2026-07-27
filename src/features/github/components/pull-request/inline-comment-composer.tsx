"use client";

import { Loader2Icon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type InlineCommentComposerProps = {
  fileLine: number;
  body: string;
  suggestion: string;
  isSubmitting: boolean;
  onBodyChange: (value: string) => void;
  onSuggestionChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

export function InlineCommentComposer({
  fileLine,
  body,
  suggestion,
  isSubmitting,
  onBodyChange,
  onSuggestionChange,
  onCancel,
  onSubmit,
}: InlineCommentComposerProps) {
  return (
    <div
      className="rounded-md border border-sky-500/40 bg-ws-panel p-3 shadow-lg"
      onMouseDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-sky-400">
          Comment on line {fileLine}
        </p>
        <button
          type="button"
          aria-label="Cancel comment"
          onClick={onCancel}
          className="inline-flex size-6 items-center justify-center rounded-md text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>
      <Textarea
        value={body}
        onChange={(event) => onBodyChange(event.target.value)}
        placeholder="Leave a review comment…"
        rows={3}
        autoFocus
        disabled={isSubmitting}
        className="mb-2 min-h-20 resize-none border-ws-border bg-ws-bg text-[13px] text-ws-text"
      />
      <Textarea
        value={suggestion}
        onChange={(event) => onSuggestionChange(event.target.value)}
        placeholder="Suggested change (optional)"
        rows={2}
        disabled={isSubmitting}
        className="mb-3 min-h-14 resize-none border-ws-border bg-ws-bg font-mono text-[12px] text-ws-text"
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isSubmitting}
          onClick={onCancel}
          className="h-8 border-ws-border bg-ws-bg text-[12px] text-ws-text hover:bg-ws-hover"
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!body.trim() || isSubmitting}
          onClick={onSubmit}
          className="h-8 bg-sky-600 text-[12px] text-white hover:bg-sky-700"
        >
          {isSubmitting ? (
            <>
              <Loader2Icon className="size-3.5 animate-spin" />
              Posting…
            </>
          ) : (
            "Add comment"
          )}
        </Button>
      </div>
    </div>
  );
}
