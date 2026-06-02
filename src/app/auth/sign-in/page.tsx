import Link from "next/link";
import { LockKeyhole, ShieldCheck } from "lucide-react";

import { AuthForm } from "@/components/fixflow/auth-form";
import { LogoLockup } from "@/components/fixflow/logo";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-[#070a0f] p-4 text-zinc-100 md:p-6">
      <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_80%_15%,rgba(52,211,153,0.12),transparent_24%)]" />
      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-48px)] max-w-6xl gap-6 lg:grid-cols-[1fr_430px]">
        <section className="flex flex-col justify-between rounded-lg border border-white/10 bg-[#11161d]/90 p-6">
          <Link className="flex items-center gap-3" href="/">
            <LogoLockup />
          </Link>

          <div className="max-w-2xl py-16">
            <p className="text-sm font-medium uppercase text-cyan-300">
              Welcome back
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-white md:text-5xl">
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
          <div className="w-full rounded-lg border border-white/10 bg-[#151a21]/95 p-5 shadow-2xl shadow-black/30">
            <div className="flex size-11 items-center justify-center rounded-lg bg-emerald-300/10 text-emerald-200">
              <LockKeyhole className="size-5" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-white">Login</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Sign in with the email and password attached to your Supabase
              account.
            </p>

            <AuthForm mode="sign-in" />

            <Link
              className="mt-4 inline-flex h-8 w-full items-center justify-center rounded-lg bg-white/[0.05] px-2.5 text-sm font-medium text-zinc-100 transition hover:bg-white/[0.08]"
              href="/app"
            >
              Enter demo app
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
