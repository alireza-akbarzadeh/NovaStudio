import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from "react";

type PricingLinkProps = {
  className?: string;
  children: ReactNode;
} & Pick<AnchorHTMLAttributes<HTMLAnchorElement>, "onClick">;

export const PricingLink = forwardRef<HTMLAnchorElement, PricingLinkProps>(
  function PricingLink({ className, children, onClick }, ref) {
    return (
      <a ref={ref} href="#pricing" className={className} onClick={onClick}>
        {children}
      </a>
    );
  },
);
