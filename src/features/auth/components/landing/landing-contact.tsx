"use client";

import { motion } from "motion/react";
import { ArrowRight, Mail, Users } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { display } from "./display-font";
import { LANDING } from "./landing-colors";
import { Section, SectionLabel } from "./landing-section";

const CARDS = [
  {
    icon: Mail,
    color: LANDING.blue,
    title: "Contact us",
    body: "Product questions, enterprise, support, or press — send a message and we'll reply within one business day.",
    href: "/contact",
    cta: "Go to contact",
  },
  {
    icon: Users,
    color: LANDING.violet,
    title: "Join the waitlist",
    body: "Get early access to new AI features, private previews, and product drops before they ship publicly.",
    href: "/waitlist",
    cta: "Join waitlist",
  },
] as const;

export function LandingContact() {
  return (
    <Section id="contact" className="py-24">
      <div className="mx-auto max-w-3xl text-center">
        <SectionLabel>Contact</SectionLabel>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className={cn(
            display.className,
            "mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl",
          )}
        >
          Talk to the team
        </motion.h2>
        <p className="mx-auto mt-4 max-w-xl text-white/55">
          Prefer a human conversation, or want early access? Reach out or join
          the waitlist.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {CARDS.map((card, i) => (
          <motion.div
            key={card.href}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
            className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md"
          >
            <div
              className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: `${card.color}1a` }}
            >
              <card.icon className="h-5 w-5" style={{ color: card.color }} />
            </div>
            <h3 className="text-lg font-medium text-white">{card.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-white/50">
              {card.body}
            </p>
            <Button
              asChild
              className="mt-6 w-fit rounded-xl bg-white text-black hover:bg-white/90"
            >
              <Link href={card.href}>
                {card.cta} <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
