"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

import {
  useWebContainer,
  type UseWebContainerResult,
} from "@/features/workspace/hooks/use-webcontainer";

const WebContainerContext = createContext<UseWebContainerResult | null>(null);

type WebContainerProviderProps = {
  projectId: string;
  children: ReactNode;
};

export function WebContainerProvider({
  projectId,
  children,
}: WebContainerProviderProps) {
  const value = useWebContainer(projectId);
  return (
    <WebContainerContext.Provider value={value}>
      {children}
    </WebContainerContext.Provider>
  );
}

export function useWebContainerContext(): UseWebContainerResult {
  const ctx = useContext(WebContainerContext);
  if (!ctx) {
    throw new Error(
      "useWebContainerContext must be used within WebContainerProvider",
    );
  }
  return ctx;
}

/** Optional access when the provider may be absent (tests / non-workspace). */
export function useOptionalWebContainer(): UseWebContainerResult | null {
  return useContext(WebContainerContext);
}
