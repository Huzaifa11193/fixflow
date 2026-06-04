"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  Clock3,
  Copy,
  FileCode2,
  Loader2,
  Play,
  RotateCcw,
  SearchCheck,
  ShieldCheck,
  Terminal,
} from "lucide-react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppShell, Panel } from "@/components/fixflow/app-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { detectFramework } from "@/lib/detect";
import { frameworks } from "@/lib/fixflow-data";
import { HistoryAnalysis, saveHistoryItem } from "@/lib/history";

type Analysis = HistoryAnalysis;

type Detected = {
  language?: string;
  framework?: string;
};

type DetailSection = "steps" | "fixes" | "why" | "learn";

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
  const [openSection, setOpenSection] = useState<DetailSection>("steps");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { user } = useAuth();

  const previewDetection = useMemo(() => detectFramework(input), [input]);
  const bestFix = analysis?.solutions?.[0];
  const displayedFramework =
    selectedFramework !== "Auto"
      ? selectedFramework
      : detected.framework ||
        previewDetection.framework ||
        previewDetection.language ||
        "Auto";
  const displayedLanguage =
    detected.language || previewDetection.language || "Waiting for input";

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

    const selectedHint =
      selectedFramework !== "Auto"
        ? selectedFramework
        : previewDetection.framework || previewDetection.language;

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, framework: selectedHint }),
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
      const nextDetected = data.detected ?? previewDetection;

      setAnalysis(nextAnalysis);
      setDetected(nextDetected);
      setOpenSection("steps");

      try {
        await saveHistoryItem({
          analysis: nextAnalysis,
          framework: selectedHint,
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
      setInput(text);
      setDetected(detectFramework(text));
      setError("");
    } catch {
      setError("Clipboard access was blocked by the browser.");
    }
  }

  function resetSample() {
    setInput(starterError);
    setDetected(detectFramework(starterError));
    setAnalysis(null);
    setError("");
    setHistoryWarning("");
  }

  return (
    <ProtectedRoute>
      <AppShell
        active="Analyze"
        description="Paste an error and get the next best fix without sorting through noise."
        title="Analyze an error"
        action={
          <>
            <Button
              className="gap-2 border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]"
              onClick={resetSample}
              variant="outline"
            >
              <RotateCcw className="size-4" />
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
        <div className="mx-auto grid w-full max-w-6xl items-start gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.75fr)]">
          <section className="grid min-w-0 content-start gap-4">
            <Panel className="overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                    <Terminal className="size-4 text-cyan-300" />
                    Paste your error
                  </div>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    Stack traces, terminal errors, warnings, or failing snippets all work.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    aria-label="Framework"
                    className="h-9 max-w-[190px] rounded-lg border border-white/10 bg-[#11161d] px-3 text-sm text-zinc-200 outline-none transition focus:border-cyan-300/60"
                    onChange={(event) => setSelectedFramework(event.target.value)}
                    value={selectedFramework}
                  >
                    {frameworks.map((framework) => (
                      <option key={framework}>{framework}</option>
                    ))}
                  </select>
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
              </div>

              <textarea
                className="h-[280px] w-full resize-y bg-transparent p-4 font-mono text-sm leading-6 text-zinc-200 outline-none placeholder:text-zinc-600 sm:h-[340px] xl:h-[380px]"
                onChange={(event) => {
                  setInput(event.target.value);
                  setDetected(detectFramework(event.target.value));
                }}
                placeholder="Paste the exact error here..."
                ref={textareaRef}
                spellCheck={false}
                value={input}
              />

              <div className="flex flex-col gap-3 border-t border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="grid gap-1 text-xs text-zinc-500">
                  <span>
                    Detected:{" "}
                    <strong className="font-medium text-zinc-300">
                      {displayedFramework}
                    </strong>
                  </span>
                  <span>{displayedLanguage}</span>
                </div>
                <Button
                  className="h-11 gap-2 bg-emerald-400 px-5 text-[#071015] hover:bg-emerald-300"
                  disabled={loading}
                  onClick={handleAnalyze}
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <SearchCheck className="size-4" />
                  )}
                  {loading ? "Analyzing..." : "Find best fix"}
                </Button>
              </div>
            </Panel>

            <StatusMessage
              copied={copied}
              error={error}
              historyWarning={historyWarning}
            />
          </section>

          <section className="grid min-w-0 content-start gap-4">
            <Panel className="overflow-hidden">
              <div className="border-b border-white/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-200">
                    <CheckCircle2 className="size-4" />
                    {analysis ? "Best answer" : "Waiting for analysis"}
                  </div>
                  <Button
                    aria-label="Copy full analysis"
                    className="text-zinc-400 hover:text-zinc-100"
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
                <h2 className="mt-3 break-words text-lg font-semibold leading-7 text-white">
                  {analysis?.rootCause ?? "Paste an error, then run analysis."}
                </h2>
                <p className="mt-3 break-words text-sm leading-6 text-zinc-400">
                  {analysis?.explanation ??
                    "FixFlow will summarize the cause, show the best next step, and keep deeper details tucked away until you need them."}
                </p>
              </div>

              <div className="grid grid-cols-3 border-b border-white/10">
                <SummaryStat
                  icon={BadgeCheck}
                  label="Confidence"
                  value={analysis?.confidence ?? "-"}
                />
                <SummaryStat
                  icon={Clock3}
                  label="Fix time"
                  value={analysis?.fixTime ?? "-"}
                />
                <SummaryStat
                  icon={ShieldCheck}
                  label="Severity"
                  value={analysis?.severity ?? "-"}
                />
              </div>

              <div className="p-4">
                <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-4">
                  <p className="text-xs font-medium uppercase text-emerald-100/70">
                    Try this first
                  </p>
                  <h3 className="mt-2 break-words font-semibold text-white">
                    {bestFix?.title ?? "Your top fix will appear here."}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-emerald-100/80">
                    {analysis?.nextActions?.[0] ??
                      "Run analysis to get a clear next action."}
                  </p>
                  {bestFix ? (
                    <div className="mt-4 overflow-hidden rounded-lg border border-white/10 bg-[#0f1318]">
                      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                        <span className="text-xs text-zinc-500">
                          Suggested patch or command
                        </span>
                        <Button
                          aria-label="Copy best fix"
                          className="text-zinc-400 hover:text-zinc-100"
                          onClick={() => copyText(bestFix.snippet, "best fix")}
                          size="icon-sm"
                          variant="ghost"
                        >
                          <Copy className="size-4" />
                        </Button>
                      </div>
                      <pre className="max-h-64 overflow-auto whitespace-pre p-3 text-sm leading-6 text-zinc-300">
                        <code>{bestFix.snippet}</code>
                      </pre>
                    </div>
                  ) : null}
                </div>
              </div>
            </Panel>

            <DetailAccordion
              analysis={analysis}
              copied={copied}
              copyText={copyText}
              openSection={openSection}
              setOpenSection={setOpenSection}
            />
          </section>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

function StatusMessage({
  copied,
  error,
  historyWarning,
}: {
  copied: string;
  error: string;
  historyWarning: string;
}) {
  if (error) {
    return (
      <div className="rounded-lg border border-rose-300/20 bg-rose-300/10 p-3 text-sm leading-6 text-rose-100">
        {error}
      </div>
    );
  }

  if (historyWarning) {
    return (
      <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100">
        {historyWarning}
      </div>
    );
  }

  if (copied) {
    return (
      <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm leading-6 text-emerald-100">
        Copied {copied}.
      </div>
    );
  }

  return null;
}

function DetailAccordion({
  analysis,
  copied,
  copyText,
  openSection,
  setOpenSection,
}: {
  analysis: Analysis | null;
  copied: string;
  copyText: (value: string, label: string) => Promise<void>;
  openSection: DetailSection;
  setOpenSection: (section: DetailSection) => void;
}) {
  return (
    <div className="grid gap-3">
      <AccordionSection
        isOpen={openSection === "steps"}
        onToggle={() => setOpenSection(openSection === "steps" ? "fixes" : "steps")}
        title="Next steps"
      >
        <div className="grid gap-2">
          {(analysis?.nextActions ?? [
            "Analyze an error to get the next step.",
            "Apply one fix at a time.",
            "Run the app again and compare the new output.",
          ]).map((action, index) => (
            <div
              className="grid grid-cols-[28px_1fr] gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm leading-6 text-zinc-300"
              key={action}
            >
              <span className="flex size-7 items-center justify-center rounded-md bg-emerald-300/10 text-xs font-medium text-emerald-200">
                {index + 1}
              </span>
              <span className="min-w-0 break-words">{action}</span>
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection
        isOpen={openSection === "fixes"}
        onToggle={() => setOpenSection(openSection === "fixes" ? "why" : "fixes")}
        title="Other fixes"
      >
        <div className="grid gap-3">
          {analysis?.solutions?.length ? (
            analysis.solutions.map((solution) => (
              <div
                className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]"
                key={solution.rank}
              >
                <div className="flex items-start justify-between gap-3 border-b border-white/10 p-3">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium text-white">
                      {solution.rank}. {solution.title}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {solution.confidence} confidence - {solution.effort} effort
                    </p>
                  </div>
                  <Button
                    aria-label={`Copy fix ${solution.rank}`}
                    className="text-zinc-400 hover:text-zinc-100"
                    onClick={() => copyText(solution.snippet, `fix ${solution.rank}`)}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
                <pre className="max-h-48 overflow-auto whitespace-pre p-3 text-sm leading-6 text-zinc-300">
                  <code>{solution.snippet}</code>
                </pre>
              </div>
            ))
          ) : (
            <p className="text-sm leading-6 text-zinc-400">
              Additional fixes will appear after analysis.
            </p>
          )}
          {copied ? null : null}
        </div>
      </AccordionSection>

      <AccordionSection
        isOpen={openSection === "why"}
        onToggle={() => setOpenSection(openSection === "why" ? "learn" : "why")}
        title="Why it happened"
      >
        <div className="grid gap-3">
          <InfoBlock
            label="Impact"
            value={analysis?.impact || "Impact will appear after analysis."}
          />
          <InfoBlock
            label="Prevention"
            value={
              analysis?.prevention ||
              "Prevention tips will appear after analysis."
            }
          />
          <InfoBlock
            label="Confidence"
            value={
              analysis?.confidenceReason ||
              "Confidence reasoning will appear after analysis."
            }
          />
        </div>
      </AccordionSection>

      <AccordionSection
        isOpen={openSection === "learn"}
        onToggle={() => setOpenSection(openSection === "learn" ? "steps" : "learn")}
        title="Learn the pattern"
      >
        <div className="grid gap-3">
          <div className="grid gap-2">
            {(analysis?.errorMap ?? [
              "Paste error",
              "Detect pattern",
              "Apply best fix",
            ]).map((step, index) => (
              <div
                className="grid grid-cols-[28px_1fr] gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm leading-6 text-zinc-300"
                key={`${step}-${index}`}
              >
                <span className="flex size-7 items-center justify-center rounded-md bg-cyan-300/10 text-xs font-medium text-cyan-200">
                  {index + 1}
                </span>
                <span className="min-w-0 break-words">{step}</span>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
              <FileCode2 className="size-4 text-emerald-300" />
              Quick lesson
            </div>
            <div className="mt-3 grid gap-2">
              {(analysis?.learningTips ?? [
                "Read the first stack frame in your code.",
                "Compare the failing value with the expected value.",
                "Re-run after one focused fix.",
              ]).map((tip) => (
                <p
                  className="rounded-md bg-[#11161d] px-3 py-2 text-sm leading-6 text-zinc-300"
                  key={tip}
                >
                  {tip}
                </p>
              ))}
            </div>
          </div>
        </div>
      </AccordionSection>
    </div>
  );
}

function AccordionSection({
  children,
  isOpen,
  onToggle,
  title,
}: {
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  title: string;
}) {
  return (
    <Panel className="overflow-hidden">
      <button
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
        onClick={onToggle}
        type="button"
      >
        <span className="text-sm font-medium text-zinc-100">{title}</span>
        <ChevronDown
          className={`size-4 text-zinc-500 transition ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen ? <div className="border-t border-white/10 p-4">{children}</div> : null}
    </Panel>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs font-medium uppercase text-zinc-500">{label}</p>
      <p className="mt-2 break-words text-sm leading-6 text-zinc-300">{value}</p>
    </div>
  );
}

function SummaryStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 border-r border-white/10 p-3 last:border-r-0">
      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
        <Icon className="size-3.5 text-cyan-300" />
        {label}
      </div>
      <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
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
