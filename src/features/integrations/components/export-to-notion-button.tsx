"use client";

import { Loader2Icon, NotebookPenIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useExportToNotion } from "@/features/integrations/hooks/use-export-to-notion";
import { cn } from "@/lib/utils";

type ExportToNotionButtonProps = {
  title?: string;
  markdown: string;
  footer?: string;
  disabled?: boolean;
  className?: string;
  size?: "icon" | "sm";
  label?: string;
};

export function ExportToNotionButton({
  title,
  markdown,
  footer,
  disabled = false,
  className,
  size = "icon",
  label = "Export to Notion",
}: ExportToNotionButtonProps) {
  const { isExporting, exportToNotion } = useExportToNotion();

  const onClick = () => {
    void exportToNotion({ title, markdown, footer });
  };

  if (size === "sm") {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled || isExporting || !markdown.trim()}
        onClick={onClick}
        className={cn("h-7 text-[11px]", className)}
      >
        {isExporting ? (
          <Loader2Icon className="size-3.5 animate-spin" />
        ) : (
          <NotebookPenIcon className="size-3.5" />
        )}
        {label}
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={disabled || isExporting || !markdown.trim()}
          onClick={onClick}
          aria-label={label}
          className={className}
        >
          {isExporting ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <NotebookPenIcon className="size-3.5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
