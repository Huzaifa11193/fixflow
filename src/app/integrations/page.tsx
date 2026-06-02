import { Check, Code2, Plug, Zap } from "lucide-react";

import { AppShell, Panel } from "@/components/fixflow/app-shell";
import { Button } from "@/components/ui/button";
import { integrations } from "@/lib/fixflow-data";

export default function IntegrationsPage() {
  return (
    <AppShell
      active="Integrations"
      description="Design surface for editor handoff, project context, and one-click apply. These are staged for post-MVP while the web workflow comes first."
      title="Editor integrations"
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="grid gap-4 md:grid-cols-2">
          {integrations.map((integration) => (
            <Panel className="p-4" key={integration.name}>
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-lg bg-white/[0.05]">
                  <Code2 className="size-5 text-cyan-300" />
                </div>
                <span className="rounded-md bg-white/[0.05] px-2 py-1 text-xs text-zinc-400">{integration.status}</span>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-white">{integration.name}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{integration.detail}</p>
              <Button className="mt-4 gap-2 bg-white/[0.05] text-zinc-100 hover:bg-white/[0.08]">
                <Plug className="size-4" />
                View setup
              </Button>
            </Panel>
          ))}
        </div>

        <Panel className="p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-200">
            <Zap className="size-4" />
            One-click apply flow
          </div>
          <div className="mt-4 space-y-3">
            {[
              "Detect active editor and project root.",
              "Request permission to read local context.",
              "Generate a patch with exact file paths.",
              "Preview diff before applying changes.",
            ].map((item) => (
              <div className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3" key={item}>
                <Check className="mt-0.5 size-4 text-emerald-300" />
                <p className="text-sm leading-6 text-zinc-300">{item}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
