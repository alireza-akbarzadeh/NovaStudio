import Image from "next/image";

import type { CustomizePluginId } from "@/features/customize/lib/customize-catalog";
import { cn } from "@/lib/utils";

type CustomizePluginIconProps = {
  pluginId: CustomizePluginId | string;
  className?: string;
  size?: "sm" | "md";
};

type IconSpec =
  | { kind: "image"; src: string; className?: string }
  | { kind: "letter"; letter: string; className: string };

const ICONS: Record<string, IconSpec> = {
  netlify: { kind: "image", src: "/netlify.svg" },
  vercel: { kind: "image", src: "/vercel.svg", className: "dark:invert" },
  github: { kind: "image", src: "/images/github.png", className: "dark:invert" },
  notion: {
    kind: "letter",
    letter: "N",
    className: "bg-white text-black",
  },
  figma: {
    kind: "letter",
    letter: "F",
    className:
      "bg-linear-to-br from-[#F24E1E] via-[#A259FF] to-[#0ACF83] text-white",
  },
  datadog: {
    kind: "letter",
    letter: "D",
    className: "bg-[#632CA6] text-white",
  },
  slack: {
    kind: "letter",
    letter: "S",
    className: "bg-[#4A154B] text-white",
  },
  linear: {
    kind: "letter",
    letter: "L",
    className: "bg-indigo-600 text-white",
  },
  discord: {
    kind: "letter",
    letter: "D",
    className: "bg-[#5865F2] text-white",
  },
  "google-calendar": {
    kind: "letter",
    letter: "G",
    className: "bg-linear-to-br from-[#4285F4] to-[#34A853] text-white",
  },
};

export function CustomizePluginIcon({
  pluginId,
  className,
  size = "md",
}: CustomizePluginIconProps) {
  const dim = size === "sm" ? "size-7" : "size-9";
  const iconSize = size === "sm" ? 18 : 22;
  const spec = ICONS[pluginId] ?? {
    kind: "letter" as const,
    letter: pluginId.slice(0, 1).toUpperCase(),
    className: "bg-ws-hover text-ws-text",
  };

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md text-sm font-bold",
        spec.kind === "letter" ? spec.className : "bg-ws-bg",
        dim,
        className,
      )}
    >
      {spec.kind === "image" ? (
        <Image
          src={spec.src}
          alt=""
          width={iconSize}
          height={iconSize}
          className={spec.className}
        />
      ) : (
        spec.letter
      )}
    </div>
  );
}
