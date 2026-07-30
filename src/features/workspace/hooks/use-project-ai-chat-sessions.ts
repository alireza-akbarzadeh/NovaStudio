"use client";

import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  createAiChatSession,
  hasMigratedAiChatSessions,
  loadAiChatSessions,
  markAiChatSessionsMigrated,
  type AiChatSession,
} from "@/features/workspace/lib/ai-chat-sessions";
import {
  DEFAULT_AI_CHAT_MODE,
  isAiChatMode,
} from "@/lib/ai/chat-mode";

const SAVE_DEBOUNCE_MS = 900;

function mapRow(row: {
  id: string;
  title: string;
  subtitle?: string;
  mode: "plan" | "task";
  messages: unknown;
  createdByUserId: string;
  createdByName?: string;
  createdAt: number;
  updatedAt: number;
}): AiChatSession {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    mode: isAiChatMode(row.mode) ? row.mode : DEFAULT_AI_CHAT_MODE,
    messages: Array.isArray(row.messages) ? (row.messages as AiChatSession["messages"]) : [],
    createdByUserId: row.createdByUserId,
    createdByName: row.createdByName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function useProjectAiChatSessions(projectId: string) {
  const convexProjectId = projectId as Id<"projects">;
  const rows = useQuery(api.projectAiChatSessions.list, {
    projectId: convexProjectId,
  });
  const createMutation = useMutation(api.projectAiChatSessions.create);
  const saveMutation = useMutation(api.projectAiChatSessions.save);
  const removeMutation = useMutation(api.projectAiChatSessions.remove);
  const migrateMutation = useMutation(api.projectAiChatSessions.migrateBatch);

  const sessions = useMemo(
    () => (rows ?? []).map(mapRow),
    [rows],
  );

  const ready = rows !== undefined;
  const migrationStartedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<AiChatSession | null>(null);

  useEffect(() => {
    if (!ready || migrationStartedRef.current) return;
    if (hasMigratedAiChatSessions(projectId)) return;
    if (sessions.length > 0) {
      markAiChatSessionsMigrated(projectId);
      return;
    }

    const local = loadAiChatSessions(projectId);
    if (local.length === 0) {
      markAiChatSessionsMigrated(projectId);
      return;
    }

    migrationStartedRef.current = true;
    void migrateMutation({
      projectId: convexProjectId,
      sessions: local.map((session) => ({
        clientId: session.id,
        title: session.title,
        subtitle: session.subtitle,
        mode: isAiChatMode(session.mode) ? session.mode : DEFAULT_AI_CHAT_MODE,
        messages: session.messages,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      })),
    })
      .then(() => markAiChatSessionsMigrated(projectId))
      .catch(() => {
        migrationStartedRef.current = false;
      });
  }, [convexProjectId, migrateMutation, projectId, ready, sessions.length]);

  const flushSave = useCallback(async () => {
    const session = pendingSaveRef.current;
    pendingSaveRef.current = null;
    if (!session) return;

    await saveMutation({
      projectId: convexProjectId,
      clientId: session.id,
      title: session.title,
      subtitle: session.subtitle,
      mode: isAiChatMode(session.mode) ? session.mode : DEFAULT_AI_CHAT_MODE,
      messages: session.messages,
      updatedAt: session.updatedAt,
    });
  }, [convexProjectId, saveMutation]);

  const scheduleSave = useCallback(
    (session: AiChatSession) => {
      pendingSaveRef.current = session;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null;
        void flushSave();
      }, SAVE_DEBOUNCE_MS);
    },
    [flushSave],
  );

  useEffect(
    () => () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      if (pendingSaveRef.current) {
        void flushSave();
      }
    },
    [flushSave],
  );

  const createSession = useCallback(async () => {
    const session = createAiChatSession();
    await createMutation({
      projectId: convexProjectId,
      clientId: session.id,
      title: session.title,
      mode: session.mode,
    });
    return session;
  }, [convexProjectId, createMutation]);

  const ensureDefaultSession = useCallback(async () => {
    const session = createAiChatSession();
    await createMutation({
      projectId: convexProjectId,
      clientId: session.id,
      title: session.title,
      mode: session.mode,
    });
    return session.id;
  }, [convexProjectId, createMutation]);

  const removeSession = useCallback(
    async (clientId: string) => {
      await removeMutation({ projectId: convexProjectId, clientId });
    },
    [convexProjectId, removeMutation],
  );

  return {
    sessions,
    ready,
    createSession,
    ensureDefaultSession,
    scheduleSave,
    removeSession,
  };
}
