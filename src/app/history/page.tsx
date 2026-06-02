import { Archive, Copy, Filter, Search } from "lucide-react";

import { AppShell, Panel } from "@/components/fixflow/app-shell";
import { Button } from "@/components/ui/button";
import { historyItems } from "@/lib/fixflow-data";

export default function HistoryPage() {
  return (
    <AppShell
      active="History"
      description="Review past analyses, reuse successful fixes, and build a searchable memory of the bugs your team solves most often."
      title="Error history"
      action={
        <>
          <Button className="gap-2 border-white/10 bg-white/[0.04] text-zinc-200" variant="outline">
            <Filter className="size-4" />
            Filter
          </Button>
          <Button className="gap-2 bg-cyan-400 text-[#071015] hover:bg-cyan-300">
            <Search className="size-4" />
            Search
          </Button>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel>
          <div className="border-b border-white/10 p-4">
            <div className="flex h-11 items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3">
              <Search className="size-4 text-zinc-500" />
              <span className="text-sm text-zinc-500">Search errors, files, packages, or frameworks</span>
            </div>
          </div>
          <div className="divide-y divide-white/10">
            {historyItems.map((item) => (
              <article className="grid gap-4 p-4 md:grid-cols-[1fr_auto]" key={item.title}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full bg-current ${item.tone}`} />
                    <h2 className="font-medium text-white">{item.title}</h2>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">{item.meta}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-md bg-white/[0.05] px-2 py-1 text-zinc-300">{item.category}</span>
                    <span className="rounded-md bg-amber-300/10 px-2 py-1 text-amber-200">{item.severity}</span>
                    <span className="rounded-md bg-emerald-300/10 px-2 py-1 text-emerald-200">{item.confidence} confidence</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Button aria-label="Copy fix" size="icon-sm" variant="ghost">
                    <Copy className="size-4" />
                  </Button>
                  <Button aria-label="Archive item" size="icon-sm" variant="ghost">
                    <Archive className="size-4" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <div className="grid gap-4">
          <Panel className="p-4">
            <p className="text-sm font-medium text-zinc-200">Saved time</p>
            <p className="mt-2 text-4xl font-semibold text-white">11.4h</p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">Estimated time avoided across your last 30 analyses.</p>
          </Panel>
          <Panel className="p-4">
            <p className="text-sm font-medium text-zinc-200">Most common stack</p>
            <p className="mt-2 text-2xl font-semibold text-white">Next.js + React</p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">Hydration, server/client boundaries, and route config appear most often.</p>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
