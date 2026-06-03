"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Loader2,
  Play,
  Terminal,
} from "lucide-react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppShell, Panel } from "@/components/fixflow/app-shell";
import { Button } from "@/components/ui/button";
import { frameworks } from "@/lib/fixflow-data";
import { useAuth } from "@/lib/auth-context";
import { detectFramework } from "@/lib/detect";
import {
  HistoryAnalysis,
  saveHistoryItem,
} from "@/lib/history";

type Analysis = HistoryAnalysis;

type Detected = {
  language?: string;
  framework?: string;
};

const starterError = `Warning: Text content did not match. Server: "12:00" Client: "12:01"

Error: Hydration failed because the initial UI does not match what was rendered on the server.

  at HeaderClock (src/components/header-clock.tsx:18:12)
  at DashboardLayout (src/app/dashboard/layout.tsx:34:9)`;

export default function AnalyzePage() {
  const [input, setInput] = useState(starterError);
  const [selectedFramework, setSelectedFramework] = useState("Auto");
  const [detected, setDetected] = useState<Detected>(() =>
    detectFramework(starterError)
  );
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { user } = useAuth();

  const previewDetection = useMemo(() => detectFramework(input), [input]);

  const handleAnalyze = useCallback(async () => {
    const text = input.trim();
    setError("");
    setCopied("");

    if (text.length < 8) {
      setError("Paste an error message or stack trace before analyzing.");
      textareaRef.current?.focus();
      return;
    }

    setLoading(true);
    setAnalysis(null);

    const frameworkHint =
      selectedFramework !== "Auto"
        ? selectedFramework
        : previewDetection.framework || previewDetection.language;

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, framework: frameworkHint }),
      });
      const data = await response.json();

      if (!response.ok || !data?.ok || !data?.analysis) {
        throw new Error(data?.error || "Analysis failed.");
      }

      const nextAnalysis = data.analysis as Analysis;
      const nextDetected = (data.detected as Detected | undefined) ?? previewDetection;

      setAnalysis(nextAnalysis);
      setDetected(nextDetected);

      await saveHistoryItem({
        analysis: nextAnalysis,
        framework: frameworkHint,
        input: text,
        userId: user?.id,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }, [input, previewDetection, selectedFramework, user]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        void handleAnalyze();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleAnalyze]);

  async function copyText(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1800);
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      setInput((previous) => (previous.trim() ? `${previous}\n${text}` : text));
      setError("");
    } catch {
      setError("Clipboard access was blocked by the browser.");
    }
  }

  const displayedFramework =
    selectedFramework !== "Auto"
      ? selectedFramework
      : detected.framework ||
        previewDetection.framework ||
        previewDetection.language ||
        "Auto";

  const displayedLanguage =
    detected.language || previewDetection.language || "Waiting for input";

  return (
    <ProtectedRoute>
      <AppShell
        active="Analyze"
        description="Paste any stack trace, warning, dependency error, or failing snippet and get a structured, ranked fix plan."
        title="Error analysis workspace"
        action={
          <>
            <Button
              className="gap-2 border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]"
              onClick={() => {
                setInput(starterError);
                setAnalysis(null);
                setError("");
              }}
              variant="outline"
            >
              <Clock3 className="size-4" />
              Sample
            </Button>
            <Button
              className="gap-2 bg-emerald-400 text-[#071015] hover:bg-emerald-300"
              disabled={loading}
              onClick={handleAnalyze}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}
              {loading ? "Analyzing..." : "Analyze"}
            </Button>
          </>
        }
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
          <div>
            <div className="flex flex-wrap gap-2">
              {frameworks.map((framework) => {
                const isSelected = selectedFramework === framework;

                return (
                  <button
                    className={`h-8 rounded-lg border px-3 text-sm transition ${
                      isSelected
                        ? "border-cyan-300/60 bg-cyan-300/10 text-cyan-100"
                        : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-cyan-300/50 hover:text-cyan-100"
                    }`}
                    key={framework}
                    onClick={() => setSelectedFramework(framework)}
                    type="button"
                  >
                    {framework}
                  </button>
                );
              })}
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
                  onClick={pasteFromClipboard}
                  size="icon-sm"
                  variant="ghost"
                >
                  <Clipboard className="size-4" />
                </Button>
              </div>
              <textarea
                className="min-h-[390px] w-full resize-none bg-transparent p-4 font-mono text-sm leading-6 text-zinc-200 outline-none placeholder:text-zinc-600"
                onChange={(event) => {
                  setInput(event.target.value);
                  setDetected(detectFramework(event.target.value));
                }}
                placeholder="Paste an error, warning, stack trace, or failing snippet..."
                ref={textareaRef}
                spellCheck={false}
                value={input}
              />
            </Panel>

            {error ? (
              <div className="mt-4 rounded-lg border border-rose-300/20 bg-rose-300/10 p-3 text-sm leading-6 text-rose-100">
                {error}
              </div>
            ) : null}

            {copied ? (
              <div className="mt-4 rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm leading-6 text-emerald-100">
                Copied {copied}.
              </div>
            ) : null}

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <MetricCard
                icon={Brain}
                label="Detected"
                meta={displayedLanguage}
                tone="text-cyan-300"
                value={displayedFramework}
              />
              <MetricCard
                icon={Flame}
                label="Severity"
                meta={analysis ? analysis.category : "No analysis yet"}
                tone="text-amber-300"
                value={analysis?.severity ?? "-"}
              />
              <MetricCard
                icon={BadgeCheck}
                label="Fix time"
                meta={analysis ? `${analysis.confidence} confidence` : "Estimated after analysis"}
                tone="text-emerald-300"
                value={analysis?.fixTime ?? "-"}
              />
            </div>
          </div>

          <div className="grid gap-4">
            <Panel>
              <div className="flex flex-col gap-3 border-b border-white/10 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-200">
                    <Check className="size-4" />
                    {analysis ? "Analysis complete" : "Ready"}
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-white">
                    {analysis?.rootCause ?? "Run analysis to generate a fix plan."}
                  </h2>
                </div>
                <Button
                  aria-label="Copy analysis"
                  className="self-start text-zinc-400 hover:text-zinc-100 md:self-auto"
                  disabled={!analysis}
                  onClick={() =>
                    analysis
                      ? copyText(JSON.stringify(analysis, null, 2), "analysis")
                      : undefined
                  }
                  size="icon-sm"
                  variant="ghost"
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              <div className="grid gap-4 p-4 md:grid-cols-[1fr_220px]">
                <p className="text-sm leading-6 text-zinc-300">
                  {analysis?.explanation ??
                    "FixFlow will explain what happened, why it happened, and which fix is most likely to work."}
                </p>
                <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-cyan-100">
                    <Lightbulb className="size-4" />
                    Prevention
                  </div>
                  <p className="mt-2 text-xs leading-5 text-cyan-100/75">
                    {analysis?.prevention ??
                      "Prevention tips appear here after analysis."}
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
                {(analysis?.errorMap ?? [
                  "Paste error",
                  "Detect pattern",
                  "Generate fix plan",
                ]).map((step, index, items) => (
                  <div className="contents" key={step}>
                    <MapStep label={step} step={`Step ${index + 1}`} />
                    {index < items.length - 1 ? (
                      index === 1 ? (
                        <AlertTriangle className="hidden size-5 text-amber-300 md:block" />
                      ) : (
                        <ArrowRight className="hidden size-5 text-zinc-600 md:block" />
                      )
                    ) : null}
                  </div>
                ))}
              </div>
            </Panel>

            <section className="grid gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium uppercase text-zinc-500">
                  Ranked fixes
                </h2>
                <Button
                  className="gap-2 text-zinc-300"
                  disabled={!analysis?.solutions?.length}
                  onClick={() =>
                    analysis
                      ? copyText(
                          analysis.solutions
                            .map((solution) => `${solution.rank}. ${solution.title}\n${solution.snippet}`)
                            .join("\n\n"),
                          "all fixes"
                        )
                      : undefined
                  }
                  size="sm"
                  variant="ghost"
                >
                  <Copy className="size-3.5" />
                  Copy all
                </Button>
              </div>

              {analysis?.solutions?.length ? (
                analysis.solutions.map((solution) => (
                  <Panel key={solution.rank}>
                    <div className="flex flex-col gap-3 border-b border-white/10 p-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex gap-3">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-white/[0.06] font-mono text-sm text-cyan-200">
                          {solution.rank}
                        </span>
                        <div>
                          <h3 className="font-medium text-white">
                            {solution.title}
                          </h3>
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
                        onClick={() => copyText(solution.snippet, `fix ${solution.rank}`)}
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
                ))
              ) : (
                <Panel className="p-4 text-sm leading-6 text-zinc-400">
                  Ranked fixes will appear after a successful analysis.
                </Panel>
              )}
            </section>

            <Panel className="p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                <FileCode2 className="size-4 text-emerald-300" />
                Learning mode
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {(analysis?.learningTips ?? [
                  "Read the first stack frame in your code.",
                  "Compare the failing value with the expected value.",
                  "Save the fix pattern for next time.",
                ]).map((lesson) => (
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
    </ProtectedRoute>
  );
}

function MetricCard({
  icon: Icon,
  label,
  meta,
  tone,
  value,
}: {
  icon: React.ElementType;
  label: string;
  meta: string;
  tone: string;
  value: string;
}) {
  return (
    <Panel className="p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
        <Icon className={`size-4 ${tone}`} />
        {label}
      </div>
      <p className="mt-2 break-words text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{meta}</p>
    </Panel>
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
