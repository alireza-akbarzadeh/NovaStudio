"use client";

import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo } from "react";
import { useSyncExternalStore } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import {
  EXTENSION_CATALOG,
  getCatalogEntry,
  VUE_EXTENSION_ID,
} from "@/features/extensions/lib/catalog";
import {
  getExtensionsStateSnapshot,
  setExtensionsState,
  subscribeExtensionsState,
} from "@/features/extensions/lib/extensions-state";
import type { ExtensionCatalogEntry } from "@/features/extensions/lib/types";

function isThemeEntry(entry: ExtensionCatalogEntry | undefined): boolean {
  return entry?.category === "theme";
}

export function useUserExtensions() {
  const installs = useQuery(api.userExtensions.list);
  const installMut = useMutation(api.userExtensions.install);
  const uninstallMut = useMutation(api.userExtensions.uninstall);
  const setEnabledMut = useMutation(api.userExtensions.setEnabled);
  const setActiveThemeMut = useMutation(api.userExtensions.setActiveTheme);

  const installById = useMemo(() => {
    const map = new Map<
      string,
      {
        extensionId: string;
        version: string;
        enabled: boolean;
        installedAt: number;
        updatedAt: number;
      }
    >();
    for (const row of installs ?? []) {
      map.set(row.extensionId, row);
    }
    return map;
  }, [installs]);

  const enabledIds = useMemo(() => {
    const set = new Set<string>();
    for (const row of installs ?? []) {
      if (row.enabled) set.add(row.extensionId);
    }
    return set;
  }, [installs]);

  const activeThemeId = useMemo(() => {
    for (const row of installs ?? []) {
      if (row.enabled && isThemeEntry(getCatalogEntry(row.extensionId))) {
        return row.extensionId;
      }
    }
    return null;
  }, [installs]);

  // Hydrate module cache for Monaco language mapping / theme resolution.
  useEffect(() => {
    if (installs === undefined) return;
    setExtensionsState({
      enabledIds,
      activeThemeId,
    });
  }, [installs, enabledIds, activeThemeId]);

  const install = useCallback(
    async (extensionId: string) => {
      const entry = getCatalogEntry(extensionId);
      if (!entry) {
        toast.error("Unknown extension");
        return;
      }
      try {
        await installMut({
          extensionId: entry.id,
          version: entry.version,
        });
        toast.success(`Installed ${entry.name}`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to install",
        );
      }
    },
    [installMut],
  );

  const uninstall = useCallback(
    async (extensionId: string) => {
      const entry = getCatalogEntry(extensionId);
      try {
        await uninstallMut({ extensionId });
        toast.success(
          entry ? `Uninstalled ${entry.name}` : "Extension uninstalled",
        );
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to uninstall",
        );
      }
    },
    [uninstallMut],
  );

  const setEnabled = useCallback(
    async (extensionId: string, enabled: boolean) => {
      try {
        await setEnabledMut({ extensionId, enabled });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update extension",
        );
      }
    },
    [setEnabledMut],
  );

  const activateTheme = useCallback(
    async (extensionId: string) => {
      try {
        await setActiveThemeMut({ extensionId });
        const entry = getCatalogEntry(extensionId);
        toast.success(entry ? `Activated ${entry.name}` : "Theme activated");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to activate theme",
        );
      }
    },
    [setActiveThemeMut],
  );

  return {
    ready: installs !== undefined,
    installs: installs ?? [],
    installById,
    enabledIds,
    activeThemeId,
    catalog: EXTENSION_CATALOG,
    vueEnabled: enabledIds.has(VUE_EXTENSION_ID),
    install,
    uninstall,
    setEnabled,
    activateTheme,
  };
}

/** Subscribe to hydrated extension state outside of Convex loading. */
export function useExtensionsState() {
  return useSyncExternalStore(
    subscribeExtensionsState,
    getExtensionsStateSnapshot,
    getExtensionsStateSnapshot,
  );
}
