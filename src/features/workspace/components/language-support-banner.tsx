"use client";

import { InfoIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";

import {
  getLanguageSupport,
  type LanguageSupportInfo,
} from "@/features/workspace/lib/language-support";
import { cn } from "@/lib/utils";

type LanguageSupportBannerProps = {
  languageId: string;
  className?: string;
};

/**
 * Non-blocking notice when a file opens without a language server.
 * Does not block editing — syntax-only languages still use Monaco.
 */
export function LanguageSupportBanner({
  languageId,
  className,
}: LanguageSupportBannerProps) {
  const support = getLanguageSupport(languageId);
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  useEffect(() => {
    setDismissedId(null);
  }, [languageId]);

  if (!support.notice || dismissedId === support.id) {
    return null;
  }

  return (
    <div
      role="status"
      className={cn(
        "flex shrink-0 items-start gap-2 border-b border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-950 dark:text-amber-100",
        className,
      )}
    >
      <InfoIcon className="mt-0.5 size-3.5 shrink-0 opacity-80" />
      <p className="min-w-0 flex-1 leading-relaxed">
        <span className="font-medium">{support.label}: </span>
        {support.notice}
      </p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setDismissedId(support.id)}
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-md opacity-70 transition hover:bg-amber-500/15 hover:opacity-100"
      >
        <XIcon className="size-3.5" />
      </button>
    </div>
  );
}

export function languageSupportForPath(
  languageId: string,
): LanguageSupportInfo {
  return getLanguageSupport(languageId);
}
