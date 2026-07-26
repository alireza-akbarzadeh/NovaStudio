import type { ComponentProps } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

type Appearance = NonNullable<ComponentProps<typeof ClerkProvider>["appearance"]>;

/** NovaStudio landing / app dark surface — shared with Clerk UI. */
export const CLERK_THEME = {
  bg: "#06070d",
  surface: "#0a0b14",
  surfaceElevated: "#10111a",
  border: "rgba(255,255,255,0.10)",
  borderStrong: "rgba(255,255,255,0.16)",
  text: "#ffffff",
  muted: "rgba(255,255,255,0.55)",
  mutedSoft: "rgba(255,255,255,0.40)",
  input: "rgba(255,255,255,0.04)",
  primary: "#8b5cf6",
  primaryHover: "#7c3aed",
  accent: "#3b82f6",
  cyan: "#22d3ee",
  success: "#10b981",
  danger: "#f87171",
  backdrop: "rgba(6,7,13,0.72)",
} as const;

const clerkVariables: NonNullable<Appearance["variables"]> = {
  colorPrimary: CLERK_THEME.primary,
  colorDanger: CLERK_THEME.danger,
  colorSuccess: CLERK_THEME.success,
  colorWarning: "#fbbf24",
  colorNeutral: "#a1a1aa",
  colorForeground: CLERK_THEME.text,
  colorPrimaryForeground: "#ffffff",
  colorMutedForeground: CLERK_THEME.muted,
  colorMuted: CLERK_THEME.surfaceElevated,
  colorBackground: CLERK_THEME.surface,
  colorInput: CLERK_THEME.input,
  colorInputForeground: CLERK_THEME.text,
  colorBorder: CLERK_THEME.border,
  colorRing: CLERK_THEME.primary,
  colorShadow: "rgba(0,0,0,0.55)",
  colorModalBackdrop: CLERK_THEME.backdrop,
  borderRadius: "0.875rem",
  fontSize: "0.875rem",
};

/**
 * Global Clerk appearance — SignIn/SignUp modals, UserButton, UserProfile, etc.
 */
export const clerkAppearance: Appearance = {
  theme: dark,
  variables: clerkVariables,
  elements: {
    rootBox: "font-sans antialiased",

    // Auth modals / cards
    card: [
      "rounded-2xl border border-white/10 bg-[#0a0b14]/95",
      "shadow-[0_30px_120px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl",
    ].join(" "),
    cardBox: "rounded-2xl",
    modalBackdrop: "bg-[#06070d]/72 backdrop-blur-md",
    modalContent: "rounded-2xl",
    headerTitle: "text-white tracking-tight font-semibold",
    headerSubtitle: "text-white/55",
    socialButtonsBlockButton: [
      "rounded-xl border border-white/10 bg-white/[0.03]",
      "text-white hover:bg-white/[0.08] transition-colors",
    ].join(" "),
    socialButtonsBlockButtonText: "text-white font-medium",
    formButtonPrimary: [
      "rounded-xl bg-white text-black font-semibold",
      "hover:bg-white/90 shadow-none",
      "transition-colors",
    ].join(" "),
    formFieldInput: [
      "rounded-xl border border-white/10 bg-white/[0.04]",
      "text-white placeholder:text-white/35",
      "focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20",
    ].join(" "),
    formFieldLabel: "text-white/70",
    footerActionLink: "text-violet-300 hover:text-violet-200",
    identityPreviewEditButton: "text-violet-300 hover:text-violet-200",
    dividerLine: "bg-white/10",
    dividerText: "text-white/40",
    alertText: "text-white/80",
    formFieldErrorText: "text-red-400",

    // User button + popover menu
    userButtonAvatarBox: "rounded-full ring-1 ring-white/15",
    userButtonTrigger:
      "rounded-full focus:shadow-none focus:ring-2 focus:ring-violet-500/40",
    userButtonPopoverCard: [
      "rounded-2xl border border-white/10 bg-[#0a0b14]/95",
      "shadow-[0_24px_80px_-16px_rgba(0,0,0,0.8)] backdrop-blur-xl",
    ].join(" "),
    userButtonPopoverMain: "bg-transparent",
    userButtonPopoverFooter: "border-t border-white/10 bg-white/[0.02]",
    userButtonPopoverActionButton:
      "rounded-lg text-white/80 hover:bg-white/[0.06] hover:text-white",
    userButtonPopoverActionButtonText: "text-sm",
    userButtonPopoverActionButtonIcon: "text-white/45",
    userPreviewMainIdentifier: "text-white font-medium",
    userPreviewSecondaryIdentifier: "text-white/45",

    // User profile / manage account
    navbar: "border-r border-white/10 bg-[#080912]",
    navbarButton: "text-white/60 hover:text-white hover:bg-white/[0.05]",
    scrollBox: "bg-[#0a0b14]",
    profileSectionTitleText: "text-white",
    profileSectionContent: "text-white/70",
    badge: "rounded-md bg-violet-500/20 text-violet-200 border border-violet-500/30",
  },
};

/**
 * PricingTable-specific overrides (landing section + billing dialog).
 */
export const clerkPricingAppearance: Appearance = {
  theme: dark,
  variables: clerkVariables,
  elements: {
    rootBox: "mx-auto w-full font-sans antialiased",
    pricingTable: "gap-5",
    pricingTableCard: [
      "relative overflow-hidden rounded-2xl",
      "border border-white/10 bg-white/[0.02]",
      "backdrop-blur-md shadow-none",
      "transition-[border-color,box-shadow,transform] duration-300",
      "hover:border-white/20",
      "hover:shadow-[0_0_60px_-20px_rgba(139,92,246,0.35)]",
    ].join(" "),
    pricingTableCardHeader: "border-b border-white/10 pb-4",
    pricingTableCardTitle: "text-white font-semibold tracking-tight capitalize",
    pricingTableCardDescription: "text-white/50 text-sm",
    pricingTableCardFee: "text-white text-4xl font-semibold tracking-tight",
    pricingTableCardFeePeriod: "text-white/40 text-sm",
    pricingTableCardFeePeriodNotice: "text-white/40",
    pricingTableCardBody: "text-white/70",
    pricingTableCardFeatures: "text-white/65",
    pricingTableCardFeaturesListItem: "text-sm text-white/65",
    pricingTableCardFeaturesListItemTitle: "text-white/70",
    pricingTableCardPeriodToggle: "text-white/55",
    pricingTableCardStatus: [
      "rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-black",
    ].join(" "),
    pricingTableCardFooter: "border-t border-white/10 pt-4 mt-auto",
    pricingTableCardFooterButton: [
      "w-full rounded-xl bg-white text-black font-semibold",
      "hover:bg-white/90 shadow-none transition-colors",
    ].join(" "),
    pricingTableCardFooterNotice: "text-white/40 text-sm text-center",
  },
};
