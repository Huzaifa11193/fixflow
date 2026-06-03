"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Filter,
  GraduationCap,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppShell, Panel } from "@/components/fixflow/app-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import {
  formatHistoryTime,
  getSeverityTone,
  HistoryItem,
  loadHistory,
  subscribeToHistory,
} from "@/lib/history";
import { cn } from "@/lib/utils";

type Lesson = {
  id: string;
  title: string;
  category: string;
  severity: HistoryItem["analysis"]["severity"];
  durationMinutes: number;
  description: string;
  objective: string;
  sourceLabel: string;
  steps: string[];
  source?: HistoryItem;
};

type ProgressMap = Record<string, number[]>;

const starterLessons: Lesson[] = [
  {
    id: "starter-hydration",
    title: "Hydration without panic",
    category: "React hydration",
    severity: "Medium",
    durationMinutes: 6,
    description: "Learn why server markup and browser markup must match.",
    objective: "Keep the first client render deterministic.",
    sourceLabel: "Starter lesson",
    steps: [
      "Identify values that change between server render and browser render.",
      "Move browser-only values into useEffect or render a stable fallback first.",
      "Retest after clearing the dev overlay so you see only the current warning.",
      "Add a prevention note for future components that read time, locale, or storage.",
    ],
  },
  {
    id: "starter-dependencies",
    title: "Dependency error triage",
    category: "Dependencies",
    severity: "Medium",
    durationMinutes: 8,
    description: "Read package errors and choose the fastest safe fix.",
    objective: "Prove whether the failure is install state, import path, or version drift.",
    sourceLabel: "Starter lesson",
    steps: [
      "Copy the exact missing package or exported member from the error.",
      "Check package.json, lockfile, and the import line before installing anything.",
      "Restart the dev server after dependency changes.",
      "Keep one package manager per project to avoid lockfile drift.",
    ],
  },
  {
    id: "starter-api",
    title: "API response debugging",
    category: "Network/API",
    severity: "Low",
    durationMinutes: 5,
    description: "Handle failed requests before they become confusing UI errors.",
    objective: "Inspect status, body, auth, and parsing separately.",
    sourceLabel: "Starter lesson",
    steps: [
      "Log response.status and parse response text before assuming JSON.",
      "Check whether the failing response is HTML, auth redirect, CORS, or a real JSON error.",
      "Make the UI show the server message without breaking the whole flow.",
      "Save the exact request payload that reproduced the failure.",
    ],
  },
];

