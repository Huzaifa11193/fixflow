"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type AuthMode = "sign-in" | "sign-up";

type AuthFormProps = {
  mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isSignUp = mode === "sign-up";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!isSupabaseConfigured || !supabase) {
      setError(
        "Add your Supabase URL and publishable key in .env.local, then restart the dev server."
      );
      return;
    }

    setIsLoading(true);

    const result = isSignUp
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
            emailRedirectTo:
              typeof window !== "undefined"
                ? `${window.location.origin}/app`
                : undefined,
          },
        })
      : await supabase.auth.signInWithPassword({
          email,
          password,
        });

    setIsLoading(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (isSignUp && !result.data.session) {
      setMessage("Account created. Check your email to confirm your account.");
      return;
    }

    router.push("/app");
    router.refresh();
  }

  return (
    <>
      {!isSupabaseConfigured ? (
        <div className="mt-5 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100/85">
          Supabase is not configured yet. Replace the placeholder values in{" "}
          <span className="font-mono">.env.local</span> to enable real auth.
        </div>
      ) : null}

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        {isSignUp ? (
          <label className="grid gap-2 text-sm text-zinc-300">
            Name
            <input
              className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-cyan-300/60"
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              required
              value={name}
            />
          </label>
        ) : null}

        <label className="grid gap-2 text-sm text-zinc-300">
          Email
          <input
            className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-cyan-300/60"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
        </label>

        <label className="grid gap-2 text-sm text-zinc-300">
          Password
          <input
            className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-cyan-300/60"
            minLength={6}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={isSignUp ? "Create a password" : "Enter your password"}
            required
            type="password"
            value={password}
          />
        </label>

        {error ? (
          <div className="rounded-lg border border-rose-300/20 bg-rose-300/10 p-3 text-sm leading-6 text-rose-100/85">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm leading-6 text-emerald-100/85">
            {message}
          </div>
        ) : null}

        <Button
          className={`h-11 gap-2 ${
            isSignUp
              ? "bg-emerald-400 text-[#071015] hover:bg-emerald-300"
              : "bg-cyan-400 text-[#071015] hover:bg-cyan-300"
          }`}
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowRight className="size-4" />
          )}
          {isSignUp ? "Sign up" : "Login"}
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm">
        <span className="text-zinc-500">
          {isSignUp ? "Already have an account?" : "New to FixFlow?"}
        </span>
        <Link
          className="font-medium text-cyan-300 hover:text-cyan-200"
          href={isSignUp ? "/auth/sign-in" : "/auth/sign-up"}
        >
          {isSignUp ? "Login" : "Create account"}
        </Link>
      </div>
    </>
  );
}
