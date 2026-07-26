"use client";

import { motion } from "motion/react";
import {
  Activity,
  Bot,
  Bug,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Code2,
  GitBranch,
  Layers,
  MessageSquare,
  MousePointer2,
  Play,
  Rocket,
  Terminal,
} from "lucide-react";

import { CODE_LINES } from "@/features/auth/components/landing/constants";
import { LANDING } from "@/features/auth/components/landing/landing-colors";
import { WindowControls } from "@/features/auth/components/landing/window-controls";
import { cn } from "@/lib/utils";

import {
  DEMO_AVATARS,
  DEMO_CHAT_MESSAGES,
  DEMO_FILES,
  DEMO_TABS,
  type DemoStep,
} from "./constants";

type DemoAppMockupProps = {
  activeStep: DemoStep;
};

export function DemoAppMockup({ activeStep }: DemoAppMockupProps) {
  const aiActive = activeStep.id === "ai";
  const shipActive = activeStep.id === "ship";
  const collabActive = activeStep.id === "collab";
  const workspaceActive = activeStep.id === "workspace";
  const chatActive = activeStep.id === "chat";
  const debugActive = activeStep.id === "debug";
  const showDebug = debugActive || shipActive;

  return (
    <div
      data-demo-region="frame"
      className="relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-[#080912]/90 shadow-[0_30px_120px_-20px_rgba(0,0,0,0.8)] backdrop-blur-md"
    >
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.02] px-4 py-3">
        <WindowControls />
        <div className="mx-auto flex items-center gap-1">
          {DEMO_TABS.map((t) => (
            <span
              key={t}
              className={cn(
                "rounded-md px-3 py-1 text-xs",
                t === "feature.ts"
                  ? "bg-white/10 text-white"
                  : "text-white/40",
              )}
            >
              {t}
            </span>
          ))}
        </div>
        <motion.div
          data-demo-region="collab"
          className="flex -space-x-2 rounded-full p-0.5"
          animate={{
            scale: collabActive ? 1.06 : 1,
            filter: collabActive
              ? "drop-shadow(0 0 8px rgba(59,130,246,0.6))"
              : "none",
          }}
          transition={{ duration: 0.4 }}
        >
          {DEMO_AVATARS.map((a) => (
            <div
              key={a.i}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#080912] bg-gradient-to-br text-[10px] font-semibold text-white",
                a.c,
              )}
            >
              {a.i}
            </div>
          ))}
        </motion.div>
      </div>

      <div className="grid h-[calc(100%-49px-33px)] grid-cols-12">
        <motion.div
          data-demo-region="workspace"
          className="col-span-3 hidden border-r border-white/10 bg-white/[0.01] p-3 lg:block"
          animate={{
            backgroundColor: workspaceActive
              ? "rgba(34,211,238,0.04)"
              : "rgba(255,255,255,0.01)",
          }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-3 flex items-center gap-2 text-xs text-white/40">
            <Layers className="h-3.5 w-3.5" /> Explorer
          </div>
          {DEMO_FILES.map((f) => (
            <div
              key={f.n}
              className={cn(
                "flex items-center gap-1.5 rounded px-2 py-1 text-xs",
                f.active ? "bg-white/5 text-white" : "text-white/50",
              )}
              style={{ paddingLeft: `${8 + f.d * 12}px` }}
            >
              {f.on ? (
                <Code2 className="h-3 w-3 opacity-60" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              {f.n}
            </div>
          ))}
        </motion.div>

        <div className="col-span-12 flex min-h-0 flex-col lg:col-span-6">
          <div className="relative min-h-0 flex-1 overflow-hidden p-4 font-mono text-[12.5px] leading-relaxed">
            {CODE_LINES.map((line) => (
              <div key={line.n} className="flex gap-4 whitespace-pre">
                <span className="flex w-8 select-none items-center justify-end gap-1 text-white/20">
                  {line.n === 4 ? (
                    <CircleDot
                      className={cn(
                        "h-2.5 w-2.5",
                        debugActive ? "text-amber-400" : "text-red-400/70",
                      )}
                    />
                  ) : (
                    <span className="w-2.5" />
                  )}
                  {line.n}
                </span>
                <span>
                  {line.parts.map((p, j) => (
                    <span key={j} className={"c" in p ? p.c : undefined}>
                      {p.t}
                    </span>
                  ))}
                </span>
              </div>
            ))}
            {debugActive ? (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-[4.6rem] left-16 right-4 rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-[10px] text-amber-100"
              >
                Paused on breakpoint · shipFeature · line 4
              </motion.div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-5">
            <motion.div
              data-demo-region="ai"
              animate={{
                boxShadow: aiActive
                  ? `0 0 0 1px ${LANDING.violet}cc, 0 0 40px ${LANDING.violet}66`
                  : "0 0 0 1px rgba(255,255,255,0.06)",
              }}
              transition={{ duration: 0.4 }}
              className="rounded-xl border bg-violet-500/[0.06] p-3.5 md:col-span-3"
              style={{ borderColor: `${LANDING.violet}33` }}
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-400">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-xs font-medium text-white/80">
                  Ask NovaStudio
                </span>
                <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{" "}
                  reviewing
                </span>
              </div>
              <p className="text-xs leading-relaxed text-white/60">
                Drafted <span className="text-violet-300">5 tests</span> and
                found a <span className="text-amber-300">race condition</span> on
                line 4. Refactor with a mutex?
              </p>
              <div className="mt-2.5 flex gap-1.5">
                <button
                  type="button"
                  className="rounded-md bg-white/10 px-2 py-1 text-[10px] text-white"
                >
                  Apply fix
                </button>
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-[10px] text-white/40"
                >
                  Explain
                </button>
              </div>
            </motion.div>

            {debugActive ? (
              <motion.div
                data-demo-region="debug"
                animate={{
                  boxShadow: "0 0 0 1px #f59e0bcc, 0 0 32px #f59e0b55",
                }}
                transition={{ duration: 0.4 }}
                className="rounded-xl border border-amber-400/20 bg-black/40 p-3.5 font-mono text-[11px] md:col-span-2"
              >
                <div className="mb-1.5 flex items-center gap-1.5 text-white/40">
                  <Bug className="h-3 w-3" /> debug
                  <span className="ml-auto flex items-center gap-1 text-amber-400">
                    <Play className="h-3 w-3" /> paused
                  </span>
                </div>
                <div className="text-amber-300">● feature.ts:4</div>
                <div className="text-white/50">call stack · shipFeature</div>
                <div className="text-white/40">locals · tests: Promise</div>
              </motion.div>
            ) : (
              <motion.div
                data-demo-region="ship"
                animate={{
                  boxShadow: shipActive
                    ? `0 0 0 1px ${LANDING.emerald}cc, 0 0 32px ${LANDING.emerald}55`
                    : "0 0 0 1px rgba(255,255,255,0.06)",
                }}
                transition={{ duration: 0.4 }}
                className="rounded-xl border border-white/10 bg-black/40 p-3.5 font-mono text-[11px] md:col-span-2"
              >
                <div className="mb-1.5 flex items-center gap-1.5 text-white/40">
                  <Terminal className="h-3 w-3" /> terminal
                </div>
                <div className="text-emerald-400">$ npm test</div>
                <div className="text-white/50">
                  {showDebug ? (
                    <>
                      ✓ 12 passed ·{" "}
                      <span className="text-cyan-400">ready to commit</span>
                    </>
                  ) : (
                    "✓ Running…"
                  )}
                </div>
                {showDebug ? (
                  <div className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" /> Synced in 1.8s
                  </div>
                ) : null}
              </motion.div>
            )}
          </div>
        </div>

        <motion.div
          data-demo-region="chat"
          initial={false}
          animate={{
            boxShadow: chatActive
              ? `0 0 0 1px ${LANDING.cyan}cc, 0 0 36px ${LANDING.cyan}44`
              : "none",
            backgroundColor: chatActive
              ? "rgba(34,211,238,0.04)"
              : "rgba(255,255,255,0.01)",
          }}
          transition={{ duration: 0.4 }}
          className="col-span-3 hidden min-h-0 flex-col border-l border-white/10 p-3 lg:flex"
        >
          <div className="mb-3 flex items-center gap-2 text-xs text-white/40">
            <MessageSquare className="h-3.5 w-3.5" /> Team chat
            <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              live
            </span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden">
            {DEMO_CHAT_MESSAGES.map((m) => (
              <div key={m.who} className="rounded-lg bg-white/[0.04] p-2.5">
                <div
                  className="mb-1 text-[10px] font-medium"
                  style={{ color: m.color }}
                >
                  {m.who}
                </div>
                <p className="text-[11px] leading-relaxed text-white/60">
                  {m.text}
                </p>
              </div>
            ))}
            <div className="mt-auto rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-[10px] text-white/30">
              Message the team…
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-4 py-2 text-[11px] text-white/40">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <GitBranch className="h-3 w-3" /> main
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> 0 errors
          </span>
          {debugActive ? (
            <span className="flex items-center gap-1 text-amber-400">
              <Bug className="h-3 w-3" /> paused
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3" /> 3 live
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <Rocket className="h-3 w-3" /> Synced
          </span>
        </div>
      </div>

      <motion.div
        className="absolute hidden sm:block"
        style={{ left: "38%", top: "30%" }}
        animate={{
          x: [0, 30, -10, 0],
          y: [0, -10, 12, 0],
          opacity: collabActive || activeStep.id === "welcome" ? 1 : 0.55,
        }}
        transition={{
          x: { duration: 6, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: 0.35 },
        }}
      >
        <MousePointer2
          className="h-4 w-4 fill-white"
          style={{ color: LANDING.violet }}
        />
        <span
          className="ml-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white"
          style={{ background: LANDING.violet }}
        >
          Maya
        </span>
      </motion.div>
    </div>
  );
}
