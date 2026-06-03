"use client";

import Link from "next/link";
import {
  Bell,
  Database,
  KeyRound,
  ShieldCheck,
  SlidersHorizontal,
  User,
  Lock,
  LogOut,
} from "lucide-react";

import { AppShell, Panel } from "@/components/fixflow/app-shell";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";

const settings = [
  { icon: KeyRound, label: "AI provider", value: "OpenAI / Claude / Grok ready" },
  { icon: Database, label: "History storage", value: "Supabase cloud with local cache fallback" },
  { icon: ShieldCheck, label: "Project context", value: "Ask before reading local files" },
  { icon: Bell, label: "Feedback prompts", value: "Ask after every resolved analysis" },
];

const accountSettings = [
  {
    icon: User,
    label: "Profile",
    description: "View and manage your account information",
    href: "/settings/profile",
    color: "text-blue-400",
  },
  {
    icon: Lock,
    label: "Change Password",
    description: "Update your account password",
    href: "/settings/change-password",
    color: "text-amber-400",
  },
];

export default function SettingsPage() {
  const { logout } = useAuth();

  return (
    <ProtectedRoute>
      <AppShell
        active="Settings"
        description="Control model provider, data storage, privacy, cache behavior, and account settings."
        title="Settings"
      >
        <div className="grid gap-6">
          {/* Account Settings */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Account</h2>
            <div className="grid gap-3">
              {accountSettings.map((setting) => {
                const Icon = setting.icon;
                return (
                  <Link
                    key={setting.label}
                    href={setting.href}
                    className="group rounded-lg border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.05] transition"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-white/[0.05] group-hover:bg-white/[0.08] transition">
                        <Icon className={`size-5 ${setting.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white">{setting.label}</p>
                        <p className="text-sm text-zinc-400">{setting.description}</p>
                      </div>
                      <div className="text-zinc-500 group-hover:text-zinc-300 transition">
                        →
                      </div>
                    </div>
                  </Link>
                );
              })}

              <button
                onClick={logout}
                className="group rounded-lg border border-rose-400/20 bg-rose-400/5 p-4 hover:bg-rose-400/10 transition text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-rose-400/10">
                    <LogOut className="size-5 text-rose-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-rose-200">Logout</p>
                    <p className="text-sm text-rose-200/60">Sign out of your account</p>
                  </div>
                  <div className="text-rose-400/50 group-hover:text-rose-400 transition">
                    →
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Workspace Preferences */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Workspace Preferences</h2>
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
                      <button
                        className="h-7 w-12 rounded-full bg-emerald-300/20 p-1"
                        type="button"
                        aria-label={`${item.label} enabled`}
                      >
                        <span className="block size-5 translate-x-5 rounded-full bg-emerald-300" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </div>

          {/* Privacy & Security */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Privacy & Security</h2>
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
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
