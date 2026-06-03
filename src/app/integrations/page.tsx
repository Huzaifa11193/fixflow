"use client";

import {
  Activity,
  Check,
  CheckCircle2,
  Clipboard,
  Code2,
  FileCode2,
  KeyRound,
  Laptop,
  Link2,
  Loader2,
  MonitorCog,
  Plug,
  RefreshCw,
  ShieldCheck,
  Terminal,
  Unplug,
  Webhook,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppShell, Panel } from "@/components/fixflow/app-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { formatHistoryTime } from "@/lib/history";
import { cn } from "@/lib/utils";

type IntegrationId = "vscode" | "cursor" | "zed" | "jetbrains" | "cli" | "webhook";
type IntegrationStatus = "connected" | "available" | "roadmap";
type PermissionKey = "readContext" | "applyPatch" | "saveHistory" | "shareDiagnostics";

type Integration = {
  id: IntegrationId;
  name: string;
  type: "Editor" | "Automation" | "Workflow";
  status: IntegrationStatus;
  detail: string;
  icon: typeof Code2;
  command: string;
  setup: string[];
  supports: string[];
};

type IntegrationState = {
  connected: boolean;
  token?: string;
  lastChecked?: string;
  lastAction?: string;
  permissions: Record<PermissionKey, boolean>;
};

type StoredState = Record<IntegrationId, IntegrationState>;

const defaultPermissions: Record<PermissionKey, boolean> = {
  readContext: false,
  applyPatch: false,
  saveHistory: true,
  shareDiagnostics: true,
};

const integrations: Integration[] = [
  {
    id: "vscode",
    name: "VS Code",
    type: "Editor",
    status: "available",
    detail: "Prepare one-click patch handoff, diagnostics, and copied fix commands.",
    icon: Code2,
    command: "code --install-extension fixflow.fixflow",
    setup: [
      "Install the FixFlow extension from the marketplace when available.",
      "Sign in with the same FixFlow account used in this web app.",
      "Allow project context only when you want exact file-aware fixes.",
      "Use Analyze in FixFlow, then preview the suggested patch before applying.",
    ],
    supports: ["Patch preview", "Current file context", "Terminal diagnostics"],
  },
  {
    id: "cursor",
    name: "Cursor",
    type: "Editor",
    status: "available",
    detail: "Send ranked fixes into Cursor with project-aware prompts and snippets.",
    icon: FileCode2,
    command: "cursor .",
    setup: [
      "Open the project in Cursor.",
      "Copy the generated FixFlow prompt from the setup panel.",
      "Paste it into Cursor chat with the active error selected.",
      "Apply only the diff you review in the editor.",
    ],
    supports: ["Prompt handoff", "Snippet copy", "Learning notes"],
  },
  {
    id: "zed",
    name: "Zed",
    type: "Editor",
    status: "roadmap",
    detail: "Fast local editor handoff for fix drafts and future project scanning.",
    icon: Laptop,
    command: "zed .",
    setup: [
      "Open your project in Zed.",
      "Use FixFlow web analysis while native handoff is in roadmap.",
      "Copy code snippets from ranked fixes into the relevant file.",
      "Track repeated issues in Patterns and Learning mode.",
    ],
    supports: ["Manual snippet flow", "Roadmap bridge", "History tracking"],
  },
  {
    id: "jetbrains",
    name: "JetBrains",
    type: "Editor",
    status: "roadmap",
    detail: "Project scan bridge for IntelliJ, WebStorm, PyCharm, and related IDEs.",
    icon: MonitorCog,
    command: "fixflow jetbrains connect",
    setup: [
      "Install the JetBrains plugin when it becomes available.",
      "Connect it to FixFlow with the generated integration token.",
      "Grant read-only project context first.",
      "Enable patch apply only after preview workflows are ready.",
    ],
    supports: ["Project scan bridge", "Diff preview", "Team-ready workflow"],
  },
  {
    id: "cli",
    name: "FixFlow CLI",
    type: "Workflow",
    status: "available",
    detail: "Copy a terminal command flow for local error analysis and saved history.",
    icon: Terminal,
    command: "npx fixflow analyze --from-terminal",
    setup: [
      "Run the command from the project root.",
      "Paste the terminal error or pipe command output into FixFlow.",
      "Review ranked fixes before editing files.",
      "Save the result so Patterns and Learning mode stay current.",
    ],
    supports: ["Terminal capture", "Local-first flow", "History sync"],
  },
  {
    id: "webhook",
    name: "Webhook",
    type: "Automation",
    status: "available",
    detail: "Generate a secure endpoint pattern for CI, logs, and team tooling.",
    icon: Webhook,
    command: "POST /api/integrations/webhook",
    setup: [
      "Create a webhook token from this page.",
      "Send sanitized error text, framework, source, and timestamp.",
      "Store analysis results in FixFlow history.",
      "Rotate tokens if a workspace member leaves.",
    ],
    supports: ["CI handoff", "Log capture", "Team automation"],
  },
];

