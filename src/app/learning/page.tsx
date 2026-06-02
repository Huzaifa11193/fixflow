import { BookOpen, CheckCircle2, PlayCircle } from "lucide-react";

import { AppShell, Panel } from "@/components/fixflow/app-shell";
import { Button } from "@/components/ui/button";
import { lessons } from "@/lib/fixflow-data";

export default function LearningPage() {
  return (
    <AppShell
      active="Learning"
      description="After each fix, FixFlow turns the bug into a short lesson so developers understand the cause and avoid repeating it."
      title="Learning mode"
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4 md:grid-cols-3">
          {lessons.map((lesson) => (
            <Panel className="p-4" key={lesson.title}>
              <div className="flex items-center justify-between">
                <BookOpen className="size-5 text-cyan-300" />
                <span className="rounded-md bg-white/[0.05] px-2 py-1 text-xs text-zinc-400">{lesson.duration}</span>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-white">{lesson.title}</h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-zinc-400">{lesson.description}</p>
              <div className="mt-4 h-2 rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-emerald-300" style={{ width: lesson.progress }} />
              </div>
              <Button className="mt-4 w-full gap-2 bg-white/[0.05] text-zinc-100 hover:bg-white/[0.08]">
                <PlayCircle className="size-4" />
                Continue
              </Button>
            </Panel>
          ))}
        </div>

        <Panel className="p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-200">
            <CheckCircle2 className="size-4" />
            Current lesson
          </div>
          <h2 className="mt-4 text-xl font-semibold text-white">Hydration without panic</h2>
          <div className="mt-4 space-y-3">
            {[
              "Server renders HTML first.",
              "Browser runs client JavaScript.",
              "React compares both trees.",
              "Different first output creates a warning.",
            ].map((step, index) => (
              <div className="grid grid-cols-[28px_1fr] gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3" key={step}>
                <span className="flex size-7 items-center justify-center rounded-lg bg-cyan-300/10 text-xs text-cyan-200">{index + 1}</span>
                <p className="text-sm leading-6 text-zinc-300">{step}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
