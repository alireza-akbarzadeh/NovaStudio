import { create } from "zustand";

export type AiPendingApply = {
  id: string;
  projectId: string;
  path: string;
  previousContent: string;
  nextContent: string;
  isNew: boolean;
  toolCallId: string;
  queuedAt: number;
};

type AiPendingAppliesState = {
  pending: AiPendingApply[];
  queue: (item: Omit<AiPendingApply, "id" | "queuedAt">) => void;
  remove: (id: string) => void;
  removeMany: (ids: string[]) => void;
  clearProject: (projectId: string) => void;
  listForProject: (projectId: string) => AiPendingApply[];
};

export const useAiPendingAppliesStore = create<AiPendingAppliesState>(
  (set, get) => ({
    pending: [],

    queue: (item) => {
      set((s) => {
        // Same path again → replace proposed content, keep original baseline.
        const existingIdx = s.pending.findIndex(
          (p) => p.projectId === item.projectId && p.path === item.path,
        );
        if (existingIdx >= 0) {
          const next = [...s.pending];
          const prev = next[existingIdx]!;
          next[existingIdx] = {
            ...prev,
            nextContent: item.nextContent,
            toolCallId: item.toolCallId,
            queuedAt: Date.now(),
          };
          return { pending: next };
        }
        return {
          pending: [
            ...s.pending,
            {
              ...item,
              id: item.toolCallId,
              queuedAt: Date.now(),
            },
          ],
        };
      });
    },

    remove: (id) =>
      set((s) => ({ pending: s.pending.filter((p) => p.id !== id) })),

    removeMany: (ids) => {
      const idSet = new Set(ids);
      set((s) => ({ pending: s.pending.filter((p) => !idSet.has(p.id)) }));
    },

    clearProject: (projectId) =>
      set((s) => ({
        pending: s.pending.filter((p) => p.projectId !== projectId),
      })),

    listForProject: (projectId) =>
      get().pending.filter((p) => p.projectId === projectId),
  }),
);
