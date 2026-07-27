"use client";

import { useAction } from "convex/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import { deriveMarkdownTitle } from "@/features/integrations/lib/derive-markdown-title";
import { useNotionConnection } from "@/features/integrations/hooks/use-notion-connection";

type ExportToNotionArgs = {
  title?: string;
  markdown: string;
  footer?: string;
};

export function useExportToNotion() {
  const { isConnected, isLoading } = useNotionConnection();
  const exportAction = useAction(api.notionActions.exportMarkdown);
  const [isExporting, setIsExporting] = useState(false);

  const exportToNotion = useCallback(
    async ({ title, markdown, footer }: ExportToNotionArgs) => {
      if (!isConnected) {
        toast.message("Connect Notion first", {
          description: "Open Integrations to add your integration secret.",
          action: {
            label: "Open Integrations",
            onClick: () => {
              window.location.href = "/projects/integrations";
            },
          },
        });
        return null;
      }

      setIsExporting(true);
      try {
        const result = await exportAction({
          title: title ?? deriveMarkdownTitle(markdown),
          markdown,
          footer,
        });
        toast.success("Exported to Notion", {
          action: result.url
            ? {
                label: "Open page",
                onClick: () => window.open(result.url, "_blank", "noopener"),
              }
            : undefined,
        });
        return result;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to export to Notion",
        );
        throw error;
      } finally {
        setIsExporting(false);
      }
    },
    [exportAction, isConnected],
  );

  return {
    isConnected,
    isLoading,
    isExporting,
    exportToNotion,
  };
}
