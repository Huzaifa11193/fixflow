"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";

import { AuthForm } from "@/components/fixflow/auth-form";
import { LogoLockup } from "@/components/fixflow/logo";
import { useAuth } from "@/lib/auth-context";

export function SignInPageContent() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/app");
    }
  }, [isAuthenticated, router]);
  return (
    <main className="min-h-screen bg-[#070a0f] p-4 text-zinc-100 md:p-6">
      <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_80%_15%,rgba(52,211,153,0.12),transparent_24%)]" />
      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-32px)] max-w-6xl gap-4 sm:gap-6 lg:min-h-[calc(100vh-48px)] lg:grid-cols-[minmax(0,1fr)_430px]">
        <section className="flex flex-col justify-between rounded-lg border border-white/10 bg-[#11161d]/90 p-4 sm:p-6">
          <Link className="flex items-center gap-3" href="/">
            <LogoLockup />
          </Link>

          <div className="max-w-2xl py-10 sm:py-16">
            <p className="text-sm font-medium uppercase text-cyan-300">
              Welcome back
            </p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl md:text-5xl">
              Continue fixing errors with your saved history.
            </h1>
            <p className="mt-5 text-base leading-7 text-zinc-400">
              Sign in to access analyses, repeated patterns, lessons,
              integrations, and settings from the current FixFlow app UI.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-emerald-200">
            <ShieldCheck className="size-4" />
            Project context stays permission-first.
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full rounded-lg border border-white/10 bg-[#151a21]/95 p-4 shadow-2xl shadow-black/30 sm:p-5">
            <div className="flex size-11 items-center justify-center rounded-lg bg-emerald-300/10 text-emerald-200">
              <LockKeyhole className="size-5" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-white">Login</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Sign in with the email and password attached to your Supabase
              account.
            </p>

            <AuthForm mode="sign-in" />
          </div>
        </section>
      </div>
    </main>
  );
}