export default function LearningPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [progress, setProgress] = useState<ProgressMap>({});

  const lessons = useMemo(() => buildLessons(history), [history]);
  const categories = useMemo(() => buildCategories(lessons), [lessons]);
  const filteredLessons = useMemo(
    () =>
      selectedCategory === "All"
        ? lessons
        : lessons.filter((lesson) => lesson.category === selectedCategory),
    [lessons, selectedCategory]
  );
  const activeLesson =
    lessons.find((lesson) => lesson.id === activeLessonId) ||
    filteredLessons[0] ||
    lessons[0];
  const stats = useMemo(() => buildLearningStats(lessons, progress), [lessons, progress]);

  async function refreshLearning() {
    setLoading(true);
    const nextHistory = await loadHistory(user?.id);
    setHistory(nextHistory);
    setLoading(false);
  }

  useEffect(() => {
    setProgress(loadProgress(user?.id));
  }, [user?.id]);

  useEffect(() => {
    void refreshLearning();
    return subscribeToHistory(() => void refreshLearning());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (lessons.length > 0 && !activeLessonId) {
      setActiveLessonId(lessons[0].id);
    }
  }, [activeLessonId, lessons]);

  useEffect(() => {
    if (
      activeLessonId &&
      filteredLessons.length > 0 &&
      !filteredLessons.some((lesson) => lesson.id === activeLessonId)
    ) {
      setActiveLessonId(filteredLessons[0].id);
    }
  }, [activeLessonId, filteredLessons]);

  function updateProgress(nextProgress: ProgressMap) {
    setProgress(nextProgress);
    saveProgress(nextProgress, user?.id);
  }

  function toggleStep(lessonId: string, stepIndex: number) {
    const current = progress[lessonId] || [];
    const nextSteps = current.includes(stepIndex)
      ? current.filter((index) => index !== stepIndex)
      : [...current, stepIndex].sort((a, b) => a - b);

    updateProgress({
      ...progress,
      [lessonId]: nextSteps,
    });
  }

  function resetActiveLesson() {
    if (!activeLesson) return;
    const nextProgress = { ...progress };
    delete nextProgress[activeLesson.id];
    updateProgress(nextProgress);
  }

  return (
    <ProtectedRoute>
      <AppShell
        active="Learning"
        description="FixFlow turns saved analyses into short, trackable lessons that teach the cause, the fix, and the prevention habit."
        title="Learning mode"
        action={
          <Button
            className="gap-2 border-white/10 bg-white/[0.04] text-zinc-200"
            onClick={refreshLearning}
            variant="outline"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            Refresh
          </Button>
        }
      >
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              icon={<GraduationCap className="size-4 text-cyan-300" />}
              label="Dynamic lessons"
              value={String(lessons.length)}
            />
            <StatCard
              icon={<CheckCircle2 className="size-4 text-emerald-300" />}
              label="Completed"
              value={String(stats.completed)}
            />
            <StatCard
              icon={<Target className="size-4 text-amber-300" />}
              label="Average progress"
              value={`${stats.averageProgress}%`}
            />
            <StatCard
              icon={<Clock3 className="size-4 text-violet-300" />}
              label="Study time"
              value={`${stats.totalMinutes} min`}
            />
          </div>

          <Panel className="p-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                <Filter className="size-4 text-cyan-300" />
                Lesson categories
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    className={cn(
                      "h-8 rounded-lg border px-3 text-sm transition",
                      selectedCategory === category
                        ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100"
                        : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-zinc-100"
                    )}
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    type="button"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </Panel>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="grid content-start gap-4 md:grid-cols-2">
              {filteredLessons.length > 0 ? (
                filteredLessons.map((lesson) => {
                  const percent = getLessonPercent(lesson, progress);
                  const completed = percent === 100;

                  return (
                    <button
                      className={cn(
                        "rounded-lg border p-4 text-left transition hover:-translate-y-0.5",
                        activeLesson?.id === lesson.id
                          ? "border-cyan-300/50 bg-cyan-300/10"
                          : "border-white/10 bg-[#151a21] hover:border-white/20"
                      )}
                      key={lesson.id}
                      onClick={() => setActiveLessonId(lesson.id)}
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <BookOpen className="size-5 text-cyan-300" />
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "rounded-md px-2 py-1 text-xs",
                              completed
                                ? "bg-emerald-300/10 text-emerald-200"
                                : "bg-white/[0.05] text-zinc-400"
                            )}
                          >
                            {completed ? "Complete" : `${percent}%`}
                          </span>
                          <span className="rounded-md bg-white/[0.05] px-2 py-1 text-xs text-zinc-400">
                            {lesson.durationMinutes} min
                          </span>
                        </div>
                      </div>

                      <h2 className="mt-4 text-lg font-semibold text-white">
                        {lesson.title}
                      </h2>
                      <p className="mt-2 min-h-12 text-sm leading-6 text-zinc-400">
                        {lesson.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-md bg-cyan-300/10 px-2 py-1 text-cyan-200">
                          {lesson.category}
                        </span>
                        <span
                          className={cn(
                            "rounded-md bg-white/[0.05] px-2 py-1",
                            getSeverityTone(lesson.severity)
                          )}
                        >
                          {lesson.severity}
                        </span>
                      </div>

                      <div className="mt-4 h-2 rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-emerald-300 transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <div className="mt-4 flex h-8 items-center justify-center gap-2 rounded-lg bg-white/[0.05] text-sm font-medium text-zinc-100">
                        <PlayCircle className="size-4" />
                        Open lesson
                      </div>
                    </button>
                  );
                })
              ) : (
                <EmptyLessons loading={loading} />
              )}
            </div>

            <Panel className="p-4">
              {activeLesson ? (
                <ActiveLessonPanel
                  lesson={activeLesson}
                  progress={progress}
                  onReset={resetActiveLesson}
                  onToggleStep={toggleStep}
                />
              ) : (
                <EmptyLessonPanel loading={loading} />
              )}
            </Panel>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

function ActiveLessonPanel({
  lesson,
  onReset,
  onToggleStep,
  progress,
}: {
  lesson: Lesson;
  onReset: () => void;
  onToggleStep: (lessonId: string, stepIndex: number) => void;
  progress: ProgressMap;
}) {
  const completedSteps = progress[lesson.id] || [];
  const percent = getLessonPercent(lesson, progress);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-200">
          <CheckCircle2 className="size-4" />
          Current lesson
        </div>
        <Button
          className="gap-2 border-white/10 bg-white/[0.04] text-zinc-300"
          onClick={onReset}
          size="sm"
          variant="outline"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </Button>
      </div>

      <h2 className="mt-4 text-xl font-semibold text-white">{lesson.title}</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{lesson.objective}</p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-md bg-cyan-300/10 px-2 py-1 text-cyan-200">
          {lesson.category}
        </span>
        <span className={cn("rounded-md bg-white/[0.05] px-2 py-1", getSeverityTone(lesson.severity))}>
          {lesson.severity}
        </span>
        <span className="rounded-md bg-white/[0.05] px-2 py-1 text-zinc-300">
          {lesson.sourceLabel}
        </span>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>{completedSteps.length} of {lesson.steps.length} steps complete</span>
          <span>{percent}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-emerald-300 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {lesson.steps.map((step, index) => {
          const checked = completedSteps.includes(index);

          return (
            <button
              className={cn(
                "grid w-full grid-cols-[32px_1fr] gap-3 rounded-lg border p-3 text-left transition",
                checked
                  ? "border-emerald-300/30 bg-emerald-300/10"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20"
              )}
              key={`${lesson.id}-${index}`}
              onClick={() => onToggleStep(lesson.id, index)}
              type="button"
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg text-xs",
                  checked
                    ? "bg-emerald-300 text-[#071015]"
                    : "bg-cyan-300/10 text-cyan-200"
                )}
              >
                {checked ? <CheckCircle2 className="size-4" /> : index + 1}
              </span>
              <span className="text-sm leading-6 text-zinc-300">{step}</span>
            </button>
          );
        })}
      </div>

      {lesson.source ? (
        <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-medium uppercase text-zinc-500">Source analysis</p>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-300">
            {lesson.source.title}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            {formatHistoryTime(lesson.source.createdAt)} - {lesson.source.analysis.confidence} confidence
          </p>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">{label}</p>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    </Panel>
  );
}

