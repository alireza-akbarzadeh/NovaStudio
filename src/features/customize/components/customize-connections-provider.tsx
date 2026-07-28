"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { CustomizePluginId } from "@/features/customize/lib/customize-catalog";
import {
  useCustomizeConnections,
  type PluginConnectionState,
} from "@/features/customize/hooks/use-customize-connections";

const CustomizeConnectionsContext = createContext<
  Map<CustomizePluginId, PluginConnectionState> | null
>(null);

export function CustomizeConnectionsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const connections = useCustomizeConnections();
  return (
    <CustomizeConnectionsContext.Provider value={connections}>
      {children}
    </CustomizeConnectionsContext.Provider>
  );
}

export function usePluginConnectionFromContext(pluginId: CustomizePluginId) {
  const connections = useContext(CustomizeConnectionsContext);
  if (!connections) {
    throw new Error(
      "usePluginConnectionFromContext requires CustomizeConnectionsProvider",
    );
  }
  return connections.get(pluginId) ?? { isConnected: false, isLoading: false };
}
