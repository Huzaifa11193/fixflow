"use client";

import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  Brain,
  CreditCard,
  History,
  Plug,
  Settings,
  Sparkles,
  Terminal,
  LogOut,
  User,
  KeyRound,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { LogoLockup } from "@/components/fixflow/logo";
import { useAuth } from "@/lib/auth-context";
import {
  formatHistoryTime,
  getSeverityTone,
  HistoryItem,
  loadHistory,
  subscribeToHistory,
} from "@/lib/history";

type AppShellProps = {
  active: string;
  children: React.ReactNode;
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
};

const navItems = [
  { label: "Analyze", href: "/app", icon: Terminal },
  { label: "History", href: "/history", icon: History },
  { label: "Patterns", href: "/patterns", icon: BarChart3 },
  { label: "Learning", href: "/learning", icon: BookOpen },
  { label: "Integrations", href: "/integrations", icon: Plug },
  { label: "Pricing", href: "/pricing", icon: CreditCard },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function AppShell({
  active,
  children,
  eyebrow = "FixFlow MVP",
  title,
  description,
  action,
}: AppShellProps) {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [recentHistory, setRecentHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function refreshHistory() {
      const items = await loadHistory(user?.id);
      if (!cancelled) setRecentHistory(items.slice(0, 3));
    }

    void refreshHistory();
    const unsubscribe = subscribeToHistory(() => void refreshHistory());

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [user?.id]);

  return (
    <main className="min-h-screen bg-[#0b0d10] text-zinc-100">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-white/10 bg-[#11161d] lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col">
            <Link
              className="flex h-16 items-center gap-3 border-b border-white/10 px-5"
              href="/"
            >
              <LogoLockup />
            </Link>

            <div className="flex-1 px-3 py-4">
              <Link
                className="flex h-10 w-full items-center justify-start gap-2 rounded-lg bg-cyan-400 px-3 text-sm font-medium text-[#071015] transition hover:bg-cyan-300"
                href="/app"
              >
                <Sparkles className="size-4" />
                New analysis
              </Link>

              <nav className="mt-5 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = active === item.label;

                  return (
                    <Link
                      className={`flex h-9 items-center gap-2 rounded-lg px-3 text-sm transition ${
                        isActive
                          ? "bg-white/[0.08] text-white"
                          : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
                      }`}
                      href={item.href}
                      key={item.label}
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-6 px-2">
                <div className="flex items-center gap-2 text-xs font-medium uppercase text-zinc-500">
                  <History className="size-3.5" />
                  Recent fixes
                </div>
                <div className="mt-3 space-y-2">
                  {recentHistory.length > 0 ? (
                    recentHistory.map((item) => (
                    <Link
                      className="group grid grid-cols-[4px_1fr] items-center gap-3 rounded-lg px-2 py-2.5 transition hover:bg-white/[0.04]"
                      href="/history"
                      key={item.id}
                    >
                      <span
                        className={`h-8 rounded-full bg-current ${getSeverityTone(
                          item.analysis.severity
                        )}`}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-medium text-zinc-200">
                          {item.title}
                        </span>
                        <span className="mt-1 block text-[11px] text-zinc-500">
                          {item.analysis.category} - {formatHistoryTime(item.createdAt)}
                        </span>
                      </span>
                    </Link>
                    ))
                  ) : (
                    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3 text-xs leading-5 text-zinc-500">
                      Your analyzed errors will appear here.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 p-4 space-y-3">
              <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-200">
                  <Brain className="size-4" />
                  Local context ready
                </div>
                <p className="mt-2 text-xs leading-5 text-emerald-100/70">
                  Basic error patterns and the last five fixes stay available offline.
                </p>
              </div>

              {user && (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-full flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm hover:bg-white/[0.08] transition"
                  >
                    <div className="w-6 h-6 rounded-full bg-cyan-400 flex items-center justify-center text-[#071015] text-xs font-bold">
                      {user.email?.[0].toUpperCase()}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-xs font-medium truncate text-white">
                        {user.user_metadata?.full_name || user.email}
                      </p>
                      <p className="text-[10px] text-zinc-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </button>

                  {showUserMenu && (
                    <div className="absolute bottom-full mb-2 w-full rounded-lg border border-white/10 bg-[#0f1318] shadow-lg z-50">
                      <Link
                        href="/settings"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.08] transition rounded-t-lg"
                      >
                        <User className="size-4" />
                        Profile
                      </Link>
                      <Link
                        href="/settings/change-password"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-white/[0.08] transition"
                      >
                        <KeyRound className="size-4" />
                        Change Password
                      </Link>
                      <button
                        onClick={async () => {
                          await logout();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-white/[0.08] transition rounded-b-lg border-t border-white/10"
                      >
                        <LogOut className="size-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col">
          <header className="flex min-h-16 flex-col gap-3 border-b border-white/10 bg-[#0d1117] px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
            <div>
              <p className="text-xs font-medium uppercase text-cyan-300">
                {eyebrow}
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-normal text-white">
                {title}
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">
                {description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {action ?? (
                <Button className="gap-2 bg-emerald-400 text-[#071015] hover:bg-emerald-300">
                  <Sparkles className="size-4" />
                  Analyze
                </Button>
              )}
            </div>
          </header>

          <div className="flex-1 bg-[#0f1318] p-4 md:p-6">{children}</div>
        </section>
      </div>
    </main>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-white/10 bg-[#151a21] ${className}`}>
      {children}
    </section>
  );
}
