import { Bell, Database, KeyRound, ShieldCheck, SlidersHorizontal } from "lucide-react";

import { AppShell, Panel } from "@/components/fixflow/app-shell";

const settings = [
  { icon: KeyRound, label: "AI provider", value: "OpenAI / Claude / Grok ready" },
  { icon: Database, label: "History storage", value: "Supabase cloud with local cache fallback" },
  { icon: ShieldCheck, label: "Project context", value: "Ask before reading local files" },
  { icon: Bell, label: "Feedback prompts", value: "Ask after every resolved analysis" },
];

export default function SettingsPage() {
  return (
    <AppShell
      active="Settings"
      description="Control model provider, data storage, privacy, cache behavior, and MVP feedback settings."
      title="Settings"
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Panel>
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
              <SlidersHorizontal className="size-4 text-cyan-300" />
              Workspace preferences
            </div>
          </div>
          <div className="divide-y divide-white/10">
            {settings.map((item) => {
              const Icon = item.icon;

              return (
                <div className="grid gap-4 p-4 md:grid-cols-[1fr_auto]" key={item.label}>
                  <div className="flex gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-white/[0.05]">
                      <Icon className="size-5 text-cyan-300" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{item.label}</p>
                      <p className="mt-1 text-sm text-zinc-400">{item.value}</p>
                    </div>
                  </div>
                  <button className="h-7 w-12 rounded-full bg-emerald-300/20 p-1" type="button" aria-label={`${item.label} enabled`}>
                    <span className="block size-5 translate-x-5 rounded-full bg-emerald-300" />
                  </button>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel className="p-4">
          <p className="text-sm font-medium text-zinc-200">Privacy posture</p>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            The full product should ask before scanning local code, show what it
            sends to the model, and keep offline cached results visible to the user.
          </p>
          <div className="mt-4 rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm leading-6 text-emerald-100/80">
            Permission-first context is a core part of the FixFlow design.
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
