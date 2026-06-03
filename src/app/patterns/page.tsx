"use client";

import { AlertTriangle, BarChart3, TrendingDown, TrendingUp } from "lucide-react";

import { AppShell, Panel } from "@/components/fixflow/app-shell";
import { patternStats } from "@/lib/fixflow-data";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function PatternsPage() {
  return (
    <ProtectedRoute>
      <AppShell
      active="Patterns"
      description="Spot repeated mistakes before they become habits. This view turns history into proactive prevention."
      title="Patterns and prevention"
    >
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-4">
          {patternStats.map((item) => (
            <Panel className="p-4" key={item.label}>
              <div className="flex items-center justify-between">
                <span className={`size-2 rounded-full ${item.tone}`} />
                {item.trend.startsWith("+") ? (
                  <TrendingUp className="size-4 text-amber-300" />
                ) : (
                  <TrendingDown className="size-4 text-emerald-300" />
                )}
              </div>
              <p className="mt-4 text-3xl font-semibold text-white">{item.count}</p>
              <p className="mt-1 text-sm text-zinc-400">{item.label}</p>
              <p className="mt-3 text-xs text-zinc-500">{item.trend} this week</p>
            </Panel>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <Panel className="p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
              <BarChart3 className="size-4 text-cyan-300" />
              Weekly error map
            </div>
            <div className="mt-6 grid h-80 grid-cols-7 items-end gap-3">
              {[44, 62, 38, 74, 52, 88, 59].map((height, index) => (
                <div className="flex h-full flex-col justify-end gap-2" key={height}>
                  <div
                    className="rounded-t-lg bg-cyan-300/70"
                    style={{ height: `${height}%` }}
                  />
                  <p className="text-center text-xs text-zinc-500">D{index + 1}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-200">
              <AlertTriangle className="size-4" />
              Prevention queue
            </div>
            <div className="mt-4 space-y-3">
              {[
                "Add a hydration checklist before shipping dashboard widgets.",
                "Lock package versions before deploying Prisma changes.",
                "Add alias import linting for shared UI components.",
              ].map((item) => (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm leading-6 text-zinc-300" key={item}>
                  {item}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
    </ProtectedRoute>
  );
}
