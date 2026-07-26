import type { ReactNode } from "react";

export function PricingLink({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <a href="#pricing" className={className}>
      {children}
    </a>
  );
}
