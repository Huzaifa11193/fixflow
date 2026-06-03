"use client";

import {
  AlertTriangle,
  BarChart3,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppShell, Panel } from "@/components/fixflow/app-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import {
  formatHistoryTime,
  getSeverityTone,
  HistoryItem,
  loadHistory,
  subscribeToHistory,
} from "@/lib/history";

type PatternCard = {
  label: string;
  count: number;
  high: number;
  medium: number;
  trend: number;
};

export default function PatternsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);

  async function refreshPatterns() {
    setLoading(true);
    const history = await loadHistory(user?.id);
    setItems(history);
    setLoading(false);
  }

  useEffect(() => {
    void refreshPatterns();
    return subscribeToHistory(() => void refreshPatterns());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const patternCards = useMemo(() => buildPatternCards(items), [items]);
  const weeklyBars = useMemo(() => buildWeeklyBars(items), [items]);
  const preventionQueue = useMemo(() => buildPreventionQueue(items), [items]);
  const selectedItems = useMemo(() => {
    const label = selectedPattern || patternCards[0]?.label;
    if (!label) return [];
    return items.filter((item) => item.analysis.category === label).slice(0, 5);
  }, [items, patternCards, selectedPattern]);

  return (
    <ProtectedRoute>
      <AppShell
        active="Patterns"
        description="Spot repeated mistakes before they become habits. This view turns saved analyses into proactive prevention."
        title="Patterns and prevention"
        action={
          <Button
            className="gap-2 border-white/10 bg-white/[0.04] text-zinc-200"
            onClick={refreshPatterns}
            variant="outline"
          >
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        }
      >
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-4">
            {patternCards.length > 0 ? (
              patternCards.slice(0, 4).map((item) => (
                <button
                  className={`rounded-lg border p-4 text-left transition hover:-translate-y-0.5 ${
                    (selectedPattern || patternCards[0]?.label) === item.label
                      ? "border-cyan-300/50 bg-cyan-300/10"
                      : "border-white/10 bg-[#151a21] hover:border-white/20"
                  }`}
                  key={item.label}
                  onClick={() => setSelectedPattern(item.label)}
                  type="button"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`size-2 rounded-full ${
                        item.high > 0 ? "bg-rose-300" : item.medium > 0 ? "bg-amber-300" : "bg-emerald-300"
                      }`}
                    />
                    {item.trend >= 0 ? (
                      <TrendingUp className="size-4 text-amber-300" />
                    ) : (
                      <TrendingDown className="size-4 text-emerald-300" />
                    )}
                  </div>
                  <p className="mt-4 text-3xl font-semibold text-white">
                    {item.count}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">{item.label}</p>
                  <p className="mt-3 text-xs text-zinc-500">
                    {formatTrend(item.trend)} vs previous 7 days
                  </p>
                </button>
              ))
            ) : (
              <EmptyPatternCards loading={loading} />
            )}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <Panel className="p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                <BarChart3 className="size-4 text-cyan-300" />
                Weekly error map
              </div>
              <div className="mt-6 grid h-80 grid-cols-7 items-end gap-3">
                {weeklyBars.map((bar) => (
                  <div className="flex h-full flex-col justify-end gap-2" key={bar.label}>
                    <div
                      className="rounded-t-lg bg-cyan-300/70 transition-all"
                      style={{ height: `${Math.max(bar.height, 6)}%` }}
                      title={`${bar.count} analyses`}
                    />
                    <p className="text-center text-xs text-zinc-500">{bar.label}</p>
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
                {preventionQueue.length > 0 ? (
                  preventionQueue.map((item) => (
                    <div
                      className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
                      key={item}
                    >
                      <p className="text-sm leading-6 text-zinc-300">{item}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm leading-6 text-zinc-400">
                    Analyze a few errors to generate prevention tasks.
                  </div>
                )}
              </div>
            </Panel>
          </div>

          <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
            <Panel className="p-4">
              <p className="text-sm font-medium text-zinc-200">Pattern health</p>
              <div className="mt-4 grid gap-3">
                <HealthRow
                  label="Total saved analyses"
                  value={String(items.length)}
                />
                <HealthRow
                  label="Repeated categories"
                  value={String(patternCards.filter((item) => item.count > 1).length)}
                />
                <HealthRow
                  label="High severity patterns"
                  value={String(patternCards.filter((item) => item.high > 0).length)}
                />
              </div>
            </Panel>

            <Panel>
              <div className="border-b border-white/10 p-4">
                <p className="text-sm font-medium text-zinc-200">
                  Recent examples for {selectedPattern || patternCards[0]?.label || "patterns"}
                </p>
              </div>
              <div className="divide-y divide-white/10">
                {selectedItems.length > 0 ? (
                  selectedItems.map((item) => (
                    <article className="p-4" key={item.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-2 rounded-full bg-current ${getSeverityTone(
                            item.analysis.severity
                          )}`}
                        />
                        <h3 className="truncate font-medium text-white">
                          {item.title}
                        </h3>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">
                        {item.analysis.rootCause}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-md bg-white/[0.05] px-2 py-1 text-zinc-300">
                          {item.analysis.severity}
                        </span>
                        <span className="rounded-md bg-cyan-300/10 px-2 py-1 text-cyan-200">
                          {formatHistoryTime(item.createdAt)}
                        </span>
                        <span className="rounded-md bg-emerald-300/10 px-2 py-1 text-emerald-200">
                          {item.analysis.fixTime}
                        </span>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="p-6 text-sm leading-6 text-zinc-400">
                    No pattern examples yet. Analyze errors on the workspace to
                    populate this page.
                  </div>
                )}
              </div>
            </Panel>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

function buildPatternCards(items: HistoryItem[]): PatternCard[] {
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const groups = new Map<string, PatternCard>();

  for (const item of items) {
    const label = item.analysis.category || "Unknown";
    const created = Date.parse(item.createdAt);
    const isCurrentWeek = !Number.isNaN(created) && now - created <= sevenDays;
    const isPreviousWeek =
      !Number.isNaN(created) && now - created > sevenDays && now - created <= 2 * sevenDays;
    const current = groups.get(label) || {
      label,
      count: 0,
      high: 0,
      medium: 0,
      trend: 0,
    };

    current.count += 1;
    if (item.analysis.severity === "High") current.high += 1;
    if (item.analysis.severity === "Medium") current.medium += 1;
    if (isCurrentWeek) current.trend += 1;
    if (isPreviousWeek) current.trend -= 1;
    groups.set(label, current);
  }

  return Array.from(groups.values()).sort((a, b) => b.count - a.count);
}

function buildWeeklyBars(items: HistoryItem[]) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return {
      date,
      count: 0,
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      height: 0,
    };
  });

  for (const item of items) {
    const created = new Date(item.createdAt);
    created.setHours(0, 0, 0, 0);
    const day = days.find((entry) => entry.date.getTime() === created.getTime());
    if (day) day.count += 1;
  }

  const max = Math.max(...days.map((day) => day.count), 1);
  return days.map((day) => ({
    ...day,
    height: Math.round((day.count / max) * 100),
  }));
}

function buildPreventionQueue(items: HistoryItem[]) {
  const unique = new Set<string>();

  for (const item of items) {
    if (item.analysis.prevention) unique.add(item.analysis.prevention);
    for (const action of item.analysis.nextActions || []) unique.add(action);
  }

  return Array.from(unique).slice(0, 6);
}

function formatTrend(value: number) {
  if (value === 0) return "No change";
  return `${value > 0 ? "+" : ""}${value}`;
}

function HealthRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <span className="text-sm text-zinc-400">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

function EmptyPatternCards({ loading }: { loading: boolean }) {
  return (
    <>
      {[0, 1, 2, 3].map((item) => (
        <Panel className="p-4" key={item}>
          <p className="text-3xl font-semibold text-white">0</p>
          <p className="mt-2 text-sm text-zinc-400">
            {loading ? "Loading..." : "No history yet"}
          </p>
          <p className="mt-3 text-xs text-zinc-500">Analyze errors to build patterns</p>
        </Panel>
      ))}
    </>
  );
}
