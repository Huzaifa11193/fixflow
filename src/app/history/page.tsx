"use client";

import { Archive, Copy, Filter, RefreshCw, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppShell, Panel } from "@/components/fixflow/app-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import {
  clearLocalHistory,
  deleteHistoryItem,
  formatHistoryTime,
  getSeverityTone,
  HistoryItem,
  loadHistory,
  subscribeToHistory,
} from "@/lib/history";

export default function HistoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("All");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");

  async function refreshHistory() {
    setLoading(true);
    const nextItems = await loadHistory(user?.id);
    setItems(nextItems);
    setLoading(false);
  }

  useEffect(() => {
    void refreshHistory();
    return subscribeToHistory(() => void refreshHistory());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSeverity =
        severity === "All" || item.analysis.severity === severity;
      const matchesQuery =
        !needle ||
        [
          item.title,
          item.input,
          item.framework,
          item.analysis.category,
          item.analysis.rootCause,
          item.analysis.explanation,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle);

      return matchesSeverity && matchesQuery;
    });
  }, [items, query, severity]);

  const stats = useMemo(() => {
    const high = items.filter((item) => item.analysis.severity === "High").length;
    const medium = items.filter((item) => item.analysis.severity === "Medium").length;
    const mostCommon = mostCommonCategory(items);

    return {
      total: items.length,
      high,
      medium,
      mostCommon,
    };
  }, [items]);

  async function copyItem(item: HistoryItem) {
    await navigator.clipboard.writeText(
      [
        item.title,
        "",
        item.analysis.explanation,
        "",
        "Root cause:",
        item.analysis.rootCause,
        "",
        "Fixes:",
        ...item.analysis.solutions.map(
          (solution) => `${solution.rank}. ${solution.title}\n${solution.snippet}`
        ),
      ].join("\n")
    );
    setCopied(item.id);
    window.setTimeout(() => setCopied(""), 1600);
  }

  async function removeItem(item: HistoryItem) {
    await deleteHistoryItem(item, user?.id);
    setItems((current) => current.filter((entry) => entry.id !== item.id));
  }

  return (
    <ProtectedRoute>
      <AppShell
        active="History"
        description="Review past analyses, reuse successful fixes, and build a searchable memory of the bugs you solve most often."
        title="Error history"
        action={
          <>
            <Button
              className="gap-2 border-white/10 bg-white/[0.04] text-zinc-200"
              onClick={refreshHistory}
              variant="outline"
            >
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Button
              className="gap-2 bg-cyan-400 text-[#071015] hover:bg-cyan-300"
              onClick={() => {
                clearLocalHistory(user?.id);
                setItems([]);
              }}
            >
              <Archive className="size-4" />
              Clear local
            </Button>
          </>
        }
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Panel>
            <div className="grid gap-3 border-b border-white/10 p-4 md:grid-cols-[1fr_auto]">
              <div className="flex h-11 items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3">
                <Search className="size-4 text-zinc-500" />
                <input
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search errors, files, packages, or frameworks"
                  value={query}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-zinc-500" />
                <select
                  className="h-11 rounded-lg border border-white/10 bg-[#11161d] px-3 text-sm text-zinc-200 outline-none"
                  onChange={(event) => setSeverity(event.target.value)}
                  value={severity}
                >
                  <option>All</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
            </div>

            <div className="divide-y divide-white/10">
              {loading ? (
                <div className="p-6 text-sm text-zinc-400">Loading history...</div>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <article
                    className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_auto]"
                    key={item.id}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-2 rounded-full bg-current ${getSeverityTone(
                            item.analysis.severity
                          )}`}
                        />
                        <h2 className="truncate font-medium text-white">
                          {item.title}
                        </h2>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">
                        {item.analysis.rootCause || item.analysis.explanation}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-md bg-white/[0.05] px-2 py-1 text-zinc-300">
                          {item.analysis.category}
                        </span>
                        <span className="rounded-md bg-amber-300/10 px-2 py-1 text-amber-200">
                          {item.analysis.severity}
                        </span>
                        <span className="rounded-md bg-emerald-300/10 px-2 py-1 text-emerald-200">
                          {item.analysis.confidence} confidence
                        </span>
                        <span className="rounded-md bg-cyan-300/10 px-2 py-1 text-cyan-200">
                          {formatHistoryTime(item.createdAt)}
                        </span>
                        <span className="rounded-md bg-white/[0.05] px-2 py-1 text-zinc-400">
                          {item.source}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Button
                        aria-label="Copy fix"
                        onClick={() => copyItem(item)}
                        size="icon-sm"
                        variant="ghost"
                      >
                        <Copy className="size-4" />
                      </Button>
                      <Button
                        aria-label="Delete item"
                        onClick={() => removeItem(item)}
                        size="icon-sm"
                        variant="ghost"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    {copied === item.id ? (
                      <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-2 text-xs text-emerald-100 md:col-span-2">
                        Copied analysis and fixes.
                      </div>
                    ) : null}
                  </article>
                ))
              ) : (
                <div className="p-6">
                  <p className="font-medium text-white">No matching history yet.</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Analyze an error on the workspace page and it will appear here
                    automatically.
                  </p>
                </div>
              )}
            </div>
          </Panel>

          <div className="grid gap-4">
            <Panel className="p-4">
              <p className="text-sm font-medium text-zinc-200">Total analyses</p>
              <p className="mt-2 text-4xl font-semibold text-white">
                {stats.total}
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Saved locally first, then synced to Supabase when available.
              </p>
            </Panel>
            <Panel className="p-4">
              <p className="text-sm font-medium text-zinc-200">Risk mix</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {stats.high} high / {stats.medium} medium
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Helps prioritize repeated production-impacting errors.
              </p>
            </Panel>
            <Panel className="p-4">
              <p className="text-sm font-medium text-zinc-200">
                Most common category
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {stats.mostCommon || "-"}
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Pattern pages can use this same history data later.
              </p>
            </Panel>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

function mostCommonCategory(items: HistoryItem[]) {
  const counts = new Map<string, number>();

  for (const item of items) {
    const category = item.analysis.category || "Unknown";
    counts.set(category, (counts.get(category) || 0) + 1);
  }

  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}
