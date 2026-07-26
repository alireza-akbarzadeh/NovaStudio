"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Activity,
  Bot,
  CheckCircle2,
  ChevronDown,
  Code2,
  GitBranch,
  Layers,
  MousePointer2,
  Rocket,
  Terminal,
} from "lucide-react";

import { CODE_LINES } from "./constants";
import { LANDING } from "./landing-colors";

function CodeBlock() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0a0b14]/90 font-mono text-[12.5px] leading-relaxed backdrop-blur-md">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-red-500/80" />
        <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
        <span className="h-3 w-3 rounded-full bg-green-500/80" />
        <span className="ml-2 text-xs text-white/40">novastudio · feature.ts</span>
        <div className="ml-auto flex items-center gap-1.5">
          <GitBranch className="h-3 w-3 text-white/30" />
          <span className="text-xs text-white/40">main</span>
        </div>
      </div>
      <div className="p-4">
        {CODE_LINES.map((line, i) => (
          <motion.div
            key={line.n}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 * i, duration: 0.35 }}
            className="flex gap-4 whitespace-pre"
          >
            <span className="select-none text-white/20">{line.n}</span>
            <span>
              {line.parts.map((p, j) => (
                <span key={j} className={"c" in p ? p.c : undefined}>
                  {p.t}
                </span>
              ))}
              {i === 5 ? (
                <motion.span
                  className="ml-0.5 inline-block h-3.5 w-1.5 bg-cyan-400 align-middle"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.7, repeat: Infinity }}
                />
              ) : null}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

type LiveCursorProps = {
  label: string;
  color: string;
  className?: string;
  delay?: number;
};

function LiveCursor({ label, color, className, delay = 0 }: LiveCursorProps) {
  return (
    <motion.div
      aria-hidden
      className={`absolute z-20 hidden sm:block ${className ?? ""}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, x: [0, 24, -12, 0], y: [0, -18, 8, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <MousePointer2 className="h-4 w-4 fill-white" style={{ color }} />
      <span
        className="ml-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white"
        style={{ background: color }}
      >
        {label}
      </span>
    </motion.div>
  );
}

export function LandingHeroEditor() {
  const [tab, setTab] = useState("feature.ts");
  const avatars = [
    { i: "AB", c: "from-blue-500 to-cyan-400" },
    { i: "MC", c: "from-violet-500 to-fuchsia-400" },
    { i: "JD", c: "from-emerald-500 to-teal-400" },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#080912]/80 shadow-[0_30px_120px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl">
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.02] px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-500/70" />
          <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
          <span className="h-3 w-3 rounded-full bg-green-500/70" />
        </div>
        <div className="mx-auto flex items-center gap-1">
          {["index.ts", "feature.ts", "test.ts"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1 text-xs transition-colors ${
                tab === t
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex -space-x-2">
          {avatars.map((a) => (
            <motion.div
              key={a.i}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#080912] bg-gradient-to-br ${a.c} text-[10px] font-semibold text-white`}
            >
              {a.i}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12">
        <div className="col-span-3 hidden border-r border-white/10 bg-white/[0.01] p-3 sm:block">
          <div className="mb-3 flex items-center gap-2 text-xs text-white/40">
            <Layers className="h-3.5 w-3.5" /> Explorer
          </div>
          {[
            { n: "src", d: 0, icon: false },
            { n: "index.ts", d: 1, icon: true },
            { n: "feature.ts", d: 1, icon: true, active: true },
            { n: "test.ts", d: 1, icon: true },
            { n: "package.json", d: 0, icon: true },
            { n: "README.md", d: 0, icon: true },
          ].map((f, i) => (
            <motion.div
              key={f.n}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.05 }}
              className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs ${
                f.active ? "bg-white/5 text-white" : "text-white/50"
              }`}
              style={{ paddingLeft: `${8 + f.d * 12}px` }}
            >
              {f.icon ? (
                <Code2 className="h-3 w-3 opacity-60" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              {f.n}
            </motion.div>
          ))}
        </div>

        <div className="col-span-12 sm:col-span-9">
          <CodeBlock />
          <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="rounded-xl border border-violet-500/20 bg-violet-500/[0.06] p-3.5 md:col-span-3"
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
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="text-xs leading-relaxed text-white/60"
              >
                I&apos;ve drafted{" "}
                <span className="text-violet-300">5 unit tests</span> and flagged
                a potential <span className="text-amber-300">race condition</span>{" "}
                on line 4. Want me to refactor with a mutex?
              </motion.p>
              <div className="mt-2.5 flex gap-1.5">
                <button
                  type="button"
                  className="rounded-md bg-white/10 px-2 py-1 text-[10px] text-white hover:bg-white/15"
                >
                  Apply fix
                </button>
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-[10px] text-white/40 hover:text-white/70"
                >
                  Explain
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="rounded-xl border border-white/10 bg-black/40 p-3.5 font-mono text-[11px] md:col-span-2"
            >
              <div className="mb-1.5 flex items-center gap-1.5 text-white/40">
                <Terminal className="h-3 w-3" /> terminal
              </div>
              <div className="text-emerald-400">$ npm test</div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 }}
                className="text-white/50"
              >
                ✓ Running… <span className="text-emerald-400">done</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 1.1 }}
                className="text-white/50"
              >
                ✓ 12 passed
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 1.4 }}
                className="flex items-center gap-1 text-emerald-400"
              >
                <CheckCircle2 className="h-3 w-3" /> Ready to commit
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      <LiveCursor
        label="Maya"
        color={LANDING.violet}
        className="left-[42%] top-[44%]"
        delay={0}
      />
      <LiveCursor
        label="Jordan"
        color={LANDING.cyan}
        className="left-[68%] top-[58%]"
        delay={1.5}
      />

      <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-4 py-2 text-[11px] text-white/40">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <GitBranch className="h-3 w-3" /> main
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> 0 errors
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3" /> 3 collaborators
          </span>
          <span className="flex items-center gap-1 text-cyan-400">
            <Rocket className="h-3 w-3" /> Synced
          </span>
        </div>
      </div>
    </div>
  );
}
