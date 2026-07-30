"use client";

import { useMutation, useQuery } from "convex/react";
import { useMemo } from "react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  buildAiCustomizeContext,
  type AiCustomizeContext,
  type CustomizeUserItem,
  type CustomizeUserItemKind,
} from "@/features/customize/lib/customize-user-items";

export function useUserCustomizeItems() {
  const rows = useQuery(api.userCustomizeItems.list);
  const upsert = useMutation(api.userCustomizeItems.upsert);
  const remove = useMutation(api.userCustomizeItems.remove);
  const setEnabled = useMutation(api.userCustomizeItems.setEnabled);

  const items = (rows ?? []) as CustomizeUserItem[];

  const byKind = useMemo(() => {
    const map: Record<CustomizeUserItemKind, CustomizeUserItem[]> = {
      subagent: [],
      hook: [],
      command: [],
      rule: [],
    };
    for (const item of items) {
      map[item.kind].push(item);
    }
    return map;
  }, [items]);

  const aiContext = useMemo(
    () => buildAiCustomizeContext(items),
    [items],
  );

  return {
    items,
    byKind,
    aiContext,
    ready: rows !== undefined,
    upsert: (args: {
      itemId?: Id<"userCustomizeItems">;
      kind: CustomizeUserItemKind;
      name: string;
      description: string;
      content: string;
      hookPhase?: "pre" | "post";
      enabled?: boolean;
    }) => upsert(args),
    remove: (itemId: Id<"userCustomizeItems">) => remove({ itemId }),
    setEnabled: (itemId: Id<"userCustomizeItems">, enabled: boolean) =>
      setEnabled({ itemId, enabled }),
  };
}

export function useAiCustomizeContext(): AiCustomizeContext {
  const enabled = useQuery(api.userCustomizeItems.listEnabled);
  return useMemo(
    () => buildAiCustomizeContext((enabled ?? []) as CustomizeUserItem[]),
    [enabled],
  );
}
