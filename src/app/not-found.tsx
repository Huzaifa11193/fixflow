import Link from "next/link";

import { LogoLockup } from "@/components/fixflow/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#050507] px-6 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col">
        <LogoLockup />

        <section className="flex flex-1 flex-col items-start justify-center gap-6">
          <div className="space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
              Route not found
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-tight text-white md:text-7xl">
              This flow does not exist yet.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-zinc-300">
              Head back to the analyzer and paste the error you want FixFlow to
              diagnose.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link className={buttonVariants({ size: "lg" })} href="/app">
              Open analyzer
            </Link>
            <Link
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "border-white/15 bg-white/5 text-white hover:bg-white/10"
              )}
              href="/"
            >
              Go home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
