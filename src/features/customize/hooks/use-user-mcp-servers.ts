"use client";

import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export type UserMcpServerRow = {
  _id: Id<"userMcpServers">;
  name: string;
  transport: "sse" | "http";
  urlHost: string;
  enabled: boolean;
  verified: boolean;
  lastVerifiedAt?: number;
  createdAt: number;
  updatedAt: number;
};

export function useUserMcpServers() {
  const rows = useQuery(api.userMcpServers.list);
  const remove = useMutation(api.userMcpServers.remove);
  const setEnabled = useMutation(api.userMcpServers.setEnabled);

  return {
    servers: (rows ?? []) as UserMcpServerRow[],
    ready: rows !== undefined,
    remove: (serverId: Id<"userMcpServers">) => remove({ serverId }),
    setEnabled: (serverId: Id<"userMcpServers">, enabled: boolean) =>
      setEnabled({ serverId, enabled }),
  };
}
