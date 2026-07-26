"use client";

import { ClerkProvider, useAuth, useClerk } from "@clerk/nextjs";
import {
  Authenticated,
  AuthLoading,
  ConvexReactClient,
  Unauthenticated,
  useConvexAuth,
} from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { usePathname } from "next/navigation";

import { AuthLoadingView } from "@/features/auth/components/auth-loading-view";
import { LandingView } from "@/features/auth/components/unauthenticated-view";
import { PricingDialogProvider } from "@/features/billing/components/pricing-dialog";
import { clerkAppearance } from "@/features/billing/lib/clerk-appearance";
import { NotificationProvider } from "@/features/notifications/components/notification-provider";
import { ProjectsDialogProvider } from "@/features/projects/components/projects-dialog";
import { ConfirmDialogProvider } from "@/components/confirm-dialog";
import { PromptDialogProvider } from "@/components/prompt-dialog";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import ThemeProvider from "./theme-provider";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/** Public marketing / invite routes — no auth required to view. */
const PUBLIC_PATHS = ["/", "/pricing", "/invite"];

function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  return PUBLIC_PATHS.some(
    (path) => path !== "/" && (pathname === path || pathname.startsWith(`${path}/`)),
  );
}

function AuthBridgeMismatch() {
  const { signOut } = useClerk();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#1e1f22] px-6 text-center text-zinc-200">
      <p className="text-lg font-medium">Session couldn&apos;t reach the workspace</p>
      <p className="max-w-md text-sm text-zinc-400">
        You&apos;re signed in with Clerk, but Convex didn&apos;t accept the session
        token. Sign out once, then sign back in. If it keeps happening, confirm the
        Clerk → Convex integration JWT template is enabled.
      </p>
      <Button
        type="button"
        onClick={() => void signOut({ redirectUrl: "/" })}
        className="rounded-lg"
      >
        Sign out and retry
      </Button>
    </div>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const publicRoute = isPublicPath(pathname);
  const { isSignedIn, isLoaded: clerkLoaded } = useAuth();
  const { isAuthenticated, isLoading: convexAuthLoading } = useConvexAuth();

  // Clerk session exists but Convex rejected the token (wrong issuer / missing
  // JWT template). Don't replace the hub with the marketing landing page.
  if (
    clerkLoaded &&
    isSignedIn &&
    !convexAuthLoading &&
    !isAuthenticated &&
    !publicRoute
  ) {
    return <AuthBridgeMismatch />;
  }

  return (
    <>
      <Authenticated>{children}</Authenticated>
      <Unauthenticated>
        {publicRoute ? children : <LandingView />}
      </Unauthenticated>
      <AuthLoading>
        <AuthLoadingView />
      </AuthLoading>
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <PricingDialogProvider>
            <ProjectsDialogProvider>
              <AuthGate>
                <ConfirmDialogProvider>
                  <PromptDialogProvider>
                    <NotificationProvider>
                      {children}
                      <Toaster />
                    </NotificationProvider>
                  </PromptDialogProvider>
                </ConfirmDialogProvider>
              </AuthGate>
            </ProjectsDialogProvider>
          </PricingDialogProvider>
        </ThemeProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
