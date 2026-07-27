"use client";

import { useAction } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { GitHubBlameLine } from "@/convex/githubBlame";
import { parseConvexErrorMessage } from "@/features/github/lib/github-errors";

type UseGitHubBlameArgs = {
  projectId: string;
  filePath: string | null;
  enabled: boolean;
};

export function useGitHubBlame({
  projectId,
  filePath,
  enabled,
}: UseGitHubBlameArgs) {
  const getFileBlame = useAction(api.githubBlame.getFileBlame);
  const [lines, setLines] = useState<GitHubBlameLine[]>([]);
  const [branch, setBranch] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!enabled || !filePath) {
      setLines([]);
      setBranch(null);
      setError(null);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const result = await getFileBlame({
        projectId: projectId as Id<"projects">,
        path: filePath,
      });
      if (requestId !== requestIdRef.current) return;
      setLines(result.lines);
      setBranch(result.branch);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      const message = parseConvexErrorMessage(err, "Failed to load Git blame");
      setLines([]);
      setBranch(null);
      setError(message);
      toast.error(message);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [enabled, filePath, getFileBlame, projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { lines, branch, loading, error, refresh };
}
