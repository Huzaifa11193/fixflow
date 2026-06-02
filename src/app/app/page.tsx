import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Brain,
  Check,
  Clipboard,
  Clock3,
  Copy,
  FileCode2,
  Flame,
  GitBranch,
  Lightbulb,
  Play,
  Terminal,
} from "lucide-react";

import { AppShell, Panel } from "@/components/fixflow/app-shell";
import { Button } from "@/components/ui/button";
import { frameworks, solutions } from "@/lib/fixflow-data";

export default function AnalyzePage() {
  return (
    <AppShell
      active="Analyze"
      description="Paste any stack trace, warning, dependency error, or failing snippet and see how FixFlow will explain, rank, and prevent it."
      title="Error analysis workspace"
      action={
        <>
          <Button
            className="gap-2 border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]"
            variant="outline"
          >
            <Clock3 className="size-4" />
            Recent
          </Button>
          <Button className="gap-2 bg-emerald-400 text-[#071015] hover:bg-emerald-300">
            <Play className="size-4" />
            Analyze
          </Button>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
        <div>
          <div className="flex flex-wrap gap-2">
            {frameworks.map((framework) => (
              <button
                className="h-8 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-zinc-300 transition hover:border-cyan-300/50 hover:text-cyan-100 first:border-cyan-300/60 first:bg-cyan-300/10 first:text-cyan-100"
                key={framework}
                type="button"
              >
                {framework}
              </button>
            ))}
          </div>

          <Panel className="mt-4">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                <Terminal className="size-4 text-cyan-300" />
                Smart Paste
              </div>
              <Button
                aria-label="Paste from clipboard"
                className="text-zinc-400 hover:text-zinc-100"
                size="icon-sm"
                variant="ghost"
              >
                <Clipboard className="size-4" />
              </Button>
            </div>
            <textarea
              className="min-h-[390px] w-full resize-none bg-transparent p-4 font-mono text-sm leading-6 text-zinc-200 outline-none placeholder:text-zinc-600"
              defaultValue={`Warning: Text content did not match. Server: "12:00" Client: "12:01"\n\nError: Hydration failed because the initial UI does not match what was rendered on the server.\n\n  at HeaderClock (src/components/header-clock.tsx:18:12)\n  at DashboardLayout (src/app/dashboard/layout.tsx:34:9)`}
              spellCheck={false}
            />
          </Panel>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              {
                icon: Brain,
                label: "Detected",
                value: "Next.js",
                meta: "React hydration",
                tone: "text-cyan-300",
              },
              {
                icon: Flame,
                label: "Severity",
                value: "Medium",
                meta: "Visible UI mismatch",
                tone: "text-amber-300",
              },
              {
                icon: BadgeCheck,
                label: "Fix time",
                value: "2 min",
                meta: "Estimated",
                tone: "text-emerald-300",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <Panel className="p-4" key={item.label}>
                  <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                    <Icon className={`size-4 ${item.tone}`} />
                    {item.label}
                  </div>
                  <p className="mt-2 text-2xl font-semibold">{item.value}</p>
                  <p className="mt-1 text-xs text-zinc-500">{item.meta}</p>
                </Panel>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4">
          <Panel>
            <div className="flex flex-col gap-3 border-b border-white/10 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-200">
                  <Check className="size-4" />
                  Analysis complete
                </div>
                <h2 className="mt-2 text-lg font-semibold text-white">
                  Server and client render different first markup.
                </h2>
              </div>
              <Button
                aria-label="Copy analysis"
                className="self-start text-zinc-400 hover:text-zinc-100 md:self-auto"
                size="icon-sm"
                variant="ghost"
              >
                <Copy className="size-4" />
              </Button>
            </div>
            <div className="grid gap-4 p-4 md:grid-cols-[1fr_220px]">
              <p className="text-sm leading-6 text-zinc-300">
                The component renders a time value during server rendering, then
                the browser calculates a newer value before hydration finishes.
                React sees different text nodes and discards the server HTML for
                that subtree.
              </p>
              <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-cyan-100">
                  <Lightbulb className="size-4" />
                  Prevention
                </div>
                <p className="mt-2 text-xs leading-5 text-cyan-100/75">
                  Keep first render deterministic. Move browser-only values into
                  effects or render a stable fallback.
                </p>
              </div>
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
              <GitBranch className="size-4 text-amber-300" />
              Visual error map
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
              <MapStep label="Server HTML" step="Step 1" />
              <ArrowRight className="hidden size-5 text-zinc-600 md:block" />
              <MapStep label="Client render" step="Step 2" />
              <AlertTriangle className="hidden size-5 text-amber-300 md:block" />
              <MapStep label="Hydration check" step="Step 3" />
            </div>
          </Panel>

          <section className="grid gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium uppercase text-zinc-500">
                Ranked fixes
              </h2>
              <Button className="gap-2 text-zinc-300" size="sm" variant="ghost">
                <Copy className="size-3.5" />
                Copy all
              </Button>
            </div>

            {solutions.map((solution) => (
              <Panel key={solution.rank}>
                <div className="flex flex-col gap-3 border-b border-white/10 p-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-white/[0.06] font-mono text-sm text-cyan-200">
                      {solution.rank}
                    </span>
                    <div>
                      <h3 className="font-medium text-white">{solution.title}</h3>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-md bg-emerald-400/10 px-2 py-1 text-emerald-200">
                          {solution.confidence} success
                        </span>
                        <span className="rounded-md bg-white/[0.05] px-2 py-1 text-zinc-400">
                          {solution.effort} effort
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    aria-label={`Copy fix ${solution.rank}`}
                    className="self-start text-zinc-400 hover:text-zinc-100"
                    size="icon-sm"
                    variant="ghost"
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
                <pre className="overflow-x-auto p-4 text-sm leading-6 text-zinc-300">
                  <code>{solution.snippet}</code>
                </pre>
              </Panel>
            ))}
          </section>

          <Panel className="p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
              <FileCode2 className="size-4 text-emerald-300" />
              Learning mode
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                "Why hydration exists",
                "How to spot unstable values",
                "Pre-commit checks to prevent it",
              ].map((lesson) => (
                <button
                  className="flex min-h-20 items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-3 text-left text-sm text-zinc-200 transition hover:border-emerald-300/40 hover:bg-emerald-300/10"
                  key={lesson}
                  type="button"
                >
                  <span>{lesson}</span>
                  <FileCode2 className="size-4 text-zinc-500" />
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

function MapStep({ label, step }: { label: string; step: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs text-zinc-500">{step}</p>
      <p className="mt-1 text-sm font-medium text-zinc-100">{label}</p>
    </div>
  );
}
