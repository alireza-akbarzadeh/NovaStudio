import type { Metadata } from "next";

import { ContactView } from "@/features/auth/components/contact/contact-view";

export const metadata: Metadata = {
  title: "Contact · NovaStudio",
  description:
    "Get in touch with the NovaStudio team about product, pricing, enterprise, support, or press.",
};

export default function ContactPage() {
  return <ContactView />;
}