export default function IntegrationsPage() {
  const { user } = useAuth();
  const [states, setStates] = useState<StoredState>(() => createInitialState());
  const [selectedId, setSelectedId] = useState<IntegrationId>("vscode");
  const [testingId, setTestingId] = useState<IntegrationId | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [endpoint, setEndpoint] = useState("");

  const selected = integrations.find((item) => item.id === selectedId) || integrations[0];
  const selectedState = states[selected.id];
  const connectedCount = integrations.filter((item) => states[item.id]?.connected).length;
  const availableCount = integrations.filter((item) => item.status !== "roadmap").length;
  const recentActivity = useMemo(() => buildActivity(states), [states]);

  useEffect(() => {
    setStates(loadStates(user?.id));
    setEndpoint(makeEndpoint(user?.id));
  }, [user?.id]);

  function persist(nextStates: StoredState) {
    setStates(nextStates);
    saveStates(nextStates, user?.id);
  }

  function updateIntegration(id: IntegrationId, patch: Partial<IntegrationState>) {
    persist({
      ...states,
      [id]: {
        ...states[id],
        ...patch,
      },
    });
  }

  function connectIntegration(id: IntegrationId) {
    const integration = integrations.find((item) => item.id === id);
    const token = states[id]?.token || makeToken(id);

    updateIntegration(id, {
      connected: integration?.status !== "roadmap",
      token,
      lastChecked: new Date().toISOString(),
      lastAction:
        integration?.status === "roadmap"
          ? "Added to setup watchlist"
          : "Connected locally",
    });
  }

  function disconnectIntegration(id: IntegrationId) {
    updateIntegration(id, {
      connected: false,
      lastChecked: new Date().toISOString(),
      lastAction: "Disconnected",
    });
  }

  function togglePermission(id: IntegrationId, key: PermissionKey) {
    updateIntegration(id, {
      permissions: {
        ...states[id].permissions,
        [key]: !states[id].permissions[key],
      },
      lastAction: "Permissions updated",
    });
  }

  async function testIntegration(id: IntegrationId) {
    setTestingId(id);
    await new Promise((resolve) => window.setTimeout(resolve, 650));

    const integration = integrations.find((item) => item.id === id);
    updateIntegration(id, {
      lastChecked: new Date().toISOString(),
      lastAction:
        integration?.status === "roadmap"
          ? "Setup checked - roadmap integration"
          : states[id].connected
            ? "Connection check passed"
            : "Ready to connect",
    });
    setTestingId(null);
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 1400);
    } catch {
      setCopied("Copy failed");
      window.setTimeout(() => setCopied(null), 1400);
    }
  }

  function resetAll() {
    const next = createInitialState();
    persist(next);
    setCopied("Reset complete");
    window.setTimeout(() => setCopied(null), 1400);
  }

  return (
    <ProtectedRoute>
      <AppShell
        active="Integrations"
        description="Connect editor, CLI, and automation workflows with permission-first controls for future one-click apply."
        title="Editor integrations"
        action={
          <Button
            className="gap-2 border-white/10 bg-white/[0.04] text-zinc-200"
            onClick={resetAll}
            variant="outline"
          >
            <RefreshCw className="size-4" />
            Reset local
          </Button>
        }
      >
        <div className="grid min-w-0 gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Connected" value={`${connectedCount}/${integrations.length}`} tone="cyan" />
            <MetricCard label="Available now" value={String(availableCount)} tone="emerald" />
            <MetricCard label="Permission mode" value="Manual" tone="amber" />
            <MetricCard label="Token status" value={hasToken(states) ? "Ready" : "None"} tone="violet" />
          </div>

          {copied ? (
            <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
              {copied}
            </div>
          ) : null}

          <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
            <div className="grid content-start gap-4 md:grid-cols-2">
              {integrations.map((integration) => {
                const Icon = integration.icon;
                const state = states[integration.id];
                const active = selected.id === integration.id;

                return (
                  <button
                    className={cn(
                      "rounded-lg border p-4 text-left transition hover:-translate-y-0.5",
                      active
                        ? "border-cyan-300/50 bg-cyan-300/10"
                        : "border-white/10 bg-[#151a21] hover:border-white/20"
                    )}
                    key={integration.id}
                    onClick={() => setSelectedId(integration.id)}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-white/[0.05]">
                        <Icon className="size-5 text-cyan-300" />
                      </div>
                      <StatusBadge integration={integration} state={state} />
                    </div>

                    <h2 className="mt-4 text-xl font-semibold text-white">
                      {integration.name}
                    </h2>
                      <p className="mt-2 min-h-12 break-words text-sm leading-6 text-zinc-400">
                      {integration.detail}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-md bg-white/[0.05] px-2 py-1 text-zinc-300">
                        {integration.type}
                      </span>
                      <span className="rounded-md bg-cyan-300/10 px-2 py-1 text-cyan-200">
                        {integration.supports.length} capabilities
                      </span>
                    </div>

                    <div className="mt-4 flex h-8 items-center justify-center gap-2 rounded-lg bg-white/[0.05] text-sm font-medium text-zinc-100">
                      <Plug className="size-4" />
                      Configure
                    </div>
                  </button>
                );
              })}
            </div>

            <Panel className="overflow-hidden p-4">
              <IntegrationDetails
                copied={copied}
                endpoint={endpoint}
                integration={selected}
                onConnect={connectIntegration}
                onCopy={copyText}
                onDisconnect={disconnectIntegration}
                onTest={testIntegration}
                onTogglePermission={togglePermission}
                state={selectedState}
                testing={testingId === selected.id}
              />
            </Panel>
          </div>

          <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
            <Panel className="p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-200">
                <Zap className="size-4" />
                One-click apply flow
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {[
                  "Detect active editor and project root.",
                  "Request permission before reading local context.",
                  "Generate a patch with exact file paths.",
                  "Preview diff before applying changes.",
                ].map((item, index) => (
                  <div
                    className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3"
                    key={item}
                  >
                    <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-300/10 text-xs text-emerald-200">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6 text-zinc-300">{item}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className="p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                <Activity className="size-4 text-cyan-300" />
                Integration activity
              </div>
              <div className="mt-4 space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.map((item) => (
                    <div
                      className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
                      key={`${item.name}-${item.time}`}
                    >
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <p className="mt-1 text-xs text-zinc-400">{item.action}</p>
                      <p className="mt-2 text-xs text-zinc-500">{item.time}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm leading-6 text-zinc-400">
                    Connect or test an integration to see activity here.
                  </div>
                )}
              </div>
            </Panel>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

function IntegrationDetails({
  copied,
  endpoint,
  integration,
  onConnect,
  onCopy,
  onDisconnect,
  onTest,
  onTogglePermission,
  state,
  testing,
}: {
  copied: string | null;
  endpoint: string;
  integration: Integration;
  onConnect: (id: IntegrationId) => void;
  onCopy: (value: string, label: string) => void;
  onDisconnect: (id: IntegrationId) => void;
  onTest: (id: IntegrationId) => void;
  onTogglePermission: (id: IntegrationId, key: PermissionKey) => void;
  state: IntegrationState;
  testing: boolean;
}) {
  const isRoadmap = integration.status === "roadmap";
  const token = state.token || "Generate by connecting";
  const prompt = buildPrompt(integration, token);

  return (
    <div className="min-w-0 max-w-full overflow-hidden">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-cyan-200">Selected integration</p>
          <h2 className="mt-1 break-words text-2xl font-semibold text-white">
            {integration.name}
          </h2>
        </div>
        <StatusBadge integration={integration} state={state} />
      </div>

      <p className="mt-3 break-words text-sm leading-6 text-zinc-400">{integration.detail}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {state.connected ? (
          <Button
            className="gap-2 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20"
            onClick={() => onDisconnect(integration.id)}
          >
            <Unplug className="size-4" />
            Disconnect
          </Button>
        ) : (
          <Button
            className="gap-2 bg-cyan-300 text-[#071015] hover:bg-cyan-200"
            onClick={() => onConnect(integration.id)}
          >
            <Plug className="size-4" />
            {isRoadmap ? "Watch setup" : "Connect"}
          </Button>
        )}
        <Button
          className="gap-2 border-white/10 bg-white/[0.04] text-zinc-200"
          disabled={testing}
          onClick={() => onTest(integration.id)}
          variant="outline"
        >
          {testing ? <Loader2 className="size-4 animate-spin" /> : <Activity className="size-4" />}
          Test
        </Button>
      </div>

      <div className="mt-5 max-w-full overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] p-3">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_32px] items-start gap-3">
          <div className="flex min-w-0 items-start gap-2">
            <Terminal className="size-4 shrink-0 text-cyan-300" />
            <code
              className="block min-w-0 max-w-full whitespace-normal text-xs leading-5 text-zinc-300"
              style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
            >
              {integration.command}
            </code>
          </div>
          <button
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-zinc-300 hover:bg-white/[0.08]"
            onClick={() => onCopy(integration.command, "Command copied")}
            type="button"
            aria-label="Copy setup command"
          >
            <Clipboard className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <p className="text-sm font-medium text-zinc-200">Setup checklist</p>
        {integration.setup.map((item, index) => (
          <div
            className="grid grid-cols-[28px_1fr] gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3"
            key={item}
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-cyan-300/10 text-xs text-cyan-200">
              {index + 1}
            </span>
            <p className="min-w-0 break-words text-sm leading-6 text-zinc-300">{item}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid min-w-0 gap-3">
        <CopyBlock
          icon={<KeyRound className="size-4 text-amber-300" />}
          label="Integration token"
          value={token}
          onCopy={() => onCopy(token, state.token ? "Token copied" : "Connect first")}
        />
        <CopyBlock
          icon={<Link2 className="size-4 text-cyan-300" />}
          label="Webhook endpoint"
          value={endpoint}
          onCopy={() => onCopy(endpoint, "Endpoint copied")}
        />
        <CopyBlock
          icon={<Clipboard className="size-4 text-emerald-300" />}
          label="Editor handoff prompt"
          value={prompt}
          onCopy={() => onCopy(prompt, "Prompt copied")}
        />
      </div>

      <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
          <ShieldCheck className="size-4 text-emerald-300" />
          Permissions
        </div>
        <div className="mt-3 divide-y divide-white/10">
          {permissionRows.map((row) => (
            <div
              className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              key={row.key}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{row.label}</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">{row.description}</p>
              </div>
              <button
                className={cn(
                  "h-7 w-12 rounded-full p-1 transition",
                  state.permissions[row.key]
                    ? "bg-emerald-300/20"
                    : "bg-white/[0.08]"
                )}
                onClick={() => onTogglePermission(integration.id, row.key)}
                type="button"
                aria-label={`${row.label} ${state.permissions[row.key] ? "enabled" : "disabled"}`}
              >
                <span
                  className={cn(
                    "block size-5 rounded-full transition",
                    state.permissions[row.key]
                      ? "translate-x-5 bg-emerald-300"
                      : "bg-zinc-500"
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {copied ? <p className="mt-3 text-xs text-emerald-300">{copied}</p> : null}
    </div>
  );
}

function MetricCard({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "cyan" | "emerald" | "amber" | "violet";
  value: string;
}) {
  const toneClass = {
    amber: "text-amber-300",
    cyan: "text-cyan-300",
    emerald: "text-emerald-300",
    violet: "text-violet-300",
  }[tone];

  return (
    <Panel className="p-4">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className={cn("mt-3 text-2xl font-semibold", toneClass)}>{value}</p>
    </Panel>
  );
}

function StatusBadge({
  integration,
  state,
}: {
  integration: Integration;
  state: IntegrationState;
}) {
  if (state.connected) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-300/10 px-2 py-1 text-xs text-emerald-200">
        <CheckCircle2 className="size-3" />
        Connected
      </span>
    );
  }

  if (integration.status === "roadmap") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-300/10 px-2 py-1 text-xs text-amber-200">
        <XCircle className="size-3" />
        Roadmap
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-1 text-xs text-zinc-400">
      <Check className="size-3" />
      Available
    </span>
  );
}

function CopyBlock({
  icon,
  label,
  onCopy,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  onCopy: () => void;
  value: string;
}) {
  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_32px] gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0">{icon}</span>
            <p className="min-w-0 truncate text-xs font-medium uppercase text-zinc-500">
              {label}
            </p>
          </div>
          <code
            className="mt-2 block max-h-28 min-w-0 max-w-full overflow-y-auto overflow-x-hidden whitespace-pre-wrap rounded-md border border-white/10 bg-[#0f1318] px-2 py-2 font-mono text-xs leading-5 text-zinc-300"
            style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
          >
            {value}
          </code>
        </div>
        <button
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-zinc-300 hover:bg-white/[0.08]"
          onClick={onCopy}
          type="button"
          aria-label={`Copy ${label}`}
        >
          <Clipboard className="size-4" />
        </button>
      </div>
    </div>
  );
}

const permissionRows: Array<{
  key: PermissionKey;
  label: string;
  description: string;
}> = [
  {
    key: "readContext",
    label: "Read project context",
    description: "Allow future integrations to inspect file paths and selected code.",
  },
  {
    key: "applyPatch",
    label: "Apply patches",
    description: "Allow one-click apply after a visible diff preview.",
  },
  {
    key: "saveHistory",
    label: "Save analysis history",
    description: "Store integration-triggered analyses in History, Patterns, and Learning.",
  },
  {
    key: "shareDiagnostics",
    label: "Share diagnostics",
    description: "Send sanitized logs, framework hints, and stack traces to analysis.",
  },
];

function createInitialState(): StoredState {
  return integrations.reduce((acc, integration) => {
    acc[integration.id] = {
      connected: false,
      permissions: { ...defaultPermissions },
    };
    return acc;
  }, {} as StoredState);
}

function getStorageKey(userId?: string) {
  return `fixflow:integrations:${userId || "guest"}`;
}

function loadStates(userId?: string): StoredState {
  if (typeof window === "undefined") return createInitialState();

  try {
    const parsed = JSON.parse(window.localStorage.getItem(getStorageKey(userId)) || "{}");
    const initial = createInitialState();

    for (const integration of integrations) {
      const stored = parsed[integration.id] as Partial<IntegrationState> | undefined;
      if (!stored || typeof stored !== "object") continue;

      initial[integration.id] = {
        connected: Boolean(stored.connected),
        token: typeof stored.token === "string" ? stored.token : undefined,
        lastChecked:
          typeof stored.lastChecked === "string" ? stored.lastChecked : undefined,
        lastAction:
          typeof stored.lastAction === "string" ? stored.lastAction : undefined,
        permissions: {
          ...defaultPermissions,
          ...(stored.permissions || {}),
        },
      };
    }

    return initial;
  } catch {
    return createInitialState();
  }
}

function saveStates(states: StoredState, userId?: string) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(states));
  } catch {
    // Integrations are local preference state; the page still works without persistence.
  }
}

function makeToken(id: IntegrationId) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replaceAll("-", "")
      : `${Date.now()}${Math.random().toString(36).slice(2)}`;

  return `ff_${id}_${random.slice(0, 24)}`;
}

function makeEndpoint(userId?: string) {
  const suffix = userId ? userId.slice(0, 8) : "local";
  return `/api/integrations/webhook/${suffix}`;
}

function buildPrompt(integration: Integration, token: string) {
  return [
    `FixFlow ${integration.name} handoff`,
    `Token: ${token}`,
    "Task: Diagnose the current error, explain the root cause, propose a minimal patch, and include a prevention note.",
    "Rule: Do not apply changes before showing a diff preview.",
  ].join("\n");
}

function buildActivity(states: StoredState) {
  return integrations
    .map((integration) => {
      const state = states[integration.id];
      if (!state.lastAction || !state.lastChecked) return null;

      return {
        action: state.lastAction,
        name: integration.name,
        time: formatHistoryTime(state.lastChecked),
      };
    })
    .filter((item): item is { action: string; name: string; time: string } => Boolean(item))
    .slice(0, 5);
}

function hasToken(states: StoredState) {
  return Object.values(states).some((state) => Boolean(state.token));
}
