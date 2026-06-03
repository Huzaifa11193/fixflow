"use client";

import { Mail, User, Calendar, Copy, Check } from "lucide-react";
import { useState } from "react";

import { AppShell, Panel } from "@/components/fixflow/app-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function ProfilePage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ProtectedRoute>
      <AppShell
        active="Settings"
        description="View and manage your account information and profile details."
        title="Account Profile"
      >
        <div className="grid gap-6 max-w-2xl">
          <Panel>
            <div className="border-b border-white/10 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                <User className="size-4 text-cyan-300" />
                Profile Information
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-cyan-400 flex items-center justify-center text-2xl font-bold text-[#071015]">
                  {user?.email?.[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Profile Avatar</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Generated from your email
                  </p>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={user?.user_metadata?.full_name || ""}
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.04] text-zinc-400 outline-none"
                />
                <p className="text-xs text-zinc-500 mt-2">
                  Edit your full name in Supabase settings or contact support
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Email Address
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.04] text-zinc-100 outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(user?.email || "")}
                    className="px-3 py-2 rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] transition"
                  >
                    {copied ? (
                      <Check className="size-4 text-emerald-400" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* User ID */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  User ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={user?.id || ""}
                    disabled
                    className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.04] text-zinc-400 outline-none text-xs font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(user?.id || "")}
                    className="px-3 py-2 rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] transition"
                  >
                    {copied ? (
                      <Check className="size-4 text-emerald-400" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  Your unique identifier in the system
                </p>
              </div>

              {/* Account Created */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Account Created
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.04]">
                  <Calendar className="size-4 text-zinc-400" />
                  <span className="text-zinc-300">
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "N/A"}
                  </span>
                </div>
              </div>

              {/* Email Verified */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Email Verification Status
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10">
                  <div className="size-2 rounded-full bg-emerald-400" />
                  <span className="text-emerald-200">
                    {user?.email_confirmed_at ? "Verified" : "Pending"}
                  </span>
                </div>
              </div>
            </div>
          </Panel>

          {/* Account Actions */}
          <Panel>
            <div className="border-b border-white/10 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                <Mail className="size-4 text-cyan-300" />
                Account Actions
              </div>
            </div>

            <div className="p-6 space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"
              >
                <Mail className="size-4" />
                Change Email
              </Button>
              <p className="text-xs text-zinc-500 text-center">
                Contact support to change your email address
              </p>
            </div>
          </Panel>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
