"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function safeReturnTo(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/projects";
  }
  return value;
}

/**
 * Legacy bookmark for an old Connect flow. Linking GitHub while signed-in
 * returns to the workspace page directly — this route just sends you back.
 */
function SsoCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get("return_to"));

  useEffect(() => {
    router.replace(returnTo);
  }, [returnTo, router]);

  return (
    <div className="flex flex-col items-center gap-3">
      <p>Taking you back…</p>
      <Link href={returnTo} className="text-sm text-foreground underline">
        Continue
      </Link>
    </div>
  );
}

export default function SsoCallbackPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background text-sm text-muted-foreground">
      <Suspense fallback={<p>Taking you back…</p>}>
        <SsoCallbackInner />
      </Suspense>
    </div>
  );
}
