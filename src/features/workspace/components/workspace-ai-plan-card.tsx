"use client";

import {
  Plan,
  PlanAction,
  PlanContent,
  PlanDescription,
  PlanHeader,
  PlanTitle,
  PlanTrigger,
} from "@/components/ai-elements/plan";
import { ExportToNotionButton } from "@/features/integrations/components/export-to-notion-button";
import { deriveMarkdownTitle } from "@/features/integrations/lib/derive-markdown-title";
import { WorkspaceMessageResponse } from "@/features/workspace/components/workspace-message-response";
import { cn } from "@/lib/utils";

type WorkspaceAiPlanCardProps = {
  content: string;
  isStreaming?: boolean;
  className?: string;
};

export function WorkspaceAiPlanCard({
  content,
  isStreaming = false,
  className,
}: WorkspaceAiPlanCardProps) {
  const title = deriveMarkdownTitle(content, "Implementation plan");

  return (
    <Plan
      defaultOpen
      isStreaming={isStreaming}
      className={cn(
        "mb-1 border-ws-border bg-ws-bg/60 text-ws-text shadow-none",
        className,
      )}
    >
      <PlanHeader className="gap-2 border-b border-ws-border-subtle pb-3">
        <div className="min-w-0 flex-1 space-y-1">
          <PlanTitle className="text-[13px] font-semibold text-ws-text">
            {title}
          </PlanTitle>
          <PlanDescription className="text-[11px] text-ws-text-muted">
            Read-only plan — switch to Task mode to execute
          </PlanDescription>
        </div>
        <PlanAction className="flex items-center gap-0.5">
          {!isStreaming ? (
            <ExportToNotionButton
              title={title}
              markdown={content}
              footer="Exported from NovaStudio AI plan mode."
              className="size-7 text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
            />
          ) : null}
          <PlanTrigger className="size-7 text-ws-text-muted hover:bg-ws-hover hover:text-ws-text" />
        </PlanAction>
      </PlanHeader>
      <PlanContent className="pt-3 text-[13px] leading-relaxed text-ws-text-secondary">
        <WorkspaceMessageResponse>{content}</WorkspaceMessageResponse>
      </PlanContent>
    </Plan>
  );
}
