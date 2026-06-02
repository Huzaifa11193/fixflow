import Link from "next/link";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  FileCode2,
  GitBranch,
  History,
  Play,
  ShieldCheck,
  Terminal,
  Zap,
} from "lucide-react";

import { LogoLockup, LogoMark } from "@/components/fixflow/logo";

const fixes = [
  "Next.js hydration mismatch",
  "Module not found: prisma",
  "Python import cycle",
  "Tailwind class not applying",
];

const steps = [
  { icon: Terminal, title: "Paste error", text: "Drop in a stack trace, warning, or code snippet." },
  { icon: Brain, title: "Understand context", text: "Detects language, framework, cause, and risk." },
  { icon: GitBranch, title: "Apply the fix", text: "Ranks solutions with snippets and prevention tips." },
];

const stats = [
  ["2 min", "target fix time"],
  ["20+", "stacks planned"],
  ["5", "offline cached fixes"],
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070a0f] text-zinc-100">
      <section className="relative min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_75%_10%,rgba(52,211,153,0.12),transparent_24%),linear-gradient(180deg,#070a0f_0%,#0b0d10_58%,#0f1318_100%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="pointer-events-none absolute left-1/2 top-20 h-80 w-80 -translate-x-1/2 rounded-full border border-cyan-300/20 animate-[spin_18s_linear_infinite]" />
        <div className="pointer-events-none absolute left-[12%] top-[32%] h-24 w-24 rounded-full border border-emerald-300/20 animate-[float_7s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute right-[10%] top-[18%] h-32 w-32 rounded-full border border-amber-300/20 animate-[float_9s_ease-in-out_infinite_reverse]" />

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-5 md:px-6">
          <Link className="flex items-center gap-3" href="/">
            <LogoLockup subtitle="One-click bug resolver" />
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-zinc-400 md:flex">
            <a className="transition hover:text-white" href="#workflow">Workflow</a>
            <a className="transition hover:text-white" href="#features">Features</a>
            <Link className="transition hover:text-white" href="/pricing">Pricing</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              className="inline-flex h-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-sm font-medium text-zinc-100 transition hover:bg-white/[0.08]"
              href="/auth/sign-in"
            >
              Login
            </Link>
            <Link
              className="hidden h-8 items-center justify-center rounded-lg bg-emerald-400 px-2.5 text-sm font-medium text-[#071015] transition hover:bg-emerald-300 sm:inline-flex"
              href="/auth/sign-up"
            >
              Sign up
            </Link>
          </div>
        </header>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-10 md:px-6 lg:min-h-[calc(100vh-88px)] lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:pt-0">
          <div>
            <div className="inline-flex animate-[fadeUp_700ms_ease-out_both] items-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-sm text-cyan-100">
              <LogoMark className="size-5" />
              Built for daily developer errors
            </div>
            <h1 className="mt-6 max-w-3xl animate-[fadeUp_800ms_ease-out_100ms_both] text-5xl font-semibold leading-tight text-white md:text-7xl">
              Paste an error. Get the cause, fix, and lesson.
            </h1>
            <p className="mt-6 max-w-2xl animate-[fadeUp_900ms_ease-out_200ms_both] text-base leading-7 text-zinc-400 md:text-lg">
              FixFlow is a smart developer workspace for stack traces, warnings,
              dependency failures, runtime bugs, and framework-specific errors.
              It explains what happened, ranks fixes, and teaches prevention.
            </p>
            <div className="mt-8 flex animate-[fadeUp_900ms_ease-out_300ms_both] flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-cyan-400 px-5 text-sm font-medium text-[#071015] transition hover:bg-cyan-300"
                href="/app"
              >
                Open workspace
                <ArrowRight className="size-4" />
              </Link>
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-5 text-sm font-medium text-zinc-100 transition hover:bg-white/[0.08]"
                href="/auth/sign-up"
              >
                Create account
                <ShieldCheck className="size-4" />
              </Link>
            </div>
            <div className="mt-10 grid max-w-xl animate-[fadeUp_900ms_ease-out_400ms_both] grid-cols-3 gap-3">
              {stats.map(([value, label]) => (
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3" key={label}>
                  <p className="text-2xl font-semibold text-white">{value}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-[fadeUp_900ms_ease-out_250ms_both]">
            <div className="absolute -inset-4 rounded-[24px] border border-cyan-300/20 bg-cyan-300/5 blur-2xl" />
            <div className="relative rounded-lg border border-white/10 bg-[#11161d]/95 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                  <Terminal className="size-4 text-cyan-300" />
                  Smart Paste
                </div>
                <span className="rounded-md bg-emerald-300/10 px-2 py-1 text-xs text-emerald-200">
                  live preview
                </span>
              </div>
              <div className="grid gap-4 p-4 xl:grid-cols-[1fr_0.9fr]">
                <div className="rounded-lg border border-white/10 bg-[#080b10] p-4 font-mono text-sm leading-6 text-zinc-300">
                  <p className="text-rose-300">Error: Hydration failed</p>
                  <p className="mt-3 text-zinc-500">at HeaderClock</p>
                  <p className="text-zinc-500">src/components/header-clock.tsx:18</p>
                  <div className="mt-5 h-2 w-3/4 animate-pulse rounded-full bg-cyan-300/30" />
                  <div className="mt-3 h-2 w-1/2 animate-pulse rounded-full bg-emerald-300/25" />
                </div>
                <div className="grid gap-3">
                  {[
                    ["Root cause", "Browser-only time changed before hydration."],
                    ["Best fix", "Move unstable value behind client mount."],
                    ["Prevention", "Keep first render deterministic."],
                  ].map(([label, text]) => (
                    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3" key={label}>
                      <div className="flex items-center gap-2 text-sm font-medium text-white">
                        <CheckCircle2 className="size-4 text-emerald-300" />
                        {label}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-white/10 p-4">
                <div className="flex flex-wrap gap-2">
                  {fixes.map((fix, index) => (
                    <span
                      className="animate-[slideLoop_10s_linear_infinite] rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-zinc-300"
                      key={fix}
                      style={{ animationDelay: `${index * -1.4}s` }}
                    >
                      {fix}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-y border-white/10 bg-[#0f1318] px-4 py-16 md:px-6" id="workflow">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase text-emerald-300">Workflow</p>
            <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
              A focused flow from confusion to confidence.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/[0.05]" key={step.title}>
                  <div className="flex size-11 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-200">
                    <Icon className="size-5" />
                  </div>
                  <p className="mt-5 text-xs text-zinc-500">0{index + 1}</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">{step.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:px-6" id="features">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            [Brain, "Deep analysis", "Clear explanation, root cause, ranked fixes."],
            [History, "History", "Save repeated errors and successful solutions."],
            [FileCode2, "Learning mode", "Short lessons after every fix."],
            [Zap, "Editor-ready", "Designed for future one-click apply."],
          ].map(([Icon, title, text]) => {
            const FeatureIcon = Icon as typeof Brain;
            return (
              <div className="rounded-lg border border-white/10 bg-[#151a21] p-5" key={title as string}>
                <FeatureIcon className="size-5 text-emerald-300" />
                <h3 className="mt-4 font-semibold text-white">{title as string}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{text as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-4 pb-16 md:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-lg border border-white/10 bg-cyan-300/10 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-cyan-100">Ready to try the workspace?</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Start with the full FixFlow app UI.</h2>
          </div>
          <Link
            className="inline-flex h-8 items-center justify-center gap-2 rounded-lg bg-cyan-400 px-2.5 text-sm font-medium text-[#071015] transition hover:bg-cyan-300"
            href="/app"
          >
            Launch app
            <Play className="size-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
