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
  Target,
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
  const [historyWarning, setHistoryWarning] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState("");
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { user } = useAuth();

  const previewDetection = useMemo(() => detectFramework(input), [input]);

  const handleAnalyze = useCallback(async () => {
    const text = input.trim();
    setError("");
    setHistoryWarning("");
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
      const rawResponse = await response.text();
      let data: {
        ok?: boolean;
        error?: string;
        analysis?: Analysis;
        detected?: Detected;
      } | null = null;

      try {
        data = JSON.parse(rawResponse);
      } catch {
        throw new Error(
          response.ok
            ? "Analyzer returned an unreadable response. Restart the dev server and try again."
            : "Analyzer returned a server error page. Restart the dev server and try again."
        );
      }

      if (!response.ok || !data?.ok || !data?.analysis) {
        throw new Error(data?.error || "Analysis failed.");
      }

      const nextAnalysis = normalizeAnalysis(data.analysis);
      const nextDetected = (data.detected as Detected | undefined) ?? previewDetection;

      setAnalysis(nextAnalysis);
      setDetected(nextDetected);
      setActiveLesson(nextAnalysis.learningTips?.[0] || null);

      try {
        await saveHistoryItem({
          analysis: nextAnalysis,
          framework: frameworkHint,
          input: text,
          userId: user?.id,
        });
      } catch {
        setHistoryWarning(
          "Analysis completed, but history could not be saved in this browser/session."
        );
      }
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
        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="min-w-0">
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
                className="min-h-[320px] w-full resize-none bg-transparent p-3 font-mono text-sm leading-6 text-zinc-200 outline-none placeholder:text-zinc-600 sm:min-h-[390px] sm:p-4"
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

            {historyWarning ? (
              <div className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100">
                {historyWarning}
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

          <div className="grid min-w-0 gap-4">
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
              <div className="grid min-w-0 gap-4 p-4 md:grid-cols-[minmax(0,1fr)_220px]">
                <p className="break-words text-sm leading-6 text-zinc-300">
                  {analysis?.explanation ??
                    "FixFlow will explain what happened, why it happened, and which fix is most likely to work."}
                </p>
                <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-cyan-100">
                    <Lightbulb className="size-4" />
                    Prevention
                  </div>
                  <p className="mt-2 break-words text-xs leading-5 text-cyan-100/75">
                    {analysis?.prevention ??
                      "Prevention tips appear here after analysis."}
                  </p>
                </div>
              </div>
              {analysis ? (
                <div className="grid gap-3 border-t border-white/10 p-4 md:grid-cols-2">
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-xs font-medium uppercase text-zinc-500">
                      Impact
                    </p>
                    <p className="mt-2 break-words text-sm leading-6 text-zinc-300">
                      {analysis.impact || "Impact estimate will appear here."}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-xs font-medium uppercase text-zinc-500">
                      Confidence reason
                    </p>
                    <p className="mt-2 break-words text-sm leading-6 text-zinc-300">
                      {analysis.confidenceReason ||
                        "Confidence explanation will appear here."}
                    </p>
                  </div>
                </div>
              ) : null}
            </Panel>

            <Panel className="p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                <Target className="size-4 text-cyan-300" />
                Diagnostic signals
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {(analysis?.diagnostics ?? [
                  { label: "Pattern", value: "Waiting for analysis" },
                  { label: "Evidence", value: "Paste a complete stack trace" },
                ]).map((item) => (
                  <div
                    className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
                    key={`${item.label}-${item.value}`}
                  >
                    <p className="text-xs text-zinc-500">{item.label}</p>
                    <p className="mt-1 break-words text-sm font-medium text-zinc-100">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-3">
                <p className="text-xs font-medium uppercase text-emerald-100/70">
                  Next actions
                </p>
                <div className="mt-3 grid gap-2">
                  {(analysis?.nextActions ?? [
                    "Analyze an error to get a prioritized next step.",
                    "Apply only one fix at a time, then re-run the app.",
                  ]).map((action, index) => (
                    <div
                      className="grid grid-cols-[24px_1fr] gap-2 text-sm leading-6 text-emerald-100/85"
                      key={action}
                    >
                      <span className="flex size-6 items-center justify-center rounded-md bg-emerald-300/15 text-xs">
                        {index + 1}
                      </span>
                      <span className="min-w-0 break-words">{action}</span>
                    </div>
                  ))}
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
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
                    <pre className="max-w-full overflow-x-auto whitespace-pre p-4 text-sm leading-6 text-zinc-300">
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
                ]).map((lesson, index) => (
                  <button
                    className={`grid min-h-20 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-lg border p-3 text-left text-sm transition ${
                      activeLesson === lesson
                        ? "border-emerald-300/50 bg-emerald-300/10 text-emerald-50"
                        : "border-white/10 bg-white/[0.03] text-zinc-200 hover:border-emerald-300/40 hover:bg-emerald-300/10"
                    }`}
                    key={lesson}
                    onClick={() => setActiveLesson(lesson)}
                    type="button"
                  >
                    <span className="min-w-0 break-words">{lesson}</span>
                    <span className="mr-2 rounded-md bg-white/[0.05] px-2 py-1 text-xs text-zinc-400">
                      {index + 1}
                    </span>
                    <FileCode2 className="size-4 text-zinc-500" />
                  </button>
                ))}
              </div>
              {activeLesson ? (
                <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs font-medium uppercase text-emerald-300">
                    Mini lesson
                  </p>
                  <h3 className="mt-2 font-semibold text-white">{activeLesson}</h3>
                  <div className="mt-3 grid gap-2 text-sm leading-6 text-zinc-300">
                    {buildLessonSteps(activeLesson, analysis).map((step, index) => (
                      <div
                        className="grid grid-cols-[26px_1fr] gap-3 rounded-lg border border-white/10 bg-[#11161d] p-3"
                        key={step}
                      >
                        <span className="flex size-6 items-center justify-center rounded-md bg-cyan-300/10 text-xs text-cyan-200">
                          {index + 1}
                        </span>
                        <span className="min-w-0 break-words">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </Panel>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

function buildLessonSteps(lesson: string, analysis: Analysis | null) {
  if (!analysis) {
    return [
      "Start by identifying the exact error message.",
      "Find the first stack frame that points to your code.",
      "Apply one small fix, then re-run the app.",
    ];
  }

  return [
    `Why it matters: ${analysis.impact || analysis.explanation}`,
    `What to inspect: ${analysis.rootCause}`,
    `Try next: ${analysis.nextActions?.[0] || analysis.solutions[0]?.title || lesson}`,
  ];
}

function normalizeAnalysis(analysis: Partial<Analysis>): Analysis {
  return {
    explanation:
      analysis.explanation ||
      "FixFlow analyzed the issue, but the explanation was missing from the response.",
    rootCause:
      analysis.rootCause ||
      "The root cause was not explicit in the response. Inspect the first project stack frame.",
    category: analysis.category || "General debugging",
    severity: analysis.severity || "Medium",
    confidence: analysis.confidence || "60%",
    fixTime: analysis.fixTime || "10-30 min",
    solutions: Array.isArray(analysis.solutions) ? analysis.solutions : [],
    prevention:
      analysis.prevention ||
      "Capture full stack traces and apply one fix at a time before retesting.",
    errorMap:
      Array.isArray(analysis.errorMap) && analysis.errorMap.length > 0
        ? analysis.errorMap
        : ["Error occurs", "Pattern is detected", "Fix is tested"],
    learningTips:
      Array.isArray(analysis.learningTips) && analysis.learningTips.length > 0
        ? analysis.learningTips
        : [
            "Read the first stack frame in your code.",
            "Compare the failing value with the expected value.",
            "Re-run after one focused fix.",
          ],
    diagnostics: Array.isArray(analysis.diagnostics)
      ? analysis.diagnostics
      : [{ label: "Response", value: "Normalized fallback" }],
    nextActions: Array.isArray(analysis.nextActions)
      ? analysis.nextActions
      : ["Apply the highest-confidence fix, then re-run the app."],
    confidenceReason:
      analysis.confidenceReason ||
      "Confidence is estimated from the matched error pattern.",
    impact:
      analysis.impact ||
      "Impact depends on where this error appears in the workflow.",
  };
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
      <p className="mt-2 break-words text-xl font-semibold sm:text-2xl">{value}</p>
      <p className="mt-1 break-words text-xs text-zinc-500">{meta}</p>
    </Panel>
  );
}

function MapStep({ label, step }: { label: string; step: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs text-zinc-500">{step}</p>
      <p className="mt-1 break-words text-sm font-medium text-zinc-100">{label}</p>
    </div>
  );
}