function EmptyLessons({ loading }: { loading: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#151a21] p-6 md:col-span-2">
      <Sparkles className="size-5 text-cyan-300" />
      <h2 className="mt-4 text-lg font-semibold text-white">
        {loading ? "Loading lessons..." : "No lessons for this filter"}
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
        Run analyses or switch category filters to generate lessons from your
        actual debugging history.
      </p>
      <Link className={cn(buttonVariants({ size: "lg" }), "mt-5")} href="/app">
        Analyze an error
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

function EmptyLessonPanel({ loading }: { loading: boolean }) {
  return (
    <div className="flex min-h-80 flex-col justify-center">
      <BookOpen className="size-5 text-cyan-300" />
      <h2 className="mt-4 text-xl font-semibold text-white">
        {loading ? "Preparing learning mode" : "Select a lesson"}
      </h2>
      <p className="mt-2 text-sm leading-6 text-zinc-400">
        Lesson details, steps, progress, and source analysis will appear here.
      </p>
    </div>
  );
}

function buildLessons(history: HistoryItem[]): Lesson[] {
  const generated = history.flatMap((item) => {
    const tips = item.analysis.learningTips?.length
      ? item.analysis.learningTips.slice(0, 3)
      : [item.analysis.category];

    return tips.map((tip, index) => ({
      id: `${item.id}-${index}`,
      title: makeLessonTitle(tip, item),
      category: item.analysis.category,
      severity: item.analysis.severity,
      durationMinutes: estimateDuration(item, index),
      description: item.analysis.rootCause || item.analysis.explanation,
      objective: item.analysis.prevention,
      sourceLabel: formatHistoryTime(item.createdAt),
      steps: buildLessonSteps(item, tip),
      source: item,
    }));
  });

  return [...generated, ...starterLessons].slice(0, 18);
}

function buildLessonSteps(item: HistoryItem, tip: string) {
  const primaryFix = item.analysis.solutions[0]?.title;
  const nextAction = item.analysis.nextActions?.[0];
  const diagnostics = item.analysis.diagnostics
    ?.slice(0, 2)
    .map((entry) => `${entry.label}: ${entry.value}`);

  return [
    `Lesson focus: ${tip}`,
    `Explain the failure: ${item.analysis.explanation}`,
    `Trace the cause: ${item.analysis.rootCause}`,
    diagnostics?.length ? `Check the signal: ${diagnostics.join(" / ")}` : `Check the signal: ${item.analysis.errorMap.join(" -> ")}`,
    `Apply one fix: ${primaryFix || nextAction || "make the smallest focused change and retest"}`,
    `Prevent it next time: ${item.analysis.prevention}`,
  ];
}

function buildCategories(lessons: Lesson[]) {
  return ["All", ...Array.from(new Set(lessons.map((lesson) => lesson.category)))];
}

function buildLearningStats(lessons: Lesson[], progress: ProgressMap) {
  const completed = lessons.filter((lesson) => getLessonPercent(lesson, progress) === 100).length;
  const totalProgress = lessons.reduce(
    (sum, lesson) => sum + getLessonPercent(lesson, progress),
    0
  );
  const averageProgress = lessons.length
    ? Math.round(totalProgress / lessons.length)
    : 0;
  const totalMinutes = lessons.reduce(
    (sum, lesson) => sum + lesson.durationMinutes,
    0
  );

  return { averageProgress, completed, totalMinutes };
}

function getLessonPercent(lesson: Lesson, progress: ProgressMap) {
  const complete = progress[lesson.id]?.length || 0;
  return Math.round((complete / lesson.steps.length) * 100);
}

function makeLessonTitle(tip: string, item: HistoryItem) {
  const cleanTip = tip.replace(/[.]+$/, "");
  if (cleanTip.length > 8) return cleanTip.slice(0, 72);
  return `${item.analysis.category} lesson`;
}

function estimateDuration(item: HistoryItem, tipIndex: number) {
  const base =
    item.analysis.severity === "High"
      ? 9
      : item.analysis.severity === "Medium"
        ? 6
        : 4;

  return base + tipIndex;
}

function getProgressKey(userId?: string) {
  return `fixflow:learning-progress:${userId || "guest"}`;
}

function loadProgress(userId?: string): ProgressMap {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(getProgressKey(userId));
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: ProgressMap, userId?: string) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(getProgressKey(userId), JSON.stringify(progress));
  } catch {
    // Lesson progress is local convenience data; the page still works without it.
  }
}
