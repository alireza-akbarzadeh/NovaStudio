"use client";

import { ChevronRightIcon } from "lucide-react";
import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { FileNavigatorBreadcrumbPicker } from "@/features/workspace/components/file-navigator";
import { WorkspaceSwitcher } from "@/features/workspace/components/workspace-switcher";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";

type WorkspaceBreadcrumbProps = {
  projectId: string;
  projectName?: string;
};

export function WorkspaceBreadcrumb({
  projectId,
  projectName,
}: WorkspaceBreadcrumbProps) {
  const segments = useWorkspaceStore((s) => s.breadcrumb);

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap items-center gap-1 text-[12px] sm:gap-1">
        <BreadcrumbItem className="shrink-0">
          <WorkspaceSwitcher projectId={projectId} projectName={projectName} />
        </BreadcrumbItem>

        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          return (
            <Fragment key={`${segment.label}-${index}`}>
              <BreadcrumbSeparator className="mx-0.5 text-ws-text-muted [&>svg]:size-3">
                <ChevronRightIcon />
              </BreadcrumbSeparator>
              <BreadcrumbItem className="min-w-0">
                <FileNavigatorBreadcrumbPicker
                  projectId={projectId}
                  segment={segment}
                  segmentIndex={index}
                  allSegments={segments}
                  isLast={isLast}
                />
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
