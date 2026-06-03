"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Check, ShieldCheck, UserPlus } from "lucide-react";

import { AuthForm } from "@/components/fixflow/auth-form";
import { LogoLockup } from "@/components/fixflow/logo";
import { useAuth } from "@/lib/auth-context";

export function SignUpPageContent() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/app");
    }
  }, [isAuthenticated, router]);
  return (
    <main className="min-h-screen bg-[#070a0f] p-4 text-zinc-100 md:p-6">
      <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_18%_18%,rgba(52,211,153,0.14),transparent_26%),radial-gradient(circle_at_78%_18%,rgba(34,211,238,0.14),transparent_26%)]" />
      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-32px)] max-w-6xl gap-4 sm:gap-6 lg:min-h-[calc(100vh-48px)] lg:grid-cols-[430px_minmax(0,1fr)]">
        <section className="flex items-center">
          <div className="w-full rounded-lg border border-white/10 bg-[#151a21]/95 p-4 shadow-2xl shadow-black/30 sm:p-5">
            <div className="flex size-11 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-200">
              <UserPlus className="size-5" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-white">
              Create account
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Start free, save history, and unlock the internal workspace with
              Supabase Auth.
            </p>

            <AuthForm mode="sign-up" />
          </div>
        </section>

        <section className="flex flex-col justify-between rounded-lg border border-white/10 bg-[#11161d]/90 p-4 sm:p-6">
          <Link className="flex items-center gap-3" href="/">
            <LogoLockup />
          </Link>

          <div className="max-w-2xl py-10 sm:py-16">
            <p className="text-sm font-medium uppercase text-emerald-300">
              Free-first MVP
            </p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl md:text-5xl">
              Save fixes, learn patterns, and ship calmer.
            </h1>
            <div className="mt-6 grid gap-3">
              {[
                "Paste errors and get ranked fixes.",
                "Track repeated bug patterns.",
                "Learn prevention in short lessons.",
              ].map((item) => (
                <div className="flex gap-3 text-sm leading-6 text-zinc-300" key={item}>
                  <Check className="size-4 text-emerald-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-emerald-200">
            <ShieldCheck className="size-4" />
            Basic use stays free.
          </div>
        </section>
      </div>
    </main>
  );
}
