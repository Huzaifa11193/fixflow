"use client";

import { BookOpen, CheckCircle2, PlayCircle, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppShell, Panel } from "@/components/fixflow/app-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import {
  formatHistoryTime,
  HistoryItem,
  loadHistory,
  subscribeToHistory,
} from "@/lib/history";

type Lesson = {
  id: string;
  title: string;
  duration: string;
  progress: string;
  description: string;
  steps: string[];
  source?: HistoryItem;
};

const defaultLessons: Lesson[] = [
  {
    id: "hydration",
    title: "Hydration without panic",
    duration: "6 min",
    progress: "72%",
    description: "Learn why server markup and browser markup must match.",
    steps: [
      "Server renders HTML first.",
      "Browser runs client JavaScript.",
      "React compares both trees.",
      "Different first output creates a warning.",
    ],
  },
  {
    id: "dependencies",
    title: "Dependency error triage",
    duration: "8 min",
    progress: "44%",
    description: "Read package errors and pick the fastest safe fix.",
    steps: [
      "Find the unresolved module name.",
      "Check package.json and the lockfile.",
      "Install or fix the import path.",
      "Restart the dev server before retesting.",
    ],
  },
  {
    id: "imports",
    title: "Debugging imports",
    duration: "5 min",
    progress: "20%",
    description: "Find path, alias, and cycle mistakes before runtime.",
    steps: [
      "Check whether the import is package or local path.",
      "Verify filename casing.",
      "Confirm alias config points to the right folder.",
      "Avoid circular imports for shared helpers.",
    ],
  },
];

export default function LearningPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const lessons = useMemo(() => buildLessons(history), [history]);
  const [activeLessonId, setActiveLessonId] = useState(defaultLessons[0].id);
  const activeLesson =
    lessons.find((lesson) => lesson.id === activeLessonId) || lessons[0];

  async function refreshLearning() {
    setLoading(true);
    const nextHistory = await loadHistory(user?.id);
    setHistory(nextHistory);
    setLoading(false);
  }

  useEffect(() => {
    void refreshLearning();
    return subscribeToHistory(() => void refreshLearning());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (lessons.length > 0 && !lessons.some((lesson) => lesson.id === activeLessonId)) {
      setActiveLessonId(lessons[0].id);
    }
  }, [activeLessonId, lessons]);

  return (
    <ProtectedRoute>
      <AppShell
        active="Learning"
        description="After each fix, FixFlow turns the bug into a short lesson so developers understand the cause and avoid repeating it."
        title="Learning mode"
        action={
          <Button
            className="gap-2 border-white/10 bg-white/[0.04] text-zinc-200"
            onClick={refreshLearning}
            variant="outline"
          >
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        }
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="grid gap-4 md:grid-cols-3">
            {lessons.map((lesson) => (
              <button
                className={`rounded-lg border p-4 text-left transition hover:-translate-y-0.5 ${
                  activeLesson?.id === lesson.id
                    ? "border-cyan-300/50 bg-cyan-300/10"
                    : "border-white/10 bg-[#151a21] hover:border-white/20"
                }`}
                key={lesson.id}
                onClick={() => setActiveLessonId(lesson.id)}
                type="button"
              >
                <div className="flex items-center justify-between">
                  <BookOpen className="size-5 text-cyan-300" />
                  <span className="rounded-md bg-white/[0.05] px-2 py-1 text-xs text-zinc-400">
                    {lesson.duration}
                  </span>
                </div>
                <h2 className="mt-4 text-lg font-semibold text-white">
                  {lesson.title}
                </h2>
                <p className="mt-2 min-h-12 text-sm leading-6 text-zinc-400">
                  {lesson.description}
                </p>
                <div className="mt-4 h-2 rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-emerald-300"
                    style={{ width: lesson.progress }}
                  />
                </div>
                <div className="mt-4 flex h-8 items-center justify-center gap-2 rounded-lg bg-white/[0.05] text-sm font-medium text-zinc-100">
                  <PlayCircle className="size-4" />
                  Open lesson
                </div>
              </button>
            ))}
          </div>

          <Panel className="p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-200">
              <CheckCircle2 className="size-4" />
              Current lesson
            </div>
            <h2 className="mt-4 text-xl font-semibold text-white">
              {activeLesson?.title || "No lesson selected"}
            </h2>
            {activeLesson?.source ? (
              <p className="mt-2 text-xs text-zinc-500">
                From {activeLesson.source.analysis.category} -{" "}
                {formatHistoryTime(activeLesson.source.createdAt)}
              </p>
            ) : (
              <p className="mt-2 text-xs text-zinc-500">
                {loading ? "Loading history..." : "Starter lesson"}
              </p>
            )}
            <div className="mt-4 space-y-3">
              {(activeLesson?.steps || []).map((step, index) => (
                <div
                  className="grid grid-cols-[28px_1fr] gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3"
                  key={step}
                >
                  <span className="flex size-7 items-center justify-center rounded-lg bg-cyan-300/10 text-xs text-cyan-200">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-zinc-300">{step}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

function buildLessons(history: HistoryItem[]): Lesson[] {
  const generated = history.slice(0, 6).map((item) => ({
    id: item.id,
    title: item.analysis.learningTips?.[0] || item.analysis.category,
    duration: estimateDuration(item),
    progress: item.analysis.severity === "High" ? "18%" : "36%",
    description: item.analysis.rootCause || item.analysis.explanation,
    steps: [
      `Understand: ${item.analysis.explanation}`,
      `Inspect: ${item.analysis.rootCause}`,
      `Prevent: ${item.analysis.prevention}`,
      `Practice: ${item.analysis.nextActions?.[0] || item.analysis.solutions[0]?.title || "Re-run the app after one fix."}`,
    ],
    source: item,
  }));

  return [...generated, ...defaultLessons].slice(0, 9);
}

function estimateDuration(item: HistoryItem) {
  if (item.analysis.severity === "High") return "9 min";
  if (item.analysis.severity === "Medium") return "6 min";
  return "4 min";
}
