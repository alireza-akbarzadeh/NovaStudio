"use client";

import { motion } from "motion/react";
import { Activity, MessageSquare, Users } from "lucide-react";

import { cn } from "@/lib/utils";

import { display } from "./display-font";
import { LANDING } from "./landing-colors";
import { Section, SectionLabel } from "./landing-section";

const AVATARS = [
  {
    i: "AB",
    n: "Ava Brooks",
    r: "Frontend",
    c: "from-blue-500 to-cyan-400",
    online: true,
  },
  {
    i: "MC",
    n: "Maya Chen",
    r: "Backend",
    c: "from-violet-500 to-fuchsia-400",
    online: true,
  },
  {
    i: "JD",
    n: "Jordan Diaz",
    r: "DevOps",
    c: "from-emerald-500 to-teal-400",
    online: true,
  },
  {
    i: "LK",
    n: "Leo Kim",
    r: "Design",
    c: "from-amber-500 to-orange-400",
    online: false,
  },
] as const;

const TIMELINE = [
  { who: "Maya", what: "edited feature.ts", t: "now", c: LANDING.violet },
  {
    who: "Ask NovaStudio",
    what: "suggested a refactor",
    t: "2m",
    c: LANDING.blue,
  },
  { who: "Jordan", what: "left a comment", t: "5m", c: LANDING.emerald },
  { who: "Ava", what: "published changes", t: "12m", c: LANDING.cyan },
] as const;

export function LandingCollab() {
  return (
    <Section id="collab" className="scroll-mt-24 py-24">
      <div className="mb-12 text-center">
        <SectionLabel>Collaboration</SectionLabel>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={cn(
            display.className,
            "mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl",
          )}
        >
          Code together, in real time
        </motion.h2>
        <p className="mx-auto mt-4 max-w-xl text-white/50">
          Live avatars, presence, cursor labels, comments, shared editing, and
          an activity timeline — in the same cloud workspace.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md"
        >
          <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-white">
            <Users className="h-4 w-4 text-cyan-400" /> Team presence
          </h3>
          <div className="space-y-3">
            {AVATARS.map((a, i) => (
              <motion.div
                key={a.i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3"
              >
                <div className="relative">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${a.c} text-xs font-semibold text-white`}
                  >
                    {a.i}
                  </div>
                  <span
                    className={`absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-[#06070d] ${
                      a.online ? "bg-emerald-400" : "bg-white/30"
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-white">{a.n}</div>
                  <div className="text-xs text-white/40">{a.r}</div>
                </div>
                <span
                  className={`text-xs ${a.online ? "text-emerald-400" : "text-white/30"}`}
                >
                  {a.online ? "editing" : "away"}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md"
        >
          <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-white">
            <MessageSquare className="h-4 w-4 text-violet-400" /> Live comments
          </h3>
          <div className="space-y-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-400 text-[9px] text-white">
                  MC
                </div>
                <span className="text-xs font-medium text-white">Maya</span>
                <span className="text-[10px] text-white/30">line 4</span>
              </div>
              <p className="text-xs text-white/60">
                Should we extract this into a shared hook?
              </p>
            </div>
            <div className="ml-6 rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-[9px] text-white">
                  AB
                </div>
                <span className="text-xs font-medium text-white">Ava</span>
              </div>
              <p className="text-xs text-white/60">
                Good call — Ask NovaStudio can scaffold it.
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 text-[10px] text-white">
              JD
            </div>
            <input
              disabled
              placeholder="Reply or @mention Ask NovaStudio..."
              className="flex-1 bg-transparent text-xs text-white/60 placeholder:text-white/30 focus:outline-none"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md"
        >
          <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-white">
            <Activity className="h-4 w-4 text-emerald-400" /> Activity timeline
          </h3>
          <div className="space-y-4">
            {TIMELINE.map((e, i) => (
              <motion.div
                key={`${e.who}-${e.t}`}
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-3"
              >
                <div className="flex flex-col items-center">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ background: e.c }}
                  />
                  {i < TIMELINE.length - 1 ? (
                    <div className="mt-1 h-8 w-px bg-white/10" />
                  ) : null}
                </div>
                <div className="-mt-0.5">
                  <div className="text-xs text-white">
                    <span className="font-medium">{e.who}</span> {e.what}
                  </div>
                  <div className="text-[10px] text-white/30">{e.t}</div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              </div>
              <div>
                <div className="text-xs font-medium text-white">Session live</div>
                <div className="text-[10px] text-white/40">3 collaborators</div>
              </div>
            </div>
            <div className="flex -space-x-1.5">
              {AVATARS.slice(0, 3).map((a) => (
                <div
                  key={a.i}
                  className={`flex h-5 w-5 items-center justify-center rounded-full border border-[#06070d] bg-gradient-to-br ${a.c} text-[8px] text-white`}
                >
                  {a.i}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
