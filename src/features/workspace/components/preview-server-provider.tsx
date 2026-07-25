"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

import {
  usePreviewServer,
  type UsePreviewServerResult,
} from "@/features/workspace/hooks/use-preview-server";

const PreviewServerContext = createContext<UsePreviewServerResult | null>(
  null,
);

type PreviewServerProviderProps = {
  projectId: string;
  children: ReactNode;
};

export function PreviewServerProvider({
  projectId,
  children,
}: PreviewServerProviderProps) {
  const value = usePreviewServer(projectId);
  return (
    <PreviewServerContext.Provider value={value}>
      {children}
    </PreviewServerContext.Provider>
  );
}

export function usePreviewServerContext(): UsePreviewServerResult {
  const ctx = useContext(PreviewServerContext);
  if (!ctx) {
    throw new Error(
      "usePreviewServerContext must be used within PreviewServerProvider",
    );
  }
  return ctx;
}

export function useOptionalPreviewServer(): UsePreviewServerResult | null {
  return useContext(PreviewServerContext);
}
