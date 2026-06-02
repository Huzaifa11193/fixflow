import Link from "next/link";
import { ArrowRight, Check, Code2, Mail, ShieldCheck, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LogoLockup } from "@/components/fixflow/logo";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-[#070a0f] p-4 text-zinc-100 md:p-6">
      <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_18%_18%,rgba(52,211,153,0.14),transparent_26%),radial-gradient(circle_at_78%_18%,rgba(34,211,238,0.14),transparent_26%)]" />
      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-48px)] max-w-6xl gap-6 lg:grid-cols-[430px_1fr]">
        <section className="flex items-center">
          <div className="w-full rounded-lg border border-white/10 bg-[#151a21]/95 p-5 shadow-2xl shadow-black/30">
            <div className="flex size-11 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-200">
              <UserPlus className="size-5" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-white">Create account</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Start free, save history, and unlock the internal workspace.
            </p>

            <form className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm text-zinc-300">
                Name
                <input
                  className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-cyan-300/60"
                  placeholder="Your name"
                />
              </label>
              <label className="grid gap-2 text-sm text-zinc-300">
                Email
                <input
                  className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-cyan-300/60"
                  placeholder="you@example.com"
                  type="email"
                />
              </label>
              <label className="grid gap-2 text-sm text-zinc-300">
                Password
                <input
                  className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-cyan-300/60"
                  placeholder="Create a password"
                  type="password"
                />
              </label>
              <Button className="h-11 gap-2 bg-emerald-400 text-[#071015] hover:bg-emerald-300">
                Sign up
                <ArrowRight className="size-4" />
              </Button>
            </form>

            <div className="mt-4 grid gap-3">
              <Button className="h-11 gap-2 border-white/10 bg-white/[0.04] text-zinc-100 hover:bg-white/[0.08]" variant="outline">
                <Mail className="size-4" />
                Continue with email link
              </Button>
              <Button className="h-11 gap-2 border-white/10 bg-white/[0.04] text-zinc-100 hover:bg-white/[0.08]" variant="outline">
                <Code2 className="size-4" />
                Continue with Git provider
              </Button>
            </div>

            <div className="mt-6 flex items-center justify-between text-sm">
              <span className="text-zinc-500">Already have an account?</span>
              <Link className="font-medium text-cyan-300 hover:text-cyan-200" href="/auth/sign-in">
                Login
              </Link>
            </div>
          </div>
        </section>

        <section className="flex flex-col justify-between rounded-lg border border-white/10 bg-[#11161d]/90 p-6">
          <Link className="flex items-center gap-3" href="/">
            <LogoLockup />
          </Link>

          <div className="max-w-2xl py-16">
            <p className="text-sm font-medium uppercase text-emerald-300">Free-first MVP</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-white md:text-5xl">
              Save fixes, learn patterns, and ship calmer.
            </h1>
            <div className="mt-6 grid gap-3">
              {[
                "Paste errors and get ranked fixes.",
                "Track repeated bug patterns.",
                "Learn prevention in short lessons.",
              ].map((item) => (
                <div className="flex gap-3 text-sm text-zinc-300" key={item}>
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
