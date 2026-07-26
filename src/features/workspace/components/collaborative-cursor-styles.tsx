"use client";

import { getYjsProviderForRoom } from "@liveblocks/yjs";
import { useEffect, useMemo, useState } from "react";

import { useRoom } from "@/liveblocks.config";

type AwarenessUser = {
  name?: string;
  color?: string;
};

type AwarenessState = {
  user?: AwarenessUser;
};

/** Escape a string for use inside a CSS `content: "..."` value. */
function cssContentString(value: string) {
  return value
    .replace(/[<>]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, " ");
}

/**
 * Injects per-client CSS so y-monaco remote carets show each collaborator's
 * color and name pill. y-monaco only adds classnames — colors/labels must be
 * applied via awareness-driven styles (Liveblocks pattern).
 */
export function CollaborativeCursorStyles() {
  const room = useRoom();
  const [awarenessUsers, setAwarenessUsers] = useState<
    Array<[number, AwarenessState]>
  >([]);

  useEffect(() => {
    const provider = getYjsProviderForRoom(room);

    const sync = () => {
      setAwarenessUsers([
        ...provider.awareness.getStates(),
      ] as Array<[number, AwarenessState]>);
    };

    sync();
    provider.awareness.on("change", sync);
    return () => {
      provider.awareness.off("change", sync);
    };
  }, [room]);

  const styleSheet = useMemo(() => {
    let cursorStyles = "";

    for (const [clientId, client] of awarenessUsers) {
      const user = client?.user;
      if (!user?.name || !user.color) continue;

      const name = cssContentString(user.name);
      const color = user.color;

      cursorStyles += `
        .yRemoteSelection-${clientId} {
          background-color: color-mix(in oklab, ${color} 28%, transparent);
        }
        .yRemoteSelectionHead-${clientId} {
          --user-color: ${color};
          border-left-color: ${color};
        }
        .yRemoteSelectionHead-${clientId}::after {
          content: "${name}";
          background: ${color};
        }
      `;
    }

    return { __html: cursorStyles };
  }, [awarenessUsers]);

  if (!styleSheet.__html) return null;
  return <style dangerouslySetInnerHTML={styleSheet} />;
}
