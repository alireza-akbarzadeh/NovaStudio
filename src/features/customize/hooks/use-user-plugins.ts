"use client";

import { useMutation, useQuery } from "convex/react";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import { getCustomizePlugin } from "@/features/customize/lib/customize-catalog";

export function useUserPlugins() {
  const installs = useQuery(api.userPlugins.list);
  const installMut = useMutation(api.userPlugins.install);
  const uninstallMut = useMutation(api.userPlugins.uninstall);

  const installById = useMemo(() => {
    const map = new Map<
      string,
      { pluginId: string; installedAt: number; updatedAt: number }
    >();
    for (const row of installs ?? []) {
      map.set(row.pluginId, row);
    }
    return map;
  }, [installs]);

  const installedIds = useMemo(() => {
    return new Set(installById.keys());
  }, [installById]);

  const install = useCallback(
    async (pluginId: string) => {
      const plugin = getCustomizePlugin(pluginId);
      if (!plugin) {
        toast.error("Unknown plugin");
        return;
      }
      try {
        await installMut({ pluginId });
        toast.success(`${plugin.name} installed`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to install plugin",
        );
      }
    },
    [installMut],
  );

  const uninstall = useCallback(
    async (pluginId: string) => {
      const plugin = getCustomizePlugin(pluginId);
      try {
        await uninstallMut({ pluginId });
        toast.success(`${plugin?.name ?? "Plugin"} uninstalled`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to uninstall plugin",
        );
      }
    },
    [uninstallMut],
  );

  return {
    ready: installs !== undefined,
    installs: installs ?? [],
    installById,
    installedIds,
    install,
    uninstall,
  };
}
